import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./client";

async function main() {
  console.log("데이터베이스 마이그레이션을 적용합니다...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("마이그레이션 완료.");
  process.exit(0);
}

main().catch((err) => {
  console.error("마이그레이션 실패:", err);
  process.exit(1);
});
