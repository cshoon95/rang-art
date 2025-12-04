"use server"; // ⭐ 이 파일은 서버에서만 실행됨을 선언

import pool from "@/lib/db";

export async function getCustomers(academyCode: string) {
  const query = `SELECT * FROM "CUSTOMERS" WHERE "ACADEMY_CODE" = $1`;

  try {
    const { rows } = await pool.query(query, [academyCode]);
    // 데이터를 바로 리턴하면 클라이언트가 받음 (JSON 변환 불필요)
    return { success: true, data: rows };
  } catch (error) {
    console.error(error);
    return { success: false, error: "DB Error" };
  }
}
