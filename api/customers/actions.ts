"use server";

import { createClient } from "@/utils/supabase/server";

const TABLE_NAME = "customers";

/**
 * 회원 리스트 조회 (Server Component 용)
 */
export const getServerCustomerList = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode)
    .order("state", { ascending: true }) // 재원 > 휴원 > 퇴원 순
    .order("name", { ascending: true }); // 이름순

  if (error) {
    console.error("Fetch Customer List Error:", error);
    return [];
  }

  return data || [];
};
