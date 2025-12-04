"use server";

import pool from "@/lib/db";

// 1. 시간 리스트 조회 액션 (정렬 로직 추가)
export const getTempScheduleTimeListAction = async (academyCode: string) => {
  const query = `
    SELECT DISTINCT "TIME" 
    FROM "temp_schedule" 
    WHERE "ACADEMY_CODE" = $1 
  `;
  // ⚠️ SQL에서 ORDER BY를 빼고, 아래 JS 로직으로 정렬합니다.

  try {
    const { rows } = await pool.query(query, [academyCode]);

    if (!rows || rows.length === 0) return [];

    // ✅ 학원 시간표 맞춤 정렬 로직
    const sortedRows = rows.sort((a: any, b: any) => {
      const getWeight = (timeStr: string) => {
        if (!timeStr) return 0;

        // "03:30" 형식에서 시간과 분 추출
        let hour = parseInt(timeStr.substring(0, 2), 10);
        const minute = parseInt(timeStr.substring(3, 5), 10);

        // 🔥 핵심: 08시 이전(01~07)은 오후/밤으로 간주하여 +12시간 (뒤로 보냄)
        // 예: 01:00 -> 13:00으로 취급, 09:00 -> 09:00으로 취급
        // 결과: 09:00이 01:00보다 작으므로 먼저 나옴
        if (hour < 8) {
          hour += 12;
        }

        // 분 단위까지 합쳐서 비교 값 생성
        return hour * 60 + minute;
      };

      return getWeight(a.TIME) - getWeight(b.TIME);
    });

    // 직렬화해서 반환
    return JSON.parse(JSON.stringify(sortedRows));
  } catch (error) {
    console.error("Fetch TimeList Error:", error);
    return [];
  }
};

// 2. 스케줄 데이터 조회 액션 (기존 동일)
export const getTempScheduleDataListAction = async (academyCode: string) => {
  const query = `
    SELECT "TIME", "DAY", "CONTENT", "TYPE" 
    FROM "temp_schedule" 
    WHERE "ACADEMY_CODE" = $1
  `;
  try {
    const { rows } = await pool.query(query, [academyCode]);
    return JSON.parse(JSON.stringify(rows || []));
  } catch (error) {
    console.error("Fetch DataList Error:", error);
    return [];
  }
};
