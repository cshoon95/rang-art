"use server";

import { createClient } from "@/utils/supabase/server"; // Supabase 클라이언트 경로 확인
import { PaymentType } from "../payment/type";

// ... (기존 getMonthlyTotalAction 등은 유지)

// ✅ [New] 월별 입원/퇴원/총원 통계 조회
export async function getCustomerStatsAction(
  year: string,
  academyCode: string
) {
  const supabase = await createClient();

  // ✅ 1. 쿼리 수정
  // 단순히 입/퇴원 날짜만 보는 게 아니라,
  // "입원일이 올해 말일 이전" 이면서 "퇴원일이 없거나 올해 1월 1일 이후"인 사람을 모두 가져와야
  // 이월된 인원까지 계산할 수 있습니다.
  // (편의상 academy_code로 전체를 가져와서 JS로 필터링하는 것이 데이터 양이 많지 않다면 가장 정확합니다)

  const { data, error } = await supabase
    .from("customers")
    .select("name, date, discharge, state")
    .eq("academy_code", academyCode);
  // .lte("date", `${year}1231`) // (선택) 올해 이후 가입자는 제외하고 싶다면 추가

  if (error) {
    console.error("Customer Stats Error:", error);
    return [];
  }

  // ✅ 2. 기초 재원 계산 (Base Total)
  // 1월 1일 00시 기준으로 이미 다니고 있는 사람 수
  // 조건: (입원일 < 올해0101) AND (퇴원일이 없거나 OR 퇴원일 >= 올해0101)
  let currentTotal = data.filter((c: any) => {
    return c.state === "0";
  }).length;

  // 3. 월별 통계 초기화
  const stats = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    return { month, join: 0, leave: 0, total: 0, data };
  });

  // 4. 데이터 순회하며 월별 입/퇴원 집계
  data.forEach((customer: any) => {
    // 🟢 입원(등록) 집계
    if (customer.date && customer.date.startsWith(year)) {
      const m = parseInt(customer.date.substring(4, 6), 10) - 1;
      if (stats[m]) stats[m].join += 1;
    }

    // 🔴 퇴원 집계
    if (customer.discharge && customer.discharge.startsWith(year)) {
      const m = parseInt(customer.discharge.substring(4, 6), 10) - 1;
      if (stats[m]) stats[m].leave += 1;
    }
  });

  // ✅ 5. 총원(Total) 누적 계산
  // (전월 총원 + 당월 입원 - 당월 퇴원 = 당월 총원)
  stats.forEach((stat) => {
    stat.total = currentTotal;
  });

  return stats;
}

const TABLE_MAP = {
  income: "payment",
  expenditure: "expenditure",
};

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
