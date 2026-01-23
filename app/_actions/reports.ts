"use server";

import { createClient } from "@/utils/supabase/server"; // Supabase 클라이언트 경로 확인
import { PaymentType } from "../_types/type";
// ... (기존 getMonthlyTotalAction 등은 유지)

export async function getCustomerStatsAction(
  year: string,
  academyCode: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("name, date, discharge, state")
    .eq("academy_code", academyCode);

  if (error || !data) {
    console.error("Customer Stats Error:", error);
    return [];
  }

  // 12개월 통계 생성
  const stats = Array.from({ length: 12 }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, "0"); // "01", "02"...
    const currentMonthPrefix = `${year}${monthStr}`; // "202401"

    // 해당 월의 말일 계산 (Total 계산용, 예: "20240131")
    const lastDayOfMonth = new Date(Number(year), i + 1, 0).getDate();
    const currentMonthEndDate = `${year}${monthStr}${lastDayOfMonth}`;
    console.log("currentMonthPrefix", currentMonthPrefix);
    // 🟢 Join (신규) 계산
    // 조건 1: date(등록일)이 이번 달인 사람
    // 조건 2: state가 '0'(재원)인 사람 (요청사항 반영)
    const joinCount = data.filter(
      (c: any) =>
        c.date && c.date.startsWith(currentMonthPrefix) && c.state === "0"
    ).length;

    // 🔴 Leave (퇴원) 계산
    // 조건: discharge(퇴원일)이 이번 달인 사람
    const leaveCount = data.filter(
      (c: any) =>
        c.discharge &&
        c.discharge.startsWith(currentMonthPrefix) &&
        c.state === "2"
    ).length;

    // 🔵 Total (총원) 계산 - 해당 월 말일 시점 기준
    // 재원생 수 = (가입일이 이 달 말일보다 빠르고) AND (퇴원일이 없거나 이 달 말일보다 늦음)
    const totalCount = data.filter((c: any) => {
      // 등록일이 없으면 카운트 불가
      if (!c.date) return false;

      // 1. 이 달 말일까지 가입한 사람인가?
      const joined = c.date <= currentMonthEndDate;

      // 2. 이 달 말일 기준으로 아직 안 나갔는가?
      // discharge가 null, undefined, 빈문자열('')이면 퇴원 안한 것으로 간주
      // discharge가 있어도 이 달 말일보다 크면(미래면) 아직 재원 중인 것으로 간주
      const hasDischargeDate = c.discharge && c.discharge.trim() !== "";
      const notLeftYet = !hasDischargeDate || c.discharge > currentMonthEndDate;

      return joined && notLeftYet;
    }).length;

    return {
      month: monthStr,
      join: joinCount,
      leave: leaveCount,
      total: totalCount,
    };
  });

  return stats;
}

const TABLE_MAP = {
  income: "payment",
  expenditure: "expenditure",
};
