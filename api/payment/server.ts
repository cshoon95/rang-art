"use server";

import { createClient } from "@/utils/supabase/server"; // 본인 프로젝트 경로에 맞게 수정
import { revalidatePath } from "next/cache";
import { PaymentType } from "./type";
// 테이블명 매핑
const TABLE_MAP = {
  income: "payment",
  expenditure: "expenditure",
};

// 1. 목록 조회 (SELECT)
export async function getPaymentListAction(
  year: string,
  month: string,
  type: PaymentType,
  academyCode: string
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
  academyCode: string
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
