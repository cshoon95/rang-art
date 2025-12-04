import { Pool } from "pg";

let pool: Pool;

declare global {
  var _postgresPool: Pool | undefined;
}

if (!global._postgresPool) {
  global._postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 👇 ssl 옵션을 이렇게 명시적으로 다시 적어주세요
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

pool = global._postgresPool;

export default pool;
