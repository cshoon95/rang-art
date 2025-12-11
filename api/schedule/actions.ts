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
