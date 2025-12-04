"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// ✅ 회원 정보 수정
export async function updateCustomerAction(param: any) {
  const { id, key, value, updaterID, academyCode } = param;

  // 성별 변환 로직 (필요시)
  let dbValue = value;
  if (key === "SEX") {
    dbValue = value === "남자" ? "M" : "F";
  }

  // 동적 컬럼명 처리 (SQL Injection 주의 - key 검증 필요)
  const allowedKeys = [
    "NAME",
    "SEX",
    "BIRTH",
    "TEL",
    "COUNT",
    "FEE",
    "DATE",
    "NOTE",
    "PARENTNAME",
    "PARENTPHONE",
    "SCHOOL",
    "STATE",
    "CASH_NUMBER",
    "DISCHARGE",
  ];
  if (!allowedKeys.includes(key)) {
    return { success: false, message: "유효하지 않은 필드입니다." };
  }

  const query = `
    UPDATE "CUSTOMERS" 
    SET "${key}" = $1, "UPDATER_ID" = $2 
    WHERE "ID" = $3 AND "ACADEMY_CODE" = $4
  `;

  try {
    await pool.query(query, [dbValue, updaterID, id, academyCode]);

    // 이름 수정 시 출석부 이름도 같이 수정 (트랜잭션 처리 권장)
    if (key === "NAME") {
      // 기존 이름을 알기 위해 별도 조회가 필요할 수 있음 (여기서는 생략)
      // await pool.query(`UPDATE "ATTENDANCE" SET "NAME" = $1 ...`, [value, ...]);
    }

    revalidatePath("/customers");
    return { success: true, message: "수정되었습니다." };
  } catch (error) {
    console.error("Update Customer Error:", error);
    return { success: false, message: "수정 실패" };
  }
}

// ✅ 회원 정보 삭제
export async function deleteCustomerAction(id: number, academyCode: string) {
  const query = `DELETE FROM "CUSTOMERS" WHERE "ID" = $1 AND "ACADEMY_CODE" = $2`;
  try {
    await pool.query(query, [id, academyCode]);
    revalidatePath("/customers");
    return { success: true, message: "삭제되었습니다." };
  } catch (error) {
    console.error("Delete Customer Error:", error);
    return { success: false, message: "삭제 실패" };
  }
}

// ✅ 회원 정보 추가 (Insert)
export async function insertCustomerAction(values: any[]) {
  const query = `
    INSERT INTO "CUSTOMERS"
    ("NAME", "SEX", "BIRTH", "TEL", "COUNT", "FEE", "DATE", "NOTE", "PARENTNAME", "PARENTPHONE", "SCHOOL", "STATE", "REGISTER_ID", "ACADEMY_CODE") 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `;
  try {
    await pool.query(query, values);
    revalidatePath("/customers");
    return { success: true, message: "등록되었습니다." };
  } catch (error) {
    console.error("Insert Customer Error:", error);
    return { success: false, message: "등록 실패" };
  }
}
