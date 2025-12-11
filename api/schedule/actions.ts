"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE_NAME = "schedule";

// 공통 응답 타입
interface ActionResponse {
  success: boolean;
  message: string;
}

// ✅ 1. 스케줄 내용 저장 (Upsert: 등록/수정)
export async function upsertScheduleAction(param: {
  content: string;
  time: string;
  day: string | number;
  type: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { content, time, day, type, academyCode, registerID } = param;

  // 1. 해당 셀에 데이터가 있는지 확인 (SELECT)
  // 키값을 DB 컬럼명(대문자 등)과 일치시켜야 합니다.
  const { data: existing, error: checkError } = await supabase
    .from(TABLE_NAME)
    .select("content")
    .eq("day", day)
    .eq("time", time)
    .eq("type", type)
    .eq("academy_code", academyCode)
    .maybeSingle();

  if (checkError) {
    console.error("Schedule Check Error:", checkError);
    return { success: false, message: "데이터 확인 중 오류가 발생했습니다." };
  }

  let resultError;

  if (!existing) {
    // 2-A. 신규 등록 (INSERT)
    const { error } = await supabase.from(TABLE_NAME).insert({
      content: content,
      day: day,
      time: time,
      type: type,
      register_id: registerID,
      academy_code: academyCode,
    });
    resultError = error;
  } else {
    // 2-B. 수정 (UPDATE)
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        content: content,
        updater_id: registerID,
      })
      .eq("day", day)
      .eq("time", time)
      .eq("type", type)
      .eq("academy_code", academyCode);
    resultError = error;
  }

  if (resultError) {
    console.error("Schedule Upsert Error:", resultError);
    return { success: false, message: "오류가 발생했습니다." };
  }

  // 데이터 갱신
  revalidatePath("/schedule");

  return {
    success: true,
    message: existing ? "수정되었습니다." : "등록되었습니다.",
  };
}

// ✅ 2. 시간(행) 추가 액션
export async function insertScheduleTimeAction(data: {
  time: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { time, academyCode, registerID } = data;

  const { error } = await supabase.from(TABLE_NAME).insert({
    time: time,
    register_id: registerID,
    academy_code: academyCode,
  });

  if (error) {
    console.error("Insert Schedule Time Error:", error);
    return { success: false, message: "시간 등록 중 오류가 발생했습니다." };
  }

  revalidatePath("/schedule");
  return { success: true, message: "시간이 등록되었습니다." };
}

// ✅ 3. 시간(행) 삭제 액션
export async function deleteScheduleTimeAction(data: {
  time: string;
  academyCode: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { time, academyCode } = data;

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("time", time)
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Schedule Time Error:", error);
    return { success: false, message: "시간 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/schedule");
  return { success: true, message: "시간이 삭제되었습니다." };
}

// 공통 응답 타입
interface ActionResponse {
  success: boolean;
  message: string;
}

// ✅ 1. 임시 스케줄 내용 저장 (Upsert: 등록/수정)
export async function upsertTempScheduleAction(param: {
  content: string;
  time: string;
  day: string | number;
  type: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { content, time, day, type, academyCode, registerID } = param;

  // 1. 해당 셀에 데이터가 있는지 확인 (SELECT)
  const { data: existing, error: checkError } = await supabase
    .from("temp_schedule")
    .select("content") // 대문자 컬럼
    .eq("day", day)
    .eq("time", time)
    .eq("type", type)
    .eq("academy_code", academyCode)
    .maybeSingle();

  if (checkError) {
    console.error("Temp Schedule Check Error:", checkError);
    return { success: false, message: "데이터 확인 중 오류가 발생했습니다." };
  }

  let resultError;

  if (!existing) {
    // 2-A. 신규 등록 (INSERT)
    const { error } = await supabase.from("temp_schedule").insert({
      content: content,
      day: day,
      time: time,
      type: type,
      register_id: registerID,
      academy_code: academyCode,
    });
    resultError = error;
  } else {
    // 2-B. 수정 (UPDATE)
    const { error } = await supabase
      .from("temp_schedule")
      .update({
        content: content,
        updater_id: registerID,
      })
      .eq("day", day)
      .eq("time", time)
      .eq("type", type)
      .eq("academy_code", academyCode);
    resultError = error;
  }

  if (resultError) {
    console.error("Temp Schedule Upsert Error:", resultError);
    return { success: false, message: "오류가 발생했습니다." };
  }

  // 데이터 갱신
  revalidatePath("/temp-schedule");

  return {
    success: true,
    message: existing ? "수정되었습니다." : "등록되었습니다.",
  };
}

// ✅ 2. 시간(행) 추가 액션
export async function insertTempScheduleTimeAction(data: {
  time: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { time, academyCode, registerID } = data;

  const { error } = await supabase.from("temp_schedule").insert({
    time: time,
    register_id: registerID,
    academy_code: academyCode,
  });

  if (error) {
    console.error("Insert Temp Schedule Time Error:", error);
    return { success: false, message: "시간 등록 중 오류가 발생했습니다." };
  }

  revalidatePath("/temp-schedule");
  return { success: true, message: "시간이 등록되었습니다." };
}

// ✅ 3. 시간(행) 삭제 액션
export async function deleteTempScheduleTimeAction(data: {
  time: string;
  academyCode: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { time, academyCode } = data;

  const { error } = await supabase
    .from("temp_schedule")
    .delete()
    .eq("time", time)
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Temp Schedule Time Error:", error);
    return { success: false, message: "시간 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/temp-schedule");
  return { success: true, message: "시간이 삭제되었습니다." };
}

/**
 * ✅ 픽업 데이터 등록 및 수정 (Upsert)
 */
export async function upsertPickupAction(param: {
  content: string;
  time: string;
  day: string;
  academyCode: string;
  registerID: string;
}) {
  const supabase = await createClient();
  const { content, time, day, academyCode, registerID } = param;

  // 1. 해당 셀에 데이터가 있는지 확인 (SELECT)
  const { data: existing, error: checkError } = await supabase
    .from("pickup")
    .select("content") // 존재 여부만 확인하면 되므로 컬럼 하나만 선택
    .eq("day", day)
    .eq("time", time)
    .eq("academy_code", academyCode)
    .maybeSingle(); // 0개 또는 1개 조회 (없어도 에러 아님)

  if (checkError) {
    console.error("Pickup Check Error:", checkError);
    return {
      success: false,
      message: "데이터 확인 중 오류가 발생했습니다111.",
    };
  }

  let resultError;

  if (!existing) {
    // 2-A. 신규 등록 (INSERT)
    const { error } = await supabase.from("pickup").insert({
      content: content,
      day: day,
      time: time,
      register_id: registerID,
      academy_code: academyCode,
    });
    resultError = error;
  } else {
    // 2-B. 수정 (UPDATE)
    const { error } = await supabase
      .from("pickup")
      .update({
        content: content,
        updater_id: registerID,
        // updated_at: new Date().toISOString() // 필요 시 추가
      })
      .eq("day", day)
      .eq("time", time)
      .eq("academy_code", academyCode);
    resultError = error;
  }

  if (resultError) {
    console.error("Pickup Upsert Error:", resultError);
    return { success: false, message: "오류가 발생했습니다." };
  }

  // 데이터 변경 후 페이지 갱신
  revalidatePath("/pickup");

  return {
    success: true,
    message: existing ? "수정되었습니다." : "등록되었습니다.",
  };
}

/**
 * ✅ 픽업 시간 추가
 */
export async function insertPickupTimeAction(param: {
  time: string;
  registerID: string;
  academyCode: string;
}) {
  const supabase = await createClient();
  const { time, registerID, academyCode } = param;

  const { error } = await supabase.from("pickup").insert({
    time,
    register_id: registerID,
    academy_code: academyCode,
  });

  if (error) {
    console.error("Insert Pickup Time Error:", error);
    return { success: false, message: "시간 추가 실패" };
  }

  revalidatePath("/pickup");
  return { success: true, message: "시간이 추가되었습니다." };
}

/**
 * ✅ 픽업 시간 삭제
 */
export async function deletePickupTimeAction(param: {
  time: string;
  academyCode: string;
}) {
  const supabase = await createClient();
  const { time, academyCode } = param;

  const { error } = await supabase
    .from("pickup")
    .delete()
    .eq("time", time)
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Pickup Time Error:", error);
    return { success: false, message: "시간 삭제 실패" };
  }

  revalidatePath("/pickup");
  return { success: true, message: "시간이 삭제되었습니다." };
}

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
