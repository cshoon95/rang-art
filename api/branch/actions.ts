"use server";

import { createClient } from "@/utils/supabase/server";
import { useSession } from "next-auth/react";
import { revalidatePath } from "next/cache";

// 테이블명 (MySQL의 USER 테이블에 해당, Supabase에서는 public.users 또는 employees 권장)
const TABLE_NAME = "branches";

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

// ✅ 지점 삭제
export async function deleteBranchAction(code: string) {
  const supabase = await createClient();

  const { error } = await supabase.from(TABLE_NAME).delete().eq("code", code);

  if (error) {
    console.error("Delete Branch Error:", error);
    return { success: false, message: "삭제에 실패했습니다." };
  }

  revalidatePath("/branch");
  return { success: true, message: "삭제되었습니다." };
}

// ✅ 지점 목록 조회
export async function getBranches() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("register_date", { ascending: true });

  if (error) {
    console.error("Get Branches Error:", error);
    return [];
  }

  return data;
}

export async function getBranchesCount(code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("count1, count2, count3, count4, count5") // [수정] count -> count5
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Get Branches Error:", error);
    return null;
  }

  return data;
}

export async function upsertBranchAction(formData: any) {
  const supabase = await createClient();

  const branchData = {
    code: formData.code,
    name: formData.name,
    address: formData.address,
    detail_address: formData.detailAddress,
    tel: formData.tel,
    owner: formData.owner,
    business_no: formData.businessNo, // ✅ 추가됨
    count1: formData.count1,
    count2: formData.count2,
    count3: formData.count3,
    count4: formData.count4,
    count5: formData.count5,
  };

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(branchData, { onConflict: "code" });

  if (error) {
    console.error("Upsert Branch Error:", error);
    return { success: false, message: "저장에 실패했습니다." };
  }

  revalidatePath("/branch");
  return { success: true, message: "저장되었습니다." };
}

// ... (deleteBranchAction 기존 유지) ...

// 2. [신규] 특정 지점 상세 정보 조회 (납입증명서용)
export async function getBranchDetailAction(code: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Get Branch Detail Error:", error);
    return null;
  }

  return data;
}
