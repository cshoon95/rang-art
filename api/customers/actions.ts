"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE_NAME = "customers";

/**
 * 회원 리스트 조회 (Server Component 용)
 */
export const getServerCustomerList = async (academyCode: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("academy_code", academyCode)
    .order("state", { ascending: true }) // 재원 > 휴원 > 퇴원 순
    .order("name", { ascending: true }); // 이름순

  if (error) {
    console.error("Fetch Customer List Error:", error);
    return [];
  }

  return data || [];
};

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

  const { error } = await supabase.from("users").insert({
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
    .from("users")
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
    .from("users")
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

interface ActionResponse {
  success: boolean;
  message: string;
}

// ✅ 지점 삭제
export async function deleteBranchAction(code: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("branches").delete().eq("code", code);

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
    .from("branches")
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
    .from("branches")
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
    .from("branches")
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
    .from("branches")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Get Branch Detail Error:", error);
    return null;
  }

  return data;
}
