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

  // 2. 'L'(Last day) 표시가 있는 출석 기록 가져오기
  // 🌟 날짜 내림차순(DESC) 정렬이 핵심! (가장 최신 날짜가 먼저 옴)
  const { data: attendanceData, error: attError } = await supabase
    .from("attendance")
    .select("name, date")
    .eq("academy_code", academyCode)
    .like("content", "%L%") // 'L' 포함
    .order("date", { ascending: false });

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
