"use server";

import { createClient } from "@/utils/supabase/server"; // Supabase 클라이언트 경로 확인
import { PaymentType } from "../_types/type";
// ... (기존 getMonthlyTotalAction 등은 유지)

export async function getCustomerStatsAction(
  year: string,
  academyCode: string,
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

  // 1. 12개월 데이터를 담을 버킷(Bucket) 초기화
  const stats = Array.from({ length: 12 }, (_, i) => ({
    month: String(i + 1).padStart(2, "0"),
    join: 0,
    leave: 0,
    total: 0,
  }));

  // 2. 단 1번의 데이터 순회 (O(N))로 모든 통계 분배
  data.forEach((c: any) => {
    if (!c.date) return; // 등록일이 없으면 패스

    const joinYear = c.date.substring(0, 4);
    const joinMonthIdx = parseInt(c.date.substring(4, 6), 10) - 1;

    const hasDischargeDate = c.discharge && c.discharge.trim() !== "";
    const leaveYear = hasDischargeDate ? c.discharge.substring(0, 4) : null;
    const leaveMonthIdx = hasDischargeDate
      ? parseInt(c.discharge.substring(4, 6), 10) - 1
      : null;

    // 🟢 Join (신규) - 해당 월의 버킷에 +1
    if (joinYear === year && joinMonthIdx >= 0 && joinMonthIdx < 12) {
      stats[joinMonthIdx].join += 1;
    }

    // 🔴 Leave (퇴원) - 해당 월의 버킷에 +1
    if (
      c.state === "2" &&
      leaveYear === year &&
      leaveMonthIdx !== null &&
      leaveMonthIdx >= 0 &&
      leaveMonthIdx < 12
    ) {
      stats[leaveMonthIdx].leave += 1;
    }

    // 🔵 Total (총원) - 해당 회원이 존재했던 모든 달의 버킷에 +1
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, "0");
      const lastDayOfMonth = new Date(Number(year), m, 0).getDate();
      const currentMonthEndDate = `${year}${monthStr}${lastDayOfMonth}`;

      const joined = c.date <= currentMonthEndDate;
      const notLeftYet = !hasDischargeDate || c.discharge > currentMonthEndDate;

      if (joined && notLeftYet) {
        stats[m - 1].total += 1;
      }
    }
  });

  return stats;
}

const TABLE_MAP = {
  income: "payment",
  expenditure: "expenditure",
};
