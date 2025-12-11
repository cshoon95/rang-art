"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE_NAME = "pickup";

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
    .from(TABLE_NAME)
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
    const { error } = await supabase.from(TABLE_NAME).insert({
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
      .from(TABLE_NAME)
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

  const { error } = await supabase.from(TABLE_NAME).insert({
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
    .from(TABLE_NAME)
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
