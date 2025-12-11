"use server";

import { createClient } from "@/utils/supabase/server";

const TABLE_NAME = "pickup";

// 1. 픽업 시간 리스트 조회 (서버용)
export const getServerPickupTimeList = async (academyCode: string) => {
  const supabase = await createClient();

  // Supabase는 .select('DISTINCT ...') 문법이 조금 복잡하므로,
  // 데이터를 가져온 후 JS에서 중복을 제거하는 것이 훨씬 간편하고 빠릅니다.
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("time") // 컬럼명 대문자 유의
    .eq("academy_code", academyCode)
    .order("time", { ascending: true });

  if (error || !data) {
    console.error("Fetch Pickup TimeList Error:", error);
    return [];
  }

  // 중복 제거 (Set 활용)
  // 예: [{ TIME: '14:00' }, { TIME: '14:00' }] -> ['14:00'] -> [{ TIME: '14:00' }]
  const uniqueTimeStrings = Array.from(new Set(data.map((d) => d.time)));
  const uniqueRows = uniqueTimeStrings.map((t) => ({ time: t }));

  // 시간 정렬 및 필터링 로직 (기존 유지)
  // 0시~9시는 익일 새벽 취급하여 뒤로 보내고, 9시~24시는 앞으로
  const more12 = uniqueRows.filter((item: any) => {
    const hour = Number(item.time?.substr(0, 2));
    return hour > 0 && hour < 9;
  });

  const less24 = uniqueRows.filter((item: any) => {
    const hour = Number(item.time?.substr(0, 2));
    return hour >= 9 && hour <= 24;
  });

  return [...less24, ...more12];
};

// 2. 픽업 데이터 리스트 조회 (서버용)
export const getServerPickupDataList = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("time, day, content") // 컬럼명 대문자
    .eq("academy_code", academyCode)
    .not("content", "is", null) // SQL: WHERE "content" IS NOT NULL
    .order("time", { ascending: true });

  if (error) {
    console.error("Fetch Pickup DataList Error:", error);
    return [];
  }

  return data || [];
};
