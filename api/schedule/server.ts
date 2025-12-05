"use server";

import { createClient } from "@/utils/supabase/server";

const TABLE_NAME = "schedule";

/**
 * 1. 시간 리스트 조회 액션
 * - Supabase에서 데이터를 가져온 후, JS 로직으로 정렬합니다.
 */
export const getScheduleTimeListAction = async (academyCode: string) => {
  const supabase = await createClient();

  // Supabase에서 해당 학원의 모든 시간 데이터를 가져옵니다.
  // DISTINCT를 직접 지원하지 않으므로 전체를 가져와서 JS에서 중복을 제거합니다.
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("TIME") // 컬럼명 대문자
    .eq("academy_code", academyCode);

  if (error || !data) {
    console.error("Fetch Schedule TimeList Error:", error);
    return [];
  }

  // ✅ 중복 제거 (Set 활용)
  const uniqueTimeStrings = Array.from(new Set(data.map((d) => d.TIME)));
  const uniqueRows = uniqueTimeStrings.map((t) => ({ TIME: t }));

  // ✅ 학원 시간표 맞춤 정렬 로직 (기존 로직 유지)
  const sortedRows = uniqueRows.sort((a: any, b: any) => {
    const getWeight = (timeStr: string) => {
      if (!timeStr) return 0;

      // "03:30" 형식에서 시간과 분 추출
      let hour = parseInt(timeStr.substring(0, 2), 10);
      const minute = parseInt(timeStr.substring(3, 5), 10);

      // 🔥 핵심: 08시 이전(01~07)은 오후/밤으로 간주하여 +12시간 (뒤로 보냄)
      if (hour < 8) {
        hour += 12;
      }

      return hour * 60 + minute;
    };

    return getWeight(a.TIME) - getWeight(b.TIME);
  });

  return sortedRows;
};

/**
 * 2. 스케줄 데이터 조회 액션
 */
export const getScheduleDataListAction = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("TIME, DAY, CONTENT, TYPE") // 컬럼명 대문자
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Fetch Schedule DataList Error:", error);
    return [];
  }

  return data || [];
};
