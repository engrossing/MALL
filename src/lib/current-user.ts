import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, priceTiers } from "@/db/schema";
import { getSessionFromCookies } from "./session";

export async function getCurrentUser() {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      companyName: users.companyName,
      contactName: users.contactName,
      phone: users.phone,
      businessRegNo: users.businessRegNo,
      address: users.address,
      tierId: users.tierId,
      tierName: priceTiers.name,
      tierDiscountPercent: priceTiers.discountPercent,
    })
    .from(users)
    .leftJoin(priceTiers, eq(users.tierId, priceTiers.id))
    .where(eq(users.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
}

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;
