import pool from "@/lib/db";

// 1. 픽업 시간 리스트 조회 (서버용)
export const getServerPickupTimeList = async (academyCode: string) => {
  const query = `
    SELECT DISTINCT "TIME" 
    FROM "pickup" 
    WHERE "academy_code" = $1 
    ORDER BY "TIME" ASC
  `;
  try {
    const { rows } = await pool.query(query, [academyCode]);

    if (!rows || rows.length === 0) return [];

    // 시간 정렬 및 필터링 (0시~9시 뒤로, 9시~24시 앞으로)
    const more12 = rows.filter((item: any) => {
      const hour = Number(item.TIME?.substr(0, 2));
      return hour > 0 && hour < 9;
    });

    const less24 = rows.filter((item: any) => {
      const hour = Number(item.TIME?.substr(0, 2));
      return hour >= 9 && hour <= 24;
    });

    return [...less24, ...more12];
  } catch (error) {
    console.error("Fetch Pickup TimeList Error:", error);
    return [];
  }
};

// 2. 픽업 데이터 리스트 조회 (서버용)
export const getServerPickupDataList = async (academyCode: string) => {
  const query = `
    SELECT "TIME", "DAY", "CONTENT"
    FROM "pickup" 
    WHERE "academy_code" = $1 AND "CONTENT" IS NOT NULL 
    ORDER BY "TIME" ASC
  `;
  try {
    const { rows } = await pool.query(query, [academyCode]);
    return rows || [];
  } catch (error) {
    console.error("Fetch Pickup DataList Error:", error);
    return [];
  }
};
