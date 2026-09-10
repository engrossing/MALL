import Link from "next/link";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { users, products, orders } from "@/db/schema";
import { formatKRW } from "@/lib/pricing";

export default async function AdminDashboardPage() {
  const [pendingUsers, lowStockProducts, requestedOrders] = await Promise.all([
    db.select().from(users).where(eq(users.status, "PENDING")),
    db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.safetyStock}`),
    db.select().from(orders).where(eq(orders.status, "REQUESTED")),
  ]);

  const totalOrdersToday = await db
    .select({ total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= now() - interval '1 day'`);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-900">대시보드</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="승인 대기 거래처"
          value={`${pendingUsers.length}건`}
          href="/admin/users"
          tone={pendingUsers.length > 0 ? "warn" : "default"}
        />
        <StatCard
          label="재고 부족 상품"
          value={`${lowStockProducts.length}건`}
          href="/admin/products"
          tone={lowStockProducts.length > 0 ? "danger" : "default"}
        />
        <StatCard
          label="처리 대기 견적/발주"
          value={`${requestedOrders.length}건`}
          href="/admin/orders"
          tone={requestedOrders.length > 0 ? "warn" : "default"}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          최근 24시간 요청 금액 합계
        </h2>
        <p className="mt-2 text-2xl font-bold text-slate-900">
          {formatKRW(totalOrdersToday[0]?.total ?? 0)}
        </p>
      </div>

      {pendingUsers.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-800">
            승인 대기 중인 거래처
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {pendingUsers.slice(0, 5).map((u) => (
              <li key={u.id}>
                {u.companyName} ({u.contactName}) - {u.email}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/users"
            className="mt-3 inline-block text-sm font-medium text-amber-800 underline"
          >
            승인 관리로 이동 →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  tone: "default" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 hover:opacity-90 ${toneClass}`}
    >
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}
