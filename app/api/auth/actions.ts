"use server";

import { createClient } from "@/utils/supabase/server";
import { ACADEMY_LIST } from "@/utils/list";
import { cookies } from "next/headers";

// ✅ 지점 등록 액션 (Supabase 버전)
export async function insertJoinAction(
  email: string,
  name: string,
  academyCode: string
) {
  const supabase = await createClient();

  // 1. 비즈니스 로직 설정
  // '2'번 지점(무료체험)은 바로 승인(Y), 나머지는 대기(N)
  const state = academyCode === "2" ? "Y" : "N";
  const level = 3; // 선생님
  const academyInfo = ACADEMY_LIST.find((v) => v.code === academyCode);
  const academyName = academyInfo?.name;
  const today = new Date().toISOString(); // Supabase Timestamptz 형식

  // 2. 이미 존재하는 유저인지 확인
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("id", email)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116: 데이터 없음 (정상) -> 그 외에는 진짜 에러
    console.error("User Check Error:", fetchError);
    throw new Error("사용자 조회 실패");
  }

  let actionError;

  // 3. 분기 처리 (SQL의 ON CONFLICT DO UPDATE 로직 구현)
  if (existingUser) {
    // ✅ 이미 존재함 -> UPDATE 실행
    // (level, academy_name, updater_date 업데이트)
    const { error } = await supabase
      .from("users")
      .update({
        name: name,
        academy_code: academyCode,
        state: state,
        level: level,
        academy_name: academyName,
        updater_id: email, // 수정자 (본인)
        updater_date: today, // 수정일 업데이트
      })
      .eq("id", email);

    actionError = error;
  } else {
    // ✅ 없음 -> INSERT 실행
    // (register_id, register_date 입력)
    const { error } = await supabase.from("users").insert({
      id: email,
      name: name,
      academy_code: academyCode,
      state: state,
      register_id: email, // 최초 등록자
      level: level,
      academy_name: academyName,
      register_date: today, // 등록일
    });

    actionError = error;
  }

  if (actionError) {
    console.error("Register Branch Error:", actionError);
    throw new Error("지점 등록 실패");
  }

  return { success: true };
}

// ✅ 세션(쿠키) 초기화 함수
export async function clearAcademySession() {
  const cookieStore = await cookies();

  // 학원 관련 쿠키 삭제
  cookieStore.delete("academyCode");
  cookieStore.delete("academyName");

  // 필요 시 Next-Auth 관련 쿠키 외의 커스텀 쿠키 삭제 로직 추가
}

/**
 * ✅ 무료체험 전환 액션
 * - academy_code를 '2'로, state를 'Y'로 즉시 변경합니다.
 */
export async function startFreeTrialAction(email: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({
      academy_code: "2",
      academy_name: "무료체험",
      state: "Y", // 즉시 승인
      level: 3, // 기본 강사 레벨
      updater_id: email,
      updater_date: new Date().toISOString(),
    })
    .eq("id", email);

  if (error) {
    console.error("Free Trial Error:", error);
    return { success: false, message: "무료체험 전환 실패" };
  }

  return { success: true };
}
