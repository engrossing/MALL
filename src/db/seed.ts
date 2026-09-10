import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./client";
import { users, priceTiers, products } from "./schema";
import { createId } from "./id";
import { eq } from "drizzle-orm";

async function main() {
  console.log("시드 데이터 생성을 시작합니다...");

  // 1. 거래처 등급 (Price Tier)
  const tierDefs = [
    { name: "일반", discountPercent: "0", description: "신규/일반 거래처" },
    { name: "우수거래처", discountPercent: "5", description: "기준가 대비 5% 할인" },
    { name: "VIP", discountPercent: "10", description: "기준가 대비 10% 할인" },
  ];

  const tierIds: Record<string, string> = {};
  for (const t of tierDefs) {
    const existing = await db
      .select()
      .from(priceTiers)
      .where(eq(priceTiers.name, t.name))
      .limit(1);
    if (existing.length > 0) {
      tierIds[t.name] = existing[0].id;
      continue;
    }
    const id = createId();
    await db.insert(priceTiers).values({ id, ...t });
    tierIds[t.name] = id;
  }
  console.log("등급 생성 완료:", Object.keys(tierIds));

  // 2. 관리자 계정
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin1234!";

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(users).values({
      id: createId(),
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
      companyName: "본사 관리자",
      contactName: "관리자",
      phone: "000-0000-0000",
      approvedAt: new Date(),
    });
    console.log(`관리자 계정 생성: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("관리자 계정이 이미 존재합니다:", adminEmail);
  }

  // 3. 샘플 상품 (선택 - 처음 화면 확인용)
  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length === 0) {
    const sampleProducts = [
      {
        sku: "SKU-0001",
        name: "샘플 상품 A (박스)",
        category: "일반상품",
        unit: "BOX",
        basePrice: "50000",
        stock: 100,
        safetyStock: 10,
      },
      {
        sku: "SKU-0002",
        name: "샘플 상품 B (낱개)",
        category: "일반상품",
        unit: "EA",
        basePrice: "12000",
        stock: 300,
        safetyStock: 30,
      },
    ];
    for (const p of sampleProducts) {
      await db.insert(products).values({ id: createId(), ...p });
    }
    console.log("샘플 상품 2건 생성 완료");
  }

  console.log("시드 완료.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
