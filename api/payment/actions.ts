"use server";

import { createClient } from "@/utils/supabase/server";
import { PaymentType } from "./type";
import { revalidatePath } from "next/cache";

const TABLE_MAP = {
  income: "payment",
  expenditure: "expenditure",
};

export async function getPaymentMessageListAction(academyCode: string) {
  const supabase = await createClient();

  // 1. 문자 수신 동의한(msg_yn='Y') 고객 명단 가져오기
  // ⚠️ 여기서 동명이인이 있을 수 있음 -> 나중에 이름으로 매핑할 때 주의
  const { data: customers, error: custError } = await supabase
    .from("customers")
    .select("id, name, fee, count, note, fee_yn")
    .eq("academy_code", academyCode)
    .eq("msg_yn", "Y");

  if (custError || !customers || customers.length === 0) {
    return [];
  }

  console.log(customers);
  // 2. 'L'(Last day) 표시가 있는 출석 기록 가져오기
  // 🌟 날짜 내림차순(DESC) 정렬이 핵심! (가장 최신 날짜가 먼저 옴)
  const { data: attendanceData, error: attError } = await supabase
    .from("attendance")
    .select("name, date")
    .eq("academy_code", academyCode)
    .like("content", "%L%") // 'L' 포함
    .order("date", { ascending: false });

  console.log(attendanceData);
  if (attError || !attendanceData) {
    return [];
  }

  // 3. 데이터 병합 (중복 제거 로직)
  const resultMap = new Map();

  // 출석 데이터는 이미 '최신순'으로 정렬되어 있습니다.
  attendanceData.forEach((att) => {
    const name = att.name;

    // 🌟 [핵심] 이미 맵에 이름이 등록되어 있다면?
    // -> 이미 더 최신 날짜('L')가 등록된 것이므로, 과거 데이터(현재 loop)는 무시합니다.
    if (resultMap.has(name)) return;

    // 고객 명단에서 해당 이름 찾기
    // (만약 customers에 동명이인이 있다면, 첫 번째 사람 정보를 가져옵니다.)
    // * 정확성을 높이려면 출석부에도 customer_id가 있어야 하지만, 현재 구조상 이름 매칭합니다.
    const matchedCustomer = customers.find((c) => c.name === name);
    if (matchedCustomer) {
      resultMap.set(name, {
        id: matchedCustomer.id,
        name: name,
        date: att.date, // 가장 최신의 'L' 날짜
        fee: matchedCustomer.fee,
        count: matchedCustomer.count,
        fee_yn: matchedCustomer.fee_yn,
        note: matchedCustomer.note,
        msg_yn: true,
      });
    }
  });

  console.log(resultMap);
  // 4. 이름순 정렬하여 반환
  const result = Array.from(resultMap.values()).sort((a: any, b: any) =>
    a.name.localeCompare(b.name)
  );

  return result;
}

// 🌟 [신규] 삭제 Action
export async function deletePaymentAction(
  id: number,
  type: PaymentType,
  academyCode: string
) {
  const supabase = await createClient();
  const tableName = TABLE_MAP[type];

  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)
      .eq("academy_code", academyCode); // 안전장치: 내 학원 데이터만 삭제

    if (error) {
      console.error(`Delete ${type} Error:`, error);
      throw new Error(error.message);
    }

    revalidatePath("/payment");
    return { success: true, message: "삭제되었습니다." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "삭제에 실패했습니다." };
  }
}

export async function updatePaymentStatusBatchAction(
  targetIds: number[],
  key: string,
  value: string,
  updaterId: string,
  academyCode: string
) {
  const supabase = await createClient();

  // 1. 값 확인용 로그 (서버 콘솔에서 확인)
  console.log("🛠️ [Batch Update Start]", {
    targetIds,
    key,
    value,
    academyCode,
  });

  const { data, error } = await supabase
    .from("customers")
    .update({
      [key.toLowerCase()]: value,
      updater_id: updaterId,
      updater_date: new Date().toISOString(),
    })
    .in("id", targetIds)
    .eq("academy_code", academyCode)
    .select(); // 🌟 [핵심] select()를 붙여야 업데이트된 행 정보를 받아올 수 있습니다.

  // 2. 에러 처리
  if (error) {
    console.error("❌ Batch Update Error:", error);
    return { success: false, message: error.message };
  }

  // 3. 업데이트된 행 개수 확인
  if (!data || data.length === 0) {
    console.warn("⚠️ 업데이트된 데이터가 0건입니다. (조건 불일치)");
    return {
      success: false,
      message: "조건에 맞는 데이터가 없어 업데이트되지 않았습니다.",
    };
  }

  console.log(`✅ ${data.length}건 업데이트 성공!`);
  return { success: true };
}

// 현금영수증 목록 조회
export async function getCashReceiptListAction(
  academyCode: string,
  year: string,
  month: string
) {
  const supabase = await createClient();

  // 1. 해당 월의 '현금' 결제 내역 조회 (payment)
  const { data: payments, error: paymentError } = await supabase
    .from("payment")
    .select("*")
    .eq("academy_code", academyCode)
    .eq("year", year)
    .eq("month", month)
    .eq("card", "현금") // 카드 컬럼이 '현금'인 것만
    .order("day", { ascending: true });

  if (paymentError) {
    console.error("Payment Select Error:", paymentError);
    return [];
  }

  // 2. 원생 정보 조회 (현금영수증 번호 매핑용)
  // 이름으로 매핑하기 위해 전체 원생을 가져오거나, payments에 있는 이름만 추려낼 수 있음
  // 여기서는 간단하게 전체 활성 원생을 가져와서 매핑합니다.
  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("name, cash_number")
    .eq("academy_code", academyCode);

  if (customerError) {
    console.error("Customer Select Error:", customerError);
    // 고객 정보 에러나도 결제 내역은 보여줘야 함
  }

  // 3. 데이터 병합 (Payment + Cash Number)
  const mergedList = payments.map((p) => {
    const customer = customers?.find((c) => c.name === p.name);
    return {
      ...p,
      cash_number: customer?.cash_number || "", // 현금영수증 번호 추가
    };
  });

  return mergedList;
}

// 데이터 수정 (Payment 또는 Customer 업데이트)
export async function updateCashReceiptAction(payload: {
  id: number; // payment ID
  name: string; // 원생 이름 (customer 업데이트용)
  field: string; // 수정할 필드명 (date, cash_number, fee, note 등)
  value: string;
  academyCode: string;
  updaterId: string;
}) {
  const supabase = await createClient();
  const { id, name, field, value, academyCode, updaterId } = payload;
  const now = new Date().toISOString();

  try {
    // Case 1: 현금영수증 번호 수정 -> Customers 테이블 업데이트
    if (field === "cash_number") {
      const { error } = await supabase
        .from("customers")
        .update({
          cash_number: value,
          updater_id: updaterId,
          updater_date: now,
        })
        .eq("name", name) // 이름으로 매칭 (동명이인 이슈가 있다면 로직 보완 필요)
        .eq("academy_code", academyCode);

      if (error) throw error;
    }
    // Case 2: 날짜 수정 -> Payment 테이블 (year, month, day) 분리 업데이트
    else if (field === "date") {
      // value format: "20251225" (8자리)
      const y = value.substring(0, 4);
      const m = value.substring(4, 6);
      const d = value.substring(6, 8);

      const { error } = await supabase
        .from("payment")
        .update({
          year: y,
          month: m,
          day: d,
          updater_id: updaterId,
          updater_date: now,
        })
        .eq("id", id);

      if (error) throw error;
    }
    // Case 3: 발행 여부 (register) 수정 -> 'O'/'X' 대신 'Y'/'N' 변환 로직이 있다면 적용
    else if (field === "register") {
      const { error } = await supabase
        .from("payment")
        .update({
          register: value,
          updater_id: updaterId,
          updater_date: now,
        })
        .eq("id", id);
      if (error) throw error;
    }
    // Case 4: 그 외 일반 필드 (fee, note 등) -> Payment 테이블 업데이트
    else {
      const { error } = await supabase
        .from("payment")
        .update({
          [field]: value,
          updater_id: updaterId,
          updater_date: now,
        })
        .eq("id", id);

      if (error) throw error;
    }

    revalidatePath("/cash-receipt"); // 페이지 갱신
    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, message: error.message };
  }
}

// 🌟 [추가] 현금영수증 일괄 상태 변경 (Batch Update)
export async function updateCashReceiptBatchAction(
  targetIds: number[],
  value: string, // 'Y' or 'N'
  updaterId: string,
  academyCode: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment")
    .update({
      register: value, // 발행 여부 컬럼 업데이트
      updater_id: updaterId,
      updater_date: new Date().toISOString(),
    })
    .in("id", targetIds) // 체크된 ID들
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Batch Update Error:", error);
    return { success: false, message: error.message };
  }

  revalidatePath("/cash-receipt");
  return { success: true };
}

// 월별 데이터 조회 및 가공
export async function getRegisterReportAction(
  academyCode: string,
  year: string
) {
  const supabase = await createClient();

  // 1. 해당 연도의 모든 수납 내역 조회
  const { data: rawData, error } = await supabase
    .from("payment")
    .select("id, name, month, day, fee")
    .eq("academy_code", academyCode)
    .eq("year", year)
    .order("name", { ascending: true }); // 이름순 정렬

  if (error) {
    console.error("Get Register Report Error:", error);
    return { list: [], total: {} };
  }

  // 2. 데이터 가공 (학생별, 월별 매핑)
  const reportMap = new Map<string, any>();
  const monthTotals: Record<string, number> = {}; // 월별 합계 저장용

  // 1~12월 초기화
  for (let i = 1; i <= 12; i++) {
    const m = String(i).padStart(2, "0");
    monthTotals[m] = 0;
  }

  rawData.forEach((item: any) => {
    // 학생 데이터 초기화
    if (!reportMap.has(item.name)) {
      reportMap.set(item.name, {
        name: item.name,
        months: {},
        totalSum: 0,
      });
    }

    const studentData = reportMap.get(item.name);
    const monthKey = String(item.month).padStart(2, "0"); // "01", "02"...

    // 해당 월에 데이터가 이미 있으면 합산 (같은 달에 2번 결제한 경우 등)
    if (!studentData.months[monthKey]) {
      studentData.months[monthKey] = {
        fee: 0,
        day: "",
        items: [], // 상세 내역 보관
      };
    }

    const currentMonthData = studentData.months[monthKey];

    // 금액 합산
    const fee = Number(item.fee || 0);
    currentMonthData.fee += fee;

    // 날짜 표시 (여러 건이면 콤마로 구분하거나 가장 최근 것 사용)
    // 여기서는 기존 로직처럼 단순화하여 표시
    if (item.day) {
      currentMonthData.day = item.day; // 마지막 날짜 덮어쓰기 or 로직 수정 가능
    }

    // 학생별 총계 누적
    studentData.totalSum += fee;

    // 전체 월별 합계 누적
    monthTotals[monthKey] += fee;
  });

  // Map -> Array 변환
  const list = Array.from(reportMap.values());

  // 전체 총합 계산
  const grandTotal = Object.values(monthTotals).reduce((a, b) => a + b, 0);

  return {
    list, // 학생별 리스트
    monthTotals, // 월별 총 합계 { "01": 1000, "02": 2000 ... }
    grandTotal, // 전체 총 합계
  };
}

// ✅ 특정 학생 납입증명서용 데이터 조회
export async function getStudentPaymentDataAction(
  academyCode: string,
  year: string,
  name: string
) {
  const supabase = await createClient();

  // 1. 해당 학생의 1년치 결제 내역 조회
  const { data, error } = await supabase
    .from("payment")
    .select("month, fee, day, note, year") // 필요한 컬럼만
    .eq("academy_code", academyCode)
    .eq("year", year)
    .eq("name", name)
    .order("month", { ascending: true });

  if (error) {
    console.error("Get Student Payment Error:", error);
    return [];
  }

  // 2. 1월~12월 데이터 채우기 (빈 달은 0원으로)
  const result = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    const payment = data.find(
      (p) => String(p.month).padStart(2, "0") === month
    );

    return {
      month,
      fee: payment ? Number(payment.fee) : 0,
      day: payment?.day || "",
      note: payment?.note || "",
    };
  });

  return result;
}
