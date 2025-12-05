"use server";

import { createClient } from "@/utils/supabase/server";
import { replaceHyphenFormat } from "@/utils/format"; // 경로 확인 필요
import { getEmployeeTenure } from "@/utils/common"; // 경로 확인 필요
import { getEmployeeLevel } from "@/utils/list";

const TABLE_NAME = "users";

/**
 * ✅ 직원 리스트 조회 (Formatted Data 반환)
 */
export async function getEmployees(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode)
    .order("date", { ascending: true }) // 입사일순
    .order("state", { ascending: true }); // 상태순

  if (error) {
    console.error("Get Employees Error:", error);
    return [];
  }

  console.log("item", data);

  // 여기서 포맷팅을 수행하여 반환합니다.
  return data.map((item: any) => ({
    IDX: item.idx, // PK
    ID: item.id, // 로그인 ID
    NAME: item.name,
    TEL: item.tel ? replaceHyphenFormat(item.tel, "phone") : "",
    DATE: item.date ? replaceHyphenFormat(item.date, "date") : "", // 입사일 YYYY-MM-DD
    TENURE: getEmployeeTenure(item.date || ""), // 근속 기간
    ACCOUNT: item.account || "",
    BIRTH: item.birth ? replaceHyphenFormat(item.birth, "date") : "",
    SALARY: item.salary || "",
    LEVEL_CD: item.level, // 원본 코드 (필터링용)
    LEVEL: getEmployeeLevel(item.level), // 한글 변환 (표시용)
    STATE: item.state === "Y" ? "O" : "X", // 재직: O, 퇴사: X
    NOTE: item.note || "",
  }));
}
