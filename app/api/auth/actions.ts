"use server";

import pool from "@/lib/db";
import { academyList } from "@/utils/list";

// ✅ 지점 등록 액션 (INSERT + UPDATE 겸용)
export async function insertJoinAction(
  email: string,
  name: string,
  academyCode: string
) {
  // '2'번 지점(무료체험)은 바로 승인(Y), 나머지는 대기(N)
  const state = academyCode === "2" ? "Y" : "N";
  // 선생님
  const level = 3;
  const academyInfo = academyList.find((v) => v.code === academyCode);
  const academyName = academyInfo?.name;

  console.log("academyNae", academyName);
  const today = new Date();

  // 🚨 [쿼리 수정] UPDATE 절에 LEVEL, academy_name, updater_date 추가
  const query = `
    INSERT INTO "USER" (
      "id", "NAME", "academy_code", "state", 
      "register_id", "LEVEL", "academy_name", "register_date"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT ("id") 
    DO UPDATE SET 
      "NAME" = $2,
      "academy_code" = $3,
      "state" = $4,
      "LEVEL" = $6,           -- ✅ 레벨 업데이트 추가
      "academy_name" = $7,    -- ✅ 학원명 업데이트 추가
      "updater_id" = $1,      -- 수정자 (본인 이메일)
      "updater_date" = $8     -- ✅ 수정일 업데이트 추가 (오늘 날짜)
  `;

  try {
    // 파라미터 순서 ($1 ~ $8)
    await pool.query(query, [
      email, // $1: id
      name, // $2: NAME
      academyCode, // $3: academy_code
      state, // $4: state
      email, // $5: register_id (최초 등록자)
      level, // $6: LEVEL
      academyName, // $7: academy_name
      today, // $8: register_date / updater_date
    ]);

    return { success: true };
  } catch (error) {
    console.error("Register Branch Error:", error);
    throw new Error("지점 등록 실패");
  }
}
