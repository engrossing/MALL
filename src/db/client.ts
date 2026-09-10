import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// 개발 중 핫리로드 시 커넥션이 계속 늘어나는 것을 방지하기 위해 전역에 캐시합니다.
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

// Neon, Supabase, Vercel Postgres 등 대부분의 관리형 Postgres는 SSL 연결이 필수입니다.
// 로컬 개발용 localhost 연결이 아니면 자동으로 SSL을 활성화합니다.
const isLocalDb =
  !!connectionString &&
  /(localhost|127\.0\.0\.1)/.test(connectionString);

const pool =
  global.__pgPool ??
  new Pool({
    connectionString,
    max: 5,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export const db = drizzle(pool, { schema });
