"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
