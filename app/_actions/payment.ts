"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PaymentType } from "../_types/type";

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
    .select("id, name, fee, count, note, fee_yn, parentphone, tel")
    .eq("academy_code", academyCode)
    .eq("msg_yn", "Y");

  if (custError || !customers || customers.length === 0) {
    return [];
  }

  // 2. 이 고객들의 가장 최근 'L' 출석 기록 가져오기 (알림창에 '기준일' 날짜 표시용)
  const customerIds = customers.map((c) => c.id);

  const { data: attendanceData, error: attError } = await supabase
    .from("attendance")
    .select("student_id, date")
    .eq("academy_code", academyCode)
    .in("student_id", customerIds)
    .like("content", "%L%") // 'L' 포함
    .order("date", { ascending: false });

  // 3. 고객 명단을 기준으로 데이터 병합 (L 기록이 없어도 무조건 목록에 포함!)
  const result = customers.map((customer) => {
    // 가장 최근의 L 날짜 찾기 (이미 내림차순 정렬되어 있으므로 첫 번째 매칭)
    const latestAtt = attendanceData?.find(
      (att) => att.student_id === customer.id,
    );

    return {
      id: customer.id,
      name: customer.name,
      date: latestAtt ? latestAtt.date : "", // L이 없으면 빈 값으로 처리
      fee: customer.fee,
      count: customer.count,
      fee_yn: customer.fee_yn,
      note: customer.note,
      msg_yn: true,
      phone: customer.parentphone || customer.tel || "01000000000",
    };
  });

  // 4. 이름순 정렬
  result.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return result;
}

// 🌟 [신규] 삭제 Action
export async function deletePaymentAction(
  id: number,
  type: PaymentType,
  academyCode: string,
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
  academyCode: string,
) {
  const supabase = await createClient();

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

  return { success: true };
}

// 현금영수증 목록 조회
export async function getCashReceiptListAction(
  academyCode: string,
  year: string,
  month: string,
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
  academyCode: string,
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
  year: string,
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
    // 🌟 [수정] 콤마(,) 등 문자가 섞여있을 경우 NaN 에러 방지
    const fee = Number(String(item.fee || "0").replace(/[^0-9.-]+/g, ""));
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
  name: string,
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
  // 2. 1월~12월 데이터 채우기 (중복 월 합산)
  const result = Array.from({ length: 12 }, (_, i) => {
    // 비교할 월 문자열 (예: "01", "06", "11")
    const targetMonth = String(i + 1).padStart(2, "0");

    // 1. 해당 월에 해당하는 모든 결제 내역을 찾습니다 (filter 사용)
    const monthlyPayments = data.filter(
      (p) => String(p.month).padStart(2, "0") === targetMonth,
    );

    // 2. 찾은 내역들의 금액(fee)을 모두 더합니다 (reduce 사용)
    const totalFee = monthlyPayments.reduce(
      (sum, item) =>
        sum + (Number(String(item.fee).replace(/[^0-9.-]+/g, "")) || 0),
      0,
    );

    // (선택사항) 비고(note)가 여러 개일 경우 콤마로 합쳐서 보여줍니다.
    const combinedNote = monthlyPayments
      .map((p) => p.note)
      .filter((n) => n && n.trim() !== "") // 빈 값 제거
      .join(", ");

    // 날짜는 해당 월의 첫 번째 결제일 혹은 마지막 결제일 등을 표시 (여기선 첫 번째)
    const day = monthlyPayments.length > 0 ? monthlyPayments[0].day : "";

    return {
      month: targetMonth,
      fee: totalFee, // 합산된 금액
      day: day,
      note: combinedNote, // 합쳐진 비고
    };
  });
  return result;
}

// 1. 목록 조회 (SELECT)
export async function getPaymentListAction(
  year: string,
  month: string,
  type: PaymentType,
  academyCode: string,
) {
  const supabase = await createClient();
  const tableName = TABLE_MAP[type];

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .eq("academy_code", academyCode)
    .order("day", { ascending: true });

  if (error) {
    console.error("Fetch Error:", error);
    return [];
  }

  return data as PaymentItem[];
}

// 2. 데이터 저장/수정 (UPSERT)
export async function upsertPaymentAction(formData: any, type: PaymentType) {
  const supabase = await createClient();
  const tableName = TABLE_MAP[type];

  // 1. 공통 필드 매핑
  // ⚠️ 주의: formData에서 값을 꺼낼 때는 클라이언트에서 보낸 이름(camelCase)으로 꺼내야 합니다!
  const payload: any = {
    year: formData.year,
    month: formData.month,
    day: formData.day,
    note: formData.note,
    academy_code: formData.academyCode, // 🌟 수정: formData.academy_code -> formData.academyCode
  };

  // 2. Insert vs Update 분기 처리
  // ID가 있으면 수정(Update), 없으면 신규(Insert)
  if (formData.id) {
    // --- [수정 모드] ---
    payload.id = formData.id;
    payload.updater_id = formData.updaterID; // 클라이언트에서 updaterID로 보냈는지 확인 필요 (보통 userId)
    payload.updater_date = new Date().toISOString(); // 🌟 수정일 현재 시간
  } else {
    // --- [신규 모드] ---
    // 🌟 신규 등록일 때만 register 정보를 넣습니다.
    // 클라이언트에서 registerID로 보냈다고 가정 (userId)
    payload.register_id = formData.registerID || formData.updaterID;
    payload.register_date = new Date().toISOString(); // 🌟 등록일 현재 시간

    // 신규일 때도 updater 정보는 같이 넣어주는 것이 관리상 좋습니다.
    payload.updater_id = formData.registerID || formData.updaterID;
    payload.updater_date = new Date().toISOString();
  }

  // 3. 타입별(수입/지출) 필드 매핑
  if (type === "income") {
    payload.name = formData.name;
    payload.fee = formData.fee;
    payload.card = formData.card; // 결제 수단
    payload.register = formData.register || "N"; // 현금영수증 여부
  } else {
    payload.item = formData.item; // 지출 내역 (formData.name으로 넘어올 수 있음, 확인 필요)
    payload.amount = formData.amount; // 지출 금액
    payload.kind = formData.kind; // 지출 분류 (formData.category로 넘어올 수 있음)
  }

  // 4. Supabase Upsert 실행
  const { error } = await supabase
    .from(tableName)
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error(`Upsert ${type} Error:`, error);
    return { success: false, message: "저장에 실패했습니다." };
  }

  revalidatePath("/payment");
  return { success: true, message: "저장되었습니다." };
}

// 3. 월별 합계 조회
// 3. 월별 합계 조회 (이 부분을 수정해주세요!)
export async function getMonthlyTotalAction(
  year: string,
  type: PaymentType,
  academyCode: string,
) {
  const supabase = await createClient();
  const tableName = TABLE_MAP[type];
  const amountField = type === "income" ? "fee" : "amount";

  const { data, error } = await supabase
    .from(tableName)
    .select(`month, ${amountField}`)
    .eq("year", year)
    .eq("academy_code", academyCode);

  if (error) return [];

  // 월별 그룹핑 (수정됨: 문자열 -> 숫자 변환 강제)
  const result = data.reduce((acc: any, curr: any) => {
    const m = curr.month;

    // 🌟 [핵심 수정] 콤마(,) 제거 후 숫자로 변환
    const rawValue = curr[amountField];
    const val = Number(String(rawValue).replace(/[^0-9.-]+/g, "")) || 0;

    if (!acc[m]) acc[m] = { month: m, total: 0, count: 0 };

    acc[m].total += val; // 이제 숫자로 더해집니다!
    acc[m].count += 1;

    return acc;
  }, {});

  return Object.values(result);
}
