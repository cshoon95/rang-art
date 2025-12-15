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
    .select("*")
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

  // 로직: 각 학생별로 prevMonthEnd 이전 날짜 중 가장 최신 기록 1개를 가져옴
  // Supabase(Postgres)의 DISTINCT ON을 활용
  const { data, error } = await supabase
    .from("attendance")
    .select("student_id, content, date")
    .eq("academy_code", academyCode)
    .lte("date", prevMonthEnd)
    .order("student_id", { ascending: true })
    .order("date", { ascending: false }); // 날짜 내림차순 정렬

  if (error) {
    console.error(error);
    return [];
  }

  // 중복 제거 (학생별 가장 최신 1개만 남김) -> JS에서 처리 or SQL DISTINCT ON 사용
  // 여기선 간단히 JS Map으로 처리
  const map = new Map();
  data.forEach((item) => {
    if (!map.has(item.student_id)) {
      map.set(item.student_id, item.content);
    }
  });

  return Object.fromEntries(map); // { student_id: 'L', ... }
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
      .select("*")
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
