"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// 테이블명 (MySQL의 USER 테이블에 해당, Supabase에서는 public.users 또는 employees 권장)
const TABLE_NAME = "users";

interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * ✅ 직원 정보 추가
 */
export async function createEmployeeAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase.from(TABLE_NAME).insert({
    id: formData.userId, // 로그인용 ID (MySQL의 ID 컬럼)
    name: formData.name,
    level: formData.level, // 직급 코드
    tel: formData.tel,
    birth: formData.birth,
    salary: formData.salary,
    note: formData.note,
    date: formData.date, // 입사일 (YYYYMMDD)
    account: formData.account,
    state: formData.state, // 재직 상태 (Y/N)
    academy_code: formData.academyCode,
    register_id: "admin", // 등록자 (세션에서 가져오기 권장)
    register_date: new Date().toISOString(),
  });

  if (error) {
    console.error("Create Employee Error:", error);
    return { success: false, message: "직원 등록 실패" };
  }

  revalidatePath("/employees");
  return { success: true, message: "직원이 등록되었습니다." };
}

/**
 * ✅ 직원 정보 전체 수정
 */
export async function updateEmployeeAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  const updateData = {
    name: formData.name,
    level: formData.level,
    tel: formData.tel,
    birth: formData.birth,
    salary: formData.salary,
    note: formData.note,
    date: formData.date,
    account: formData.account,
    state: formData.state,
    updater_id: "admin", // 수정자
  };

  // IDX(PK)를 기준으로 업데이트
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq("idx", formData.idx) // MySQL의 IDX에 해당 (Supabase의 Primary Key)
    .eq("academy_code", formData.academyCode);

  if (error) {
    console.error("Update Employee Error:", error);
    return { success: false, message: "정보 수정 실패" };
  }

  revalidatePath("/employees");
  return { success: true, message: "정보가 수정되었습니다." };
}

/**
 * ✅ 직원 삭제
 */
export async function deleteEmployeeAction({
  id, // 로그인 ID (string)
  academyCode,
}: {
  id: string;
  academyCode: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  // 로그인 ID 기준으로 삭제 (PK가 idx라면 idx로 변경 필요)
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id) // 로그인 ID 컬럼
    .eq("academy_code", academyCode);

  if (error) {
    console.error("Delete Employee Error:", error);
    return { success: false, message: "삭제 실패" };
  }

  revalidatePath("/employees");
  return { success: true, message: "삭제되었습니다." };
}
