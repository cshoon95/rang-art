"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE_NAME = "temp_schedule";

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
    .from(TABLE_NAME)
    .select("CONTENT") // 대문자 컬럼
    .eq("DAY", day)
    .eq("TIME", time)
    .eq("TYPE", type)
    .eq("academy_code", academyCode)
    .maybeSingle();

  if (checkError) {
    console.error("Temp Schedule Check Error:", checkError);
    return { success: false, message: "데이터 확인 중 오류가 발생했습니다." };
  }

  let resultError;

  if (!existing) {
    // 2-A. 신규 등록 (INSERT)
    const { error } = await supabase.from(TABLE_NAME).insert({
      CONTENT: content,
      DAY: day,
      TIME: time,
      TYPE: type,
      register_id: registerID,
      academy_code: academyCode,
    });
    resultError = error;
  } else {
    // 2-B. 수정 (UPDATE)
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        CONTENT: content,
        updater_id: registerID,
      })
      .eq("DAY", day)
      .eq("TIME", time)
      .eq("TYPE", type)
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

  const { error } = await supabase.from(TABLE_NAME).insert({
    TIME: time,
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
    .from(TABLE_NAME)
    .delete()
    .eq("TIME", time)
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Temp Schedule Time Error:", error);
    return { success: false, message: "시간 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/temp-schedule");
  return { success: true, message: "시간이 삭제되었습니다." };
}
