import pool from "@/lib/db";

// 회원 정보 리스트 조회
export const getServerCustomerList = async (academyCode: string) => {
  const query = `
    SELECT * FROM "CUSTOMERS" 
    WHERE "ACADEMY_CODE" = $1 
    ORDER BY "STATE", "NAME"
  `;
  try {
    const { rows } = await pool.query(query, [academyCode]);
    return rows || [];
  } catch (error) {
    console.error("Fetch Customer List Error:", error);
    return [];
  }
};
