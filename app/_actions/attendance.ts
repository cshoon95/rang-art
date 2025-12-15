"use server";

import { createClient } from "@/utils/supabase/server";
import { format, subMonths } from "date-fns";

// 1. 기간별 출석 데이터 조회
export async function getAttendanceListAction(
  academyCode: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("student_id, date, content")
    .eq("academy_code", academyCode)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Fetch Attendance Error:", error);
    return [];
  }
  return data;
}

// 2. 학생 리스트 조회 (count 컬럼 포함 필수)
export async function getActiveStudentsAction(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, state, count, fee_yn, msg_yn")
    .eq("academy_code", academyCode)
    .eq("state", "0") // 재원생만 조회
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch Students Error:", error);
    return [];
  }
  return data;
}

// 3. 출석 입력/수정 (Upsert)
// 예시: upsertAttendanceAction
// app/_actions.ts (또는 해당 파일)

export async function upsertAttendanceAction({
  academyCode,
  studentId,
  date,
  content,
  name, // ✅ 파라미터 추가
}: any) {
  const supabase = await createClient();

  // 1. 내용이 없으면(빈 문자열 or 공백) -> 데이터 삭제 (DELETE)
  if (!content || content.trim() === "") {
    const { error } = await supabase.from("attendance").delete().match({
      academy_code: academyCode,
      student_id: studentId,
      date: date,
    });

    if (error) throw error;
    return { status: "DELETED" };
  }

  // 2. 내용이 있으면 -> 데이터 등록/수정 (UPSERT)
  const { error } = await supabase.from("attendance").upsert(
    {
      academy_code: academyCode,
      student_id: studentId,
      date: date,
      content: content,
      name: name, // ✅ DB에 이름도 함께 저장
    },
    { onConflict: "student_id, date" } // PK 충돌 시 업데이트
  );

  if (error) throw error;
  return { status: "UPSERTED" };
}

// ✅ [New] 전월 마지막 출석 기록 조회 (일괄 조회 최적화)
export async function getPrevMonthLastDataAction(
  academyCode: string,
  prevMonthEnd: string
) {
  const supabase = await createClient();

  // 🚀 최적화 전략: "전월 말일" 기준 데이터이므로, 너무 먼 과거 데이터(1년 전 등)는 필요 없을 확률이 높습니다.
  // 성능을 위해 검색 범위를 '전월 말일 기준 최근 2~3달'로 좁히는 것이 좋습니다.
  // 만약 3달 이상 결석했다면 '전월 데이터'를 보여줄 필요가 없거나 '-'로 표시해도 무방하다면 아래 로직 사용.

  const searchLimitDate = format(
    subMonths(new Date(prevMonthEnd), 3),
    "yyyy-MM-dd"
  );

  const { data, error } = await supabase
    .from("attendance")
    .select("student_id, content, date")
    .eq("academy_code", academyCode)
    .lte("date", prevMonthEnd) // 전월 말일보다 작거나 같고
    .gte("date", searchLimitDate) // 💥 추가: 너무 옛날 데이터는 제외 (속도 향상 핵심)
    .order("date", { ascending: false }); // 최신순 정렬

  if (error) {
    console.error(error);
    return {};
  }

  // JS Map을 이용한 중복 제거 (최신 1건만 유지)
  const map = new Map();
  // data는 이미 최신순(date desc)으로 정렬되어 있으므로, 먼저 나오는게 최신 데이터입니다.
  for (const item of data) {
    if (!map.has(item.student_id)) {
      map.set(item.student_id, item.content);
    }
  }

  return Object.fromEntries(map);
}

// ✅ [New] 원생 상태 업데이트 (원비, 메시지 상태)
export async function updateCustomerStatusAction(
  name: string,
  field: "fee_yn" | "msg_yn",
  value: any
) {
  const supabase = await createClient();
  await supabase
    .from("customers")
    .update({ [field]: value })
    .eq("name", name);
}

export async function getStudentAttendanceHistoryAction(
  academyCode: string,
  name: string
) {
  const supabase = await createClient();

  // 최근 6개월 데이터만 조회 (성능 최적화)
  const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");

  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("student_id, content, date")
      .eq("academy_code", academyCode)
      .eq("name", name)
      .gte("date", sixMonthsAgo)
      .order("date", { ascending: false });

    if (error) {
      console.error("출석 이력 조회 에러:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Server Action Error:", error);
    return [];
  }
}

export async function getInActiveStudentsAction(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, state, count, fee_yn, msg_yn")
    .eq("academy_code", academyCode)
    .eq("state", "2") // 퇴원생만 조회
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch Students Error:", error);
    return [];
  }
  return data;
}
