"use server";

import { getEmployeeTenure } from "@/utils/common";
import { replaceHyphenFormat } from "@/utils/format";
import { getEmployeeLevel } from "@/utils/list";
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

interface ActionResponse {
  success: boolean;
  message: string;
}

/**
 * ✅ 회원 정보 추가
 */
export async function createCustomerAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  // DB 컬럼에 맞게 매핑 (모두 소문자로 변경)
  const { error } = await supabase.from("customers").insert({
    name: formData.name,
    sex: formData.sex === "남자" ? "M" : "F",
    birth: formData.birth,
    tel: formData.tel,
    school: formData.school,
    parentname: formData.parentName,
    parentphone: formData.parentPhone,
    state: "0", // 기본 재원 상태
    academy_code: formData.academyCode,
    register_id: formData.registerID,
    date: new Date().toISOString().split("T")[0].replace(/-/g, ""), // 오늘 날짜 YYYYMMDD
  });

  if (error) {
    console.error("Create Customer Error:", error);
    return { success: false, message: "등록 실패" };
  }

  revalidatePath("/customers");
  return { success: true, message: "학생이 등록되었습니다." };
}

/**
 * ✅ 회원 정보 수정 (단일 필드 or 전체)
 * - 기존 클라이언트의 복잡한 분기 로직을 서버로 통합
 */
export async function updateCustomerAction(param: {
  id: number;
  field: string;
  value: string;
  updaterID: string;
  academyCode: string;
  prevName?: string; // 이름 변경 시 필요
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const { id, field, value, updaterID, academyCode, prevName } = param;

  // DB 업데이트용 객체 (컬럼명 소문자)
  let updateData: any = { updater_id: updaterID };

  // 들어오는 field가 대문자일 수 있으므로 소문자로 변환하여 DB 컬럼명으로 사용
  let dbField = field.toLowerCase();
  let dbValue = value;

  // 1. 필드별 예외 처리 (기존 로직 이식)
  switch (field) {
    case "sex":
      dbValue = value === "남자" ? "M" : "F";
      break;
    case "state":
      if (value === "재원") dbValue = "0";
      else if (value === "휴원") dbValue = "1";
      else if (value === "퇴원") dbValue = "2";
      else if (value === "대기") dbValue = "3";

      // 퇴원 처리 시 퇴원일 자동 업데이트
      if (dbValue === "2") {
        updateData["discharge"] = new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "");
      }
      break;
    case "COUNT":
      // 횟수 변경 시 로직 (단순 업데이트로 처리하거나 필요 시 회비 연동 로직 추가)
      break;
  }

  updateData[dbField] = dbValue;

  // 2. 업데이트 실행
  const { error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id) // 소문자 id
    .eq("academy_code", academyCode); // 소문자 academy_code

  if (error) {
    console.error("Update Customer Error:", error);
    return { success: false, message: "수정 실패" };
  }

  // 3. 이름 변경 시 출석부(attendance) 이름도 동기화
  if (field === "NAME" && prevName && prevName !== value) {
    await supabase
      .from("attendance")
      .update({ name: value }) // 소문자 name
      .eq("name", prevName) // 소문자 name
      .eq("academy_code", academyCode); // 소문자 academy_code
  }

  revalidatePath("/customers");
  return { success: true, message: "수정되었습니다." };
}

/**
 * ✅ 회원 삭제
 */
export async function deleteCustomerAction({
  id,
  academyCode,
}: {
  id: number;
  academyCode: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id) // 소문자 id
    .eq("academy_code", academyCode); // 소문자 academy_code

  if (error) {
    return { success: false, message: "삭제 실패" };
  }

  revalidatePath("/customers");
  return { success: true, message: "삭제되었습니다." };
}

export async function updateCustomerFullAction(
  formData: any
): Promise<ActionResponse> {
  const supabase = await createClient();

  // 1. 업데이트할 데이터 매핑
  const updateData = {
    name: formData.name,
    sex: formData.sex === "남자" ? "M" : "F",
    birth: formData.birth,
    tel: formData.tel,
    school: formData.school,
    parentname: formData.parentName, // DB 컬럼명 확인 필요 (parentname or parent_name)
    parentphone: formData.parentPhone,
    cash_number: formData.cashNumber,
    state: formData.state,
    count: formData.count,
    fee: formData.fee,
    date: formData.date, // YYYYMMDD
    discharge: formData.discharge, // YYYYMMDD
    note: formData.note,
    updater_id: "admin", // 실제 로그인 유저 ID로 변경 권장
  };

  // 2. DB 업데이트 실행
  const { error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", formData.id)
    .eq("academy_code", formData.academyCode);

  if (error) {
    console.error("Update Full Error:", error);
    return { success: false, message: "수정 실패" };
  }

  // 3. 이름이 변경되었다면 출석부(attendance) 이름 동기화 로직
  // (formData에 prevName이 포함되어 있다고 가정)
  if (formData.prevName && formData.prevName !== formData.name) {
    await supabase
      .from("attendance")
      .update({ name: formData.name })
      .eq("name", formData.prevName)
      .eq("academy_code", formData.academyCode);
  }

  revalidatePath("/customers");
  return { success: true, message: "수정되었습니다." };
}

/**
 * ✅ 직원 리스트 조회 (Formatted Data 반환)
 */
export async function getEmployees(academyCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("academy_code", academyCode)
    .order("date", { ascending: true }) // 입사일순
    .order("state", { ascending: true }); // 상태순

  if (error) {
    console.error("Get Employees Error:", error);
    return [];
  }

  // 여기서 포맷팅을 수행하여 반환합니다.
  return data.map((item: any) => ({
    IDX: item.idx, // PK
    ID: item.id, // 로그인 ID
    NAME: item.name,
    TEL: item.tel ? replaceHyphenFormat(item.tel, "phone") : "",
    DATE: item.date ? replaceHyphenFormat(item.date, "date") : "", // 입사일 YYYY-MM-DD
    TENURE: getEmployeeTenure(item.date || ""), // 근속 기간
    ACCOUNT: item.account || "",
    BIRTH: item.birth ? replaceHyphenFormat(item.birth, "date") : "",
    SALARY: item.salary || "",
    LEVEL_CD: item.level, // 원본 코드 (필터링용)
    LEVEL: getEmployeeLevel(item.level), // 한글 변환 (표시용)
    STATE: item.state === "Y" ? "O" : "X", // 재직: O, 퇴사: X
    NOTE: item.note || "",
  }));
}
