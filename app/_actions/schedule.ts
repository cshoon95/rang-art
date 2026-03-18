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
    .maybeSingle(); // 🌟 핵심: 단일 객체나 null로 반환하도록 추가!

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
  // ✅ 수정 1: 'id'를 추가로 조회하고, id(입력) 순서대로 정렬합니다.
  const { data: rawData, error } = await supabase
    .from("schedule")
    .select("id, time, type, content")
    .eq("academy_code", academyCode)
    .eq("day", day)
    .order("id", { ascending: true }); // 옛날 데이터 -> 최신 데이터 순서

  if (error) {
    console.error("Schedule Fetch Error:", error);
    return { data: [] };
  }

  // (3) 데이터 가공
  const scheduleMap = new Map<string, { time: string; D: string; M: string }>();

  rawData.forEach((item: any) => {
    if (!scheduleMap.has(item.time)) {
      scheduleMap.set(item.time, { time: item.time, D: "", M: "" });
    }
    const entry = scheduleMap.get(item.time)!;

    // ✅ 수정 2: 기존 내용을 연결(concat)하지 않고, 덮어씌웁니다(=).
    // rawData가 id 오름차순(옛날->최신)으로 정렬되어 있으므로,
    // 루프가 돌면서 자연스럽게 가장 마지막(최신) 데이터가 남게 됩니다.
    if (item.type === "D") {
      entry.D = item.content;
    } else if (item.type === "M") {
      entry.M = item.content;
    }
  });

  return {
    data: Array.from(scheduleMap.values()).sort(
      (a, b) => a.time.localeCompare(b.time), // (선택사항) 최종 결과 시간순 정렬
    ),
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
    .neq("content", "")
    .not("content", "is", null)
    .order("time", { ascending: true });

  if (error || !data) {
    console.error("Pickup Fetch Error:", error);
    return [];
  }

  // ✅ 중복 제거 로직 추가
  // 배열을 순회하면서 "시간"과 "내용"이 완전히 똑같은 첫 번째 요소만 남깁니다.
  const uniqueData = data.filter(
    (item, index, self) =>
      index ===
      self.findIndex((t) => t.time === item.time && t.content === item.content),
  );

  return uniqueData;
}

// 3. 오늘의 일정 조회 (오늘 날짜가 포함된 일정)
export async function getTodayEventsAction(academyCode: string) {
  const supabase = await createClient();

  // ❌ 수정 전: UTC 기준이라 오전 9시 전에는 '어제' 날짜가 나옴
  // const today = new Date().toISOString().split("T")[0];

  // ⭕ 수정 후: 한국 시간대(Asia/Seoul)를 기준으로 YYYY-MM-DD 형식 추출
  // 'en-CA' 로케일을 사용하면 YYYY-MM-DD 형식을 자동으로 맞춰줍니다.
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });

  console.log("Server Today (KST):", today); // 디버깅용 로그

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
  day: string,
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

/**
 * 1. 시간 리스트 조회 액션
 * - Supabase에서 데이터를 가져온 후, JS 로직으로 정렬합니다.
 */
export const getScheduleTimeListAction = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("time")
    .eq("academy_code", academyCode);

  if (error || !data) {
    console.error("Fetch Schedule TimeList Error:", error);
    return [];
  }

  // 중복 제거
  const uniqueTimeStrings = Array.from(new Set(data.map((d) => d.time)));
  const uniqueRows = uniqueTimeStrings.map((t) => ({ time: t }));

  // ✅ 정렬 로직 수정
  const sortedRows = uniqueRows.sort((a: any, b: any) => {
    const getWeight = (timeStr: string) => {
      if (!timeStr) return 0;

      // 🌟 [수정] ":" 같은 기호가 섞여 들어와도 안전하게 계산하도록 숫자만 추출
      const cleanTime = timeStr.replace(/[^0-9]/g, ""); // 예: "14:30" -> "1430"
      const paddedTime = cleanTime.padEnd(4, "0"); // "14"만 들어와도 "1400"으로 방어

      let hour = parseInt(paddedTime.substring(0, 2), 10);
      const minute = parseInt(paddedTime.substring(2, 4), 10);

      // 08시 이전(01~07)은 오후/밤으로 간주 (+12시간)
      if (hour < 8) {
        hour += 12;
      }

      return hour * 60 + minute;
    };

    return getWeight(a.time) - getWeight(b.time);
  });

  return sortedRows;
};

/**
 * 2. 스케줄 데이터 조회 액션
 */
export const getScheduleDataListAction = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("time, day, content, type") // 컬럼명 대문자
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Fetch Schedule DataList Error:", error);
    return [];
  }

  return data || [];
};

/**
 * 1. 임시 시간 리스트 조회 액션
 * - Supabase에서 데이터를 가져온 후, JS 로직으로 정렬합니다.
 */
export const getTempScheduleTimeListAction = async (academyCode: string) => {
  const supabase = await createClient();

  // Supabase에서 해당 학원의 모든 시간 데이터를 가져옵니다.
  // DISTINCT를 직접 지원하지 않으므로 전체를 가져와서 JS에서 중복을 제거합니다.
  const { data, error } = await supabase
    .from("temp_schedule")
    .select("time") // 컬럼명 대문자
    .eq("academy_code", academyCode);

  if (error || !data) {
    console.error("Fetch Temp Schedule TimeList Error:", error);
    return [];
  }

  // 중복 제거
  const uniqueTimeStrings = Array.from(new Set(data.map((d) => d.time)));
  const uniqueRows = uniqueTimeStrings.map((t) => ({ time: t }));

  // ✅ 정렬 로직 수정
  const sortedRows = uniqueRows.sort((a: any, b: any) => {
    const getWeight = (timeStr: string) => {
      if (!timeStr) return 0;

      // 🌟 [수정] 콜론(:) 방어 로직 적용
      const cleanTime = timeStr.replace(/[^0-9]/g, "");
      const paddedTime = cleanTime.padEnd(4, "0");

      let hour = parseInt(paddedTime.substring(0, 2), 10);
      const minute = parseInt(paddedTime.substring(2, 4), 10);

      // 08시 이전(01~07)은 오후/밤으로 간주 (+12시간)
      if (hour < 8) {
        hour += 12;
      }

      return hour * 60 + minute;
    };

    return getWeight(a.time) - getWeight(b.time);
  });

  return sortedRows;
};

/**
 * 2. 임시 스케줄 데이터 조회 액션
 */
export const getTempScheduleDataListAction = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("temp_schedule")
    .select("time, day, content, type") // 컬럼명 대문자
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Fetch Temp Schedule DataList Error:", error);
    return [];
  }

  return data || [];
};

// 1. 픽업 시간 리스트 조회 (서버용)
export const getServerPickupTimeList = async (academyCode: string) => {
  const supabase = await createClient();

  // Supabase는 .select('DISTINCT ...') 문법이 조금 복잡하므로,
  // 데이터를 가져온 후 JS에서 중복을 제거하는 것이 훨씬 간편하고 빠릅니다.
  const { data, error } = await supabase
    .from("pickup")
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
    .from("pickup")
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

async function updateTimeCommon(
  tableName: "schedule" | "temp_schedule" | "pickup",
  data: {
    oldTime: string;
    newTime: string;
    academyCode: string;
    registerID: string;
  },
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { oldTime, newTime, academyCode, registerID } = data;

  // 1. 이미 존재하는 시간인지 확인 (중복 방지)
  const { data: exists } = await supabase
    .from(tableName)
    .select("time")
    .eq("time", newTime)
    .eq("academy_code", academyCode)
    .maybeSingle();

  if (exists) {
    return { success: false, message: "이미 존재하는 시간입니다." };
  }

  // 2. 시간 업데이트 (해당 시간을 가진 모든 행 업데이트)
  const { error } = await supabase
    .from(tableName)
    .update({
      time: newTime,
      // updater_id: registerID, // 테이블에 updater_id 컬럼이 있다면 주석 해제
    })
    .eq("time", oldTime)
    .eq("academy_code", academyCode);

  if (error) {
    console.error(`Update ${tableName} Time Error:`, error);
    return { success: false, message: "시간 수정 중 오류가 발생했습니다." };
  }

  // 캐시 갱신
  if (tableName === "schedule") revalidatePath("/schedule");
  else if (tableName === "temp_schedule") revalidatePath("/temp-schedule");
  else if (tableName === "pickup") revalidatePath("/pickup");

  return { success: true, message: "시간이 수정되었습니다." };
}

// --- Export용 액션들 ---

export async function updateScheduleTimeAction(data: {
  oldTime: string;
  newTime: string;
  academyCode: string;
  registerID: string;
}) {
  return updateTimeCommon("schedule", data);
}

export async function updateTempScheduleTimeAction(data: {
  oldTime: string;
  newTime: string;
  academyCode: string;
  registerID: string;
}) {
  return updateTimeCommon("temp_schedule", data);
}

export async function updatePickupTimeAction(data: {
  oldTime: string;
  newTime: string;
  academyCode: string;
  registerID: string;
}) {
  return updateTimeCommon("pickup", data);
}
