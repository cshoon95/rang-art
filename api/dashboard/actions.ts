"use server";

import { createClient } from "@/utils/supabase/server";

// 1. 오늘의 수업 시간표 (시간별 그룹화: D/M 분리)
export async function getTodayScheduleAction(academyCode: string, day: string) {
  const supabase = await createClient();

  // (2) 데이터 조회
  const { data: rawData, error } = await supabase
    .from("schedule")
    .select("time, type, content")
    .eq("academy_code", academyCode)
    .eq("day", day)
    .order("time", { ascending: true });

  if (error) {
    console.error("Schedule Fetch Error:", error);
    return { data: [] };
  }

  // (3) 데이터 가공: 시간(time)을 Key로 하여 D와 M을 묶음
  // 결과 형태: [{ time: '14:00', D: '내용1', M: '내용2' }, ...]
  const scheduleMap = new Map<string, { time: string; D: string; M: string }>();

  rawData.forEach((item: any) => {
    if (!scheduleMap.has(item.time)) {
      scheduleMap.set(item.time, { time: item.time, D: "", M: "" });
    }
    const entry = scheduleMap.get(item.time)!;

    // 타입에 따라 내용 할당 (여러 개일 경우 줄바꿈 등으로 처리 가능, 여기선 덮어쓰거나 합침)
    // 예: 기존 내용이 있으면 콤마로 연결
    if (item.type === "D") {
      entry.D = entry.D ? `${entry.D}, ${item.content}` : item.content;
    } else if (item.type === "M") {
      entry.M = entry.M ? `${entry.M}, ${item.content}` : item.content;
    }
  });

  return {
    data: Array.from(scheduleMap.values()),
  };
}

// 2. 오늘의 픽업 시간표 (내용 없는 것 제외)
export async function getTodayPickupAction(academyCode: string, day: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pickup")
    .select("time, content")
    .eq("academy_code", academyCode)
    .eq("day", day)
    .neq("content", "") // ✅ 빈 문자열 제외
    .not("content", "is", null) // ✅ NULL 제외
    .order("time", { ascending: true });

  if (error) {
    console.error("Pickup Fetch Error:", error);
    return [];
  }

  return data;
}

// 3. 오늘의 일정 조회 (오늘 날짜가 포함된 일정)
export async function getTodayEventsAction(academyCode: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("calendar")
    .select("*")
    .eq("academy_code", academyCode)
    .lte("start_date", today) // 시작일 <= 오늘
    .gte("end_date", today) // 종료일 >= 오늘
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Today Calendar Error:", error);
    return [];
  }

  return data;
}

// 1. 오늘의 임시 수업 시간표 (시간별 그룹화: D/M 분리)
export async function getTodayTempScheduleAction(
  academyCode: string,
  day: string
) {
  const supabase = await createClient();

  // (2) 데이터 조회
  const { data: rawData, error } = await supabase
    .from("temp_schedule")
    .select("time, type, content")
    .eq("academy_code", academyCode)
    .eq("day", day)
    .order("time", { ascending: true });

  if (error) {
    console.error("Schedule Fetch Error:", error);
    return { data: [] };
  }

  // (3) 데이터 가공: 시간(time)을 Key로 하여 D와 M을 묶음
  // 결과 형태: [{ time: '14:00', D: '내용1', M: '내용2' }, ...]
  const scheduleMap = new Map<string, { time: string; D: string; M: string }>();

  rawData.forEach((item: any) => {
    if (!scheduleMap.has(item.time)) {
      scheduleMap.set(item.time, { time: item.time, D: "", M: "" });
    }
    const entry = scheduleMap.get(item.time)!;

    // 타입에 따라 내용 할당 (여러 개일 경우 줄바꿈 등으로 처리 가능, 여기선 덮어쓰거나 합침)
    // 예: 기존 내용이 있으면 콤마로 연결
    if (item.type === "D") {
      entry.D = entry.D ? `${entry.D}, ${item.content}` : item.content;
    } else if (item.type === "M") {
      entry.M = entry.M ? `${entry.M}, ${item.content}` : item.content;
    }
  });

  return {
    data: Array.from(scheduleMap.values()),
  };
}
