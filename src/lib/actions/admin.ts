"use server";

import "server-only";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users, products, priceTiers, productTierPrices, orders } from "@/db/schema";
import { createId } from "@/db/id";
import { getCurrentUser } from "@/lib/current-user";

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
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const raw = Object.fromEntries(formData.entries());
  const data = productSchema.parse(raw);

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
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  redirect("/admin/products");
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
