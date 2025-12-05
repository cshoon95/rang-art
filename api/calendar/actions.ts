"use server";

import { createClient } from "@/utils/supabase/server";

const TABLE_NAME = "calendar";

/**
 * 캘린더 리스트 조회 (전체 or 기간별)
 * Legacy: /api/calendar/select, /api/calendar/select_data
 */
export const getCalendarListAction = async (
  academyCode: string,
  startDate?: string,
  endDate?: string
) => {
  const supabase = await createClient();

  let query = supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode);

  // 기간 조회 조건이 있다면 추가 (Legacy select_data 대응)
  if (startDate && endDate) {
    query = query.gte("startdate", startDate).lte("enddate", endDate);
  }

  const { data, error } = await query.order("startdate", { ascending: true });

  if (error) {
    console.error("Calendar Fetch Error:", error);
    throw new Error(error.message);
  }

  // Legacy 코드와의 호환성을 위해 대문자 키로 리턴하거나,
  // 프론트에서 소문자로 받도록 수정해야 합니다.
  // 여기서는 Supabase 표준인 소문자 컬럼명을 그대로 반환합니다.
  return data;
};

/**
 * 캘린더 일정 추가
 * Legacy: /api/calendar/insert
 */
export interface ICreateCalendarParams {
  content: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  registerId: string;
  academyCode: string;
}

export const createCalendarAction = async (params: ICreateCalendarParams) => {
  const supabase = await createClient();

  const { data, error } = await supabase.from(TABLE_NAME).insert({
    content: params.content,
    startdate: params.startDate,
    starttime: params.startTime,
    enddate: params.endDate,
    endtime: params.endTime,
    register_id: params.registerId,
    academy_code: params.academyCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * 캘린더 일정 수정
 * Legacy: /api/calendar/update
 */
export interface IUpdateCalendarParams extends ICreateCalendarParams {
  id: number;
  updaterId: string;
}

export const updateCalendarAction = async (params: IUpdateCalendarParams) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      content: params.content,
      startdate: params.startDate,
      starttime: params.startTime,
      enddate: params.endDate,
      endtime: params.endTime,
      updater_id: params.updaterId,
      // updated_at: new Date().toISOString(), // 필요 시 추가
    })
    .eq("id", params.id)
    .eq("academy_code", params.academyCode);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * 캘린더 일정 삭제
 * Legacy: /api/calendar/delete
 */
export const deleteCalendarAction = async (id: number, academyCode: string) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .eq("academy_code", academyCode);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
