"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// ✅ 픽업 데이터 등록 및 수정 (Upsert)
export async function upsertPickupAction(param: any) {
  const { content, time, day, academyCode, registerID } = param;

  // 1. 해당 셀에 데이터가 있는지 확인
  const checkQuery = `
    SELECT "CONTENT" FROM "pickup" 
    WHERE "DAY" = $1 AND "TIME" = $2 AND "academy_code" = $3
  `;

  try {
    const { rows } = await pool.query(checkQuery, [day, time, academyCode]);
    const exists = rows.length > 0;

    if (!exists) {
      // 신규 등록 (INSERT)
      const insertQuery = `
        INSERT INTO "pickup" ("CONTENT", "DAY", "TIME", "register_id", "academy_code") 
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(insertQuery, [
        content,
        day,
        time,
        registerID,
        academyCode,
      ]);
    } else {
      // 수정 (UPDATE)
      const updateQuery = `
        UPDATE "pickup" SET "CONTENT" = $1, "updater_id" = $2 
        WHERE "DAY" = $3 AND "TIME" = $4 AND "academy_code" = $5
      `;
      await pool.query(updateQuery, [
        content,
        registerID,
        day,
        time,
        academyCode,
      ]);
    }

    // 페이지 데이터 갱신
    revalidatePath("/pickup");

    return {
      success: true,
      message: exists ? "수정되었습니다." : "등록되었습니다.",
    };
  } catch (error) {
    console.error("Pickup Upsert Error:", error);
    return { success: false, message: "오류가 발생했습니다." };
  }
}

// ✅ 픽업 시간 추가
export async function insertPickupTimeAction(param: any) {
  const { time, registerID, academyCode } = param;
  const query = `
    INSERT INTO "pickup"("TIME", "register_id", "academy_code") 
    VALUES ($1, $2, $3)
  `;

  try {
    await pool.query(query, [time, registerID, academyCode]);
    revalidatePath("/pickup");
    return { success: true, message: "시간이 추가되었습니다." };
  } catch (error) {
    console.error("Insert Pickup Time Error:", error);
    return { success: false, message: "시간 추가 실패" };
  }
}

// ✅ 픽업 시간 삭제
export async function deletePickupTimeAction(param: any) {
  const { time, academyCode } = param;
  const query = `
    DELETE FROM "pickup" 
    WHERE "TIME" = $1 AND "academy_code" = $2
  `;

  try {
    await pool.query(query, [time, academyCode]);
    revalidatePath("/pickup");
    return { success: true, message: "시간이 삭제되었습니다." };
  } catch (error) {
    console.error("Delete Pickup Time Error:", error);
    return { success: false, message: "시간 삭제 실패" };
  }
}
