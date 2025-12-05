import { createClient } from "@/utils/supabase/server";

const TABLE_NAME = "calendar";

/**
 * [Server Component 용] 캘린더 리스트 조회
 */
export const getServerCalendarList = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode)
    .order("startdate", { ascending: true });

  if (error) {
    console.error("Server Calendar Fetch Error:", error);
    return [];
  }

  return data;
};
