"use server";

import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productTierPrices, orders, orderItems } from "@/db/schema";
import { createId } from "@/db/id";
import { generateOrderNo } from "@/lib/order-no";
import { calcUnitPrice, round2 } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/current-user";

const requestSchema = z.object({
  type: z.enum(["QUOTE", "ORDER"]),
  note: z.string().optional(),
  taxInvoiceRequested: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "최소 1개 이상의 상품을 담아주세요."),
});

export type CreateOrderInput = z.infer<typeof requestSchema>;
export type CreateOrderResult =
  | { ok: true; orderId: string; orderNo: string }
  | { ok: false; message: string };

// 클라이언트가 보낸 가격은 신뢰하지 않고, 서버에서 거래처 등급 기준으로 단가를 다시 계산합니다.
export async function createOrderAction(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED" || user.role !== "VENDOR") {
    return { ok: false, message: "승인된 거래처 계정만 요청할 수 있습니다." };
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }
  const data = parsed.data;

  const productRows = await db.select().from(products);
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  const overrides = user.tierId
    ? await db
        .select()
        .from(productTierPrices)
        .where(eq(productTierPrices.tierId, user.tierId))
    : [];

  let totalAmount = 0;
  const itemsToInsert: {
    productId: string;
    productName: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }[] = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) {
      return { ok: false, message: "판매 중이 아닌 상품이 포함되어 있습니다. 장바구니를 새로고침해주세요." };
    }

    const unitPrice = calcUnitPrice({
      basePrice: product.basePrice,
      tierId: user.tierId,
      tierDiscountPercent: user.tierDiscountPercent,
      overrides: overrides.map((o) => ({ tierId: o.tierId, price: o.price })),
    });
    const lineTotal = round2(unitPrice * item.quantity);
    totalAmount = round2(totalAmount + lineTotal);

    itemsToInsert.push({
      productId: product.id,
      productName: product.name,
      unitPrice: String(unitPrice),
      quantity: item.quantity,
      lineTotal: String(lineTotal),
    });
  }

  const orderId = createId();
  const orderNo = generateOrderNo(data.type);

  await db.insert(orders).values({
    id: orderId,
    orderNo,
    type: data.type,
    status: "REQUESTED",
    userId: user.id,
    totalAmount: String(totalAmount),
    note: data.note || null,
    taxInvoiceRequested: Boolean(data.taxInvoiceRequested),
  });

  await db.insert(orderItems).values(
    itemsToInsert.map((it) => ({
      id: createId(),
      orderId,
      ...it,
    }))
  );

  return { ok: true, orderId, orderNo };
}
