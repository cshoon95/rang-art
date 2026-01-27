"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Supabase 테이블명 (기존 레거시의 CALENDAR 테이블)
const TABLE_NAME = "calendar";

interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * ✅ 캘린더 리스트 조회
 * @param academyCode 학원 코드
 */
export async function getCalendarListAction(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode)
    .order("start_date", { ascending: true }) // 날짜순 정렬 추가
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Get Calendar List Error:", error);
    return [];
  }

  // DB의 snake_case 컬럼을 기존 로직과 호환되도록 매핑하여 리턴하거나,
  // 클라이언트에서 snake_case를 사용하도록 변경해야 합니다.
  // 여기서는 Supabase Raw Data를 그대로 내리고 클라이언트에서 처리하도록 합니다.
  return data;
}

/**
 * ✅ 캘린더 일정 추가
 */
export async function createCalendarAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase.from(TABLE_NAME).insert({
    content: formData.content,
    start_date: formData.startDate,
    start_time: formData.startTime,
    end_date: formData.endDate,
    end_time: formData.endTime,
    academy_code: formData.academy_code, // 클라이언트에서 academy_code로 넘기거나 여기서 매핑
    register_id: formData.register_id, // 등록자 ID
    type: formData.type || "event",
    // register_date: new Date().toISOString(), // DB에 default value가 있다면 생략 가능
  });

  if (error) {
    console.error("Create Calendar Error:", error);
    return { success: false, message: "일정 등록에 실패했습니다." };
  }

  revalidatePath("/schedule");
  return { success: true, message: "일정이 등록되었습니다." };
}

/**
 * ✅ 캘린더 일정 수정
 */
export async function updateCalendarAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      content: formData.content,
      start_date: formData.startDate,
      start_time: formData.startTime,
      end_date: formData.endDate,
      end_time: formData.endTime,
      updater_id: formData.updater_id,
      type: formData.type || "event",
    })
    .eq("idx", formData.idx) // 👈 [변경] id -> idx
    .eq("academy_code", formData.academy_code);

  if (error) {
    console.error("Update Calendar Error:", error);
    return { success: false, message: "일정 수정에 실패했습니다." };
  }

  revalidatePath("/schedule");
  return { success: true, message: "일정이 수정되었습니다." };
}

/**
 * ✅ 캘린더 일정 삭제
 */
export async function deleteCalendarAction(
  idx: number, // 👈 [변경] id -> idx
  academyCode: string
): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("idx", idx) // 👈 [변경] id -> idx
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Calendar Error:", error);
    return { success: false, message: "일정 삭제에 실패했습니다." };
  }

  revalidatePath("/schedule");
  return { success: true, message: "일정이 삭제되었습니다." };
}
