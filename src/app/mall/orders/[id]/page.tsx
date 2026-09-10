import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { orders, orderItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { formatKRW } from "@/lib/pricing";

const TYPE_LABEL: Record<string, string> = { QUOTE: "견적요청", ORDER: "발주요청" };
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "요청됨 - 관리자 확인 중입니다.",
  CONFIRMED: "확정됨 - 계좌이체로 결제해주세요.",
  REJECTED: "거절됨",
  COMPLETED: "완료됨",
  CANCELLED: "취소됨",
};

export default async function MallOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, user.id)))
    .limit(1);
  const order = rows[0];
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {TYPE_LABEL[order.type]} - {order.orderNo}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{STATUS_LABEL[order.status]}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-1">상품명</th>
              <th className="py-1">단가</th>
              <th className="py-1">수량</th>
              <th className="py-1">소계</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="py-1.5">{it.productName}</td>
                <td className="py-1.5">{formatKRW(it.unitPrice)}</td>
                <td className="py-1.5">{it.quantity}</td>
                <td className="py-1.5">{formatKRW(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right text-base font-bold text-slate-900">
          합계 {formatKRW(order.totalAmount)}
        </p>
      </section>

      {order.status === "CONFIRMED" && order.bankTransferInfo && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900">입금 안내</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-blue-800">
            {order.bankTransferInfo}
          </p>
        </section>
      )}

      {order.adminNote && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold text-slate-700">담당자 메모</h2>
          <p className="mt-2 text-sm text-slate-600">{order.adminNote}</p>
        </section>
      )}
    </div>
  );
}
