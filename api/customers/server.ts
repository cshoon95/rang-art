"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const TABLE_NAME = "customers";

// 공통 응답 타입
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
  const { error } = await supabase.from(TABLE_NAME).insert({
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
    .from(TABLE_NAME)
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
    .from(TABLE_NAME)
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
