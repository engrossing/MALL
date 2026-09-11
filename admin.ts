"use server";

import "server-only";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import * as XLSX from "xlsx";
import { db } from "@/db/client";
import { users, products, priceTiers, productTierPrices, orders } from "@/db/schema";
import { createId } from "@/db/id";
import { getCurrentUser } from "@/lib/current-user";
import { ProductImageStorageNotConfiguredError } from "@/lib/errors";

// 상품 이미지 업로드 (Vercel Blob 저장소 사용). 파일이 없으면 undefined(변경 없음) 반환.
async function uploadProductImageIfPresent(formData: FormData): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return undefined; // 변경 없음
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new ProductImageStorageNotConfiguredError();
  }
  const ext = file.name.split(".").pop() || "jpg";
  const blob = await put(`products/${createId()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });
  return blob.url;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("관리자만 사용할 수 있는 기능입니다.");
  }
  return user;
}

// ---------- 거래처 승인 관리 ----------

export async function approveUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const tierId = String(formData.get("tierId") || "") || null;

  await db
    .update(users)
    .set({ status: "APPROVED", approvedAt: new Date(), tierId })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function rejectUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const memo = String(formData.get("memo") || "");

  await db
    .update(users)
    .set({ status: "REJECTED", memo })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function suspendUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));

  await db
    .update(users)
    .set({ status: "SUSPENDED" })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function reactivateUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));

  await db
    .update(users)
    .set({ status: "APPROVED" })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

export async function updateUserTierAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const tierId = String(formData.get("tierId") || "") || null;

  await db.update(users).set({ tierId }).where(eq(users.id, userId));

  revalidatePath("/admin/users");
}

// ---------- 상품/재고 관리 ----------

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().min(1),
  basePrice: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  safetyStock: z.coerce.number().int().min(0),
  description: z.string().optional(),
});

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse(raw);
  let imageUrl: string | null | undefined;
  let imageFailed = false;
  try {
    imageUrl = await uploadProductImageIfPresent(formData);
  } catch (e) {
    if (e instanceof ProductImageStorageNotConfiguredError) {
      imageFailed = true;
    } else {
      throw e;
    }
  }

  await db.insert(products).values({
    id: createId(),
    sku: data.sku,
    name: data.name,
    category: data.category || null,
    unit: data.unit,
    basePrice: String(data.basePrice),
    stock: data.stock,
    safetyStock: data.safetyStock,
    description: data.description || null,
    imageUrl: imageUrl || null,
  });

  revalidatePath("/admin/products");
  redirect(imageFailed ? "/admin/products?error=blob_missing" : "/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse(raw);
  let imageUrl: string | null | undefined;
  let imageFailed = false;
  try {
    imageUrl = await uploadProductImageIfPresent(formData);
  } catch (e) {
    if (e instanceof ProductImageStorageNotConfiguredError) {
      imageFailed = true;
    } else {
      throw e;
    }
  }

  await db
    .update(products)
    .set({
      sku: data.sku,
      name: data.name,
      category: data.category || null,
      unit: data.unit,
      basePrice: String(data.basePrice),
      stock: data.stock,
      safetyStock: data.safetyStock,
      description: data.description || null,
      updatedAt: new Date(),
      // imageUrl이 undefined면 새 파일을 올리지 않은 것이므로 기존 값을 유지합니다.
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  redirect(imageFailed ? "/admin/products?error=blob_missing" : "/admin/products");
}

// 엑셀 파일로 상품 일괄 등록/업데이트. 모델명(SKU)이 이미 있으면 업데이트, 없으면 새로 등록합니다.
// 기대하는 컬럼: 상품명, 모델명, 제조원, 입수량, 제품구성, 원산지, 상품설명, 일반 소비자가, 공급가(...), 대표이미지
export async function bulkImportProductsAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/products?error=bulk_no_file");
  }

  let rows: unknown[][];
  try {
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }) as unknown[][];
  } catch {
    redirect("/admin/products?error=bulk_parse_failed");
  }

  if (!rows || rows.length < 2) {
    redirect("/admin/products?error=bulk_empty");
  }

  const header = rows[0].map((h) => String(h ?? "").trim());
  const col = {
    name: header.indexOf("상품명"),
    model: header.indexOf("모델명"),
    maker: header.indexOf("제조원"),
    packQty: header.indexOf("입수량"),
    composition: header.indexOf("제품구성"),
    origin: header.indexOf("원산지"),
    desc: header.indexOf("상품설명"),
    retailPrice: header.indexOf("일반 소비자가"),
    supplyPrice: header.findIndex((h) => h.startsWith("공급가")),
    image: header.indexOf("대표이미지"),
  };

  if (col.name === -1 || col.model === -1 || col.supplyPrice === -1) {
    redirect("/admin/products?error=bulk_bad_format");
  }

  const asText = (v: unknown) => String(v ?? "").trim();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const name = asText(row[col.name]);
    const sku = asText(row[col.model]);
    if (!name || !sku) {
      skipped++;
      continue;
    }

    const priceNum =
      Number(row[col.supplyPrice]) ||
      (col.retailPrice >= 0 ? Number(row[col.retailPrice]) : 0) ||
      0;
    if (priceNum <= 0) {
      skipped++;
      continue;
    }

    const descParts: string[] = [];
    if (col.desc >= 0 && row[col.desc]) descParts.push(asText(row[col.desc]));
    const extra: string[] = [];
    if (col.composition >= 0 && row[col.composition]) extra.push(`구성: ${asText(row[col.composition])}`);
    if (col.origin >= 0 && row[col.origin]) extra.push(`원산지: ${asText(row[col.origin])}`);
    if (col.packQty >= 0 && row[col.packQty]) extra.push(`입수량: ${asText(row[col.packQty])}`);
    if (extra.length) descParts.push(extra.join(" · "));
    const description = descParts.length ? descParts.join("\n\n") : null;

    const category = col.maker >= 0 ? asText(row[col.maker]) || null : null;
    const imageUrl = col.image >= 0 ? asText(row[col.image]) || null : null;

    const existing = await db.select().from(products).where(eq(products.sku, sku)).limit(1);

    if (existing[0]) {
      await db
        .update(products)
        .set({
          name,
          category,
          basePrice: String(priceNum),
          description,
          imageUrl: imageUrl || existing[0].imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing[0].id));
      updated++;
    } else {
      await db.insert(products).values({
        id: createId(),
        sku,
        name,
        category,
        unit: "EA",
        basePrice: String(priceNum),
        stock: 0,
        safetyStock: 0,
        description,
        imageUrl,
      });
      created++;
    }
  }

  revalidatePath("/admin/products");
  redirect(
    `/admin/products?bulk_created=${created}&bulk_updated=${updated}&bulk_skipped=${skipped}`
  );
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";

  await db
    .update(products)
    .set({ isActive: !isActive })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
}

export async function adjustStockAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const delta = Number(formData.get("delta"));

  const row = await db
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (row.length === 0) return;

  const newStock = Math.max(0, row[0].stock + delta);

  await db
    .update(products)
    .set({ stock: newStock })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
}

// ---------- 등급/단가 관리 ----------

export async function createTierAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const discountPercent = String(formData.get("discountPercent") || "0");
  const description = String(formData.get("description") || "");

  if (!name) return;

  await db.insert(priceTiers).values({
    id: createId(),
    name,
    discountPercent,
    description: description || null,
  });

  revalidatePath("/admin/tiers");
}

export async function updateTierAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const discountPercent = String(formData.get("discountPercent") || "0");
  const description = String(formData.get("description") || "");

  await db
    .update(priceTiers)
    .set({ discountPercent, description: description || null, updatedAt: new Date() })
    .where(eq(priceTiers.id, id));

  revalidatePath("/admin/tiers");
}

export async function setProductTierPriceAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const tierId = String(formData.get("tierId"));
  const priceRaw = String(formData.get("price") || "").trim();

  if (!priceRaw) {
    // 빈 값이면 개별 지정가 삭제 (기본 할인율 적용으로 되돌림)
    await db
      .delete(productTierPrices)
      .where(
        and(
          eq(productTierPrices.productId, productId),
          eq(productTierPrices.tierId, tierId)
        )
      );
    revalidatePath("/admin/tiers");
    return;
  }

  const price = String(Number(priceRaw));

  const existing = await db
    .select({ id: productTierPrices.id })
    .from(productTierPrices)
    .where(
      and(
        eq(productTierPrices.productId, productId),
        eq(productTierPrices.tierId, tierId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(productTierPrices)
      .set({ price, updatedAt: new Date() })
      .where(eq(productTierPrices.id, existing[0].id));
  } else {
    await db.insert(productTierPrices).values({
      id: createId(),
      productId,
      tierId,
      price,
    });
  }

  revalidatePath("/admin/tiers");
}

// ---------- 견적/발주 관리 ----------

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status")) as
    | "CONFIRMED"
    | "REJECTED"
    | "COMPLETED"
    | "CANCELLED";
  const adminNote = String(formData.get("adminNote") || "");
  const bankTransferInfo = String(formData.get("bankTransferInfo") || "");

  await db
    .update(orders)
    .set({
      status,
      adminNote: adminNote || null,
      bankTransferInfo: bankTransferInfo || null,
      confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
