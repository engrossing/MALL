import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { orders, orderItems, users } from "@/db/schema";
import { formatKRW } from "@/lib/pricing";
import { updateOrderStatusAction } from "@/lib/actions/admin";

const TYPE_LABEL: Record<string, string> = { QUOTE: "견적요청", ORDER: "발주요청" };
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "요청됨",
  CONFIRMED: "확정됨",
  REJECTED: "거절됨",
  COMPLETED: "완료됨",
  CANCELLED: "취소됨",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orderRows = await db
    .select({
      order: orders,
      user: users,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (orderRows.length === 0) notFound();
  const { order, user } = orderRows[0];

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  const defaultBankInfo =
    order.bankTransferInfo || process.env.COMPANY_BANK_INFO || "";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {TYPE_LABEL[order.type]} 상세 - {order.orderNo}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          현재 상태: <strong>{STATUS_LABEL[order.status]}</strong>
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">거래처 정보</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500">회사명</dt>
          <dd>{user.companyName}</dd>
          <dt className="text-slate-500">담당자</dt>
          <dd>{user.contactName}</dd>
          <dt className="text-slate-500">연락처</dt>
          <dd>{user.phone}</dd>
          <dt className="text-slate-500">이메일</dt>
          <dd>{user.email}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">주문 품목</h2>
        <table className="mt-2 w-full text-sm">
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
        {order.note && (
          <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            거래처 요청사항: {order.note}
          </p>
        )}
        {order.taxInvoiceRequested && (
          <p className="mt-2 text-sm text-amber-700">
            ※ 세금계산서 발행을 요청했습니다.
          </p>
        )}
      </section>

      {(order.status === "REQUESTED" || order.status === "CONFIRMED") && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">처리하기</h2>
          <form action={updateOrderStatusAction} className="mt-3 space-y-3">
            <input type="hidden" name="orderId" value={order.id} />

            <div>
              <label className="block text-xs font-medium text-slate-600">
                계좌이체 안내 (거래처에게 노출됨)
              </label>
              <textarea
                name="bankTransferInfo"
                rows={2}
                defaultValue={defaultBankInfo}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                관리자 메모
              </label>
              <textarea
                name="adminNote"
                rows={2}
                defaultValue={order.adminNote ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {order.status === "REQUESTED" && (
                <>
                  <button
                    name="status"
                    value="CONFIRMED"
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    확정하기
                  </button>
                  <button
                    name="status"
                    value="REJECTED"
                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    거절하기
                  </button>
                </>
              )}
              {order.status === "CONFIRMED" && (
                <>
                  <button
                    name="status"
                    value="COMPLETED"
                    className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                  >
                    완료 처리
                  </button>
                  <button
                    name="status"
                    value="CANCELLED"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    취소하기
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
