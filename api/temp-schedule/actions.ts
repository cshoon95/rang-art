"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// 공통 응답 타입
interface ActionResponse {
  success: boolean;
  message: string;
}

// ✅ 1. 스케줄 내용 저장 (Upsert: 등록/수정)
export async function upsertTempScheduleAction(param: {
  content: string;
  time: string;
  day: string | number;
  type: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const { content, time, day, type, academyCode, registerID } = param;

  // 1. 해당 셀에 데이터가 있는지 확인
  const checkQuery = `
    SELECT "CONTENT" FROM TEMP_SCHEDULE 
    WHERE "DAY" = $1 AND "TIME" = $2 AND "TYPE" = $3 AND "ACADEMY_CODE" = $4
  `;

  try {
    const { rows } = await pool.query(checkQuery, [
      day,
      time,
      type,
      academyCode,
    ]);
    const exists = rows.length > 0;

    console.log("dsfsdfd", exists);
    if (!exists) {
      // 신규 등록 (INSERT)
      // ⚠️ 주의: SQL 문법 오타 수정됨 ("ACADEMY_CODE"") -> ("ACADEMY_CODE")
      const insertQuery = `
        INSERT INTO TEMP_SCHEDULE ("CONTENT", "DAY", "TIME", "TYPE", "REGISTER_ID", "ACADEMY_CODE") 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await pool.query(insertQuery, [
        content,
        day,
        time,
        type,
        registerID,
        academyCode,
      ]);
    } else {
      // 수정 (UPDATE)
      const updateQuery = `
        UPDATE TEMP_SCHEDULE SET "CONTENT" = $1, "UPDATER_ID" = $2 
        WHERE "DAY" = $3 AND "TIME" = $4 AND "TYPE" = $5 AND "ACADEMY_CODE" = $6
      `;
      await pool.query(updateQuery, [
        content,
        registerID,
        day,
        time,
        type,
        academyCode,
      ]);
    }

    // 데이터 갱신
    revalidatePath("/temp-schedule");

    return {
      success: true,
      message: exists ? "수정되었습니다." : "등록되었습니다.",
    };
  } catch (error) {
    console.error("Upsert Error:", error);
    return { success: false, message: "오류가 발생했습니다." };
  }
}

// ✅ 2. 시간(행) 추가 액션
export async function insertTempScheduleTimeAction(data: {
  time: string;
  academyCode: string;
  registerID: string;
}): Promise<ActionResponse> {
  const { time, academyCode, registerID } = data;

  const query = `
    INSERT INTO TEMP_SCHEDULE ("TIME", "REGISTER_ID", "ACADEMY_CODE") 
    VALUES ($1, $2, $3)
  `;

  try {
    await pool.query(query, [time, registerID, academyCode]);
    revalidatePath("/temp-schedule");
    return { success: true, message: "시간이 등록되었습니다." };
  } catch (error) {
    console.error("Insert Time Error:", error);
    return { success: false, message: "시간 등록 중 오류가 발생했습니다." };
  }
}

// ✅ 3. 시간(행) 삭제 액션
export async function deleteTempScheduleTimeAction(data: {
  time: string;
  academyCode: string;
}): Promise<ActionResponse> {
  const { time, academyCode } = data;

  const query = `
    DELETE FROM TEMP_SCHEDULE 
    WHERE "TIME" = $1 AND "ACADEMY_CODE" = $2
  `;

  try {
    await pool.query(query, [time, academyCode]);
    revalidatePath("/temp-schedule");
    return { success: true, message: "시간이 삭제되었습니다." };
  } catch (error) {
    console.error("Delete Time Error:", error);
    return { success: false, message: "시간 삭제 중 오류가 발생했습니다." };
  }
}
