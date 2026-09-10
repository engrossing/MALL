import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { formatKRW } from "@/lib/pricing";

const TYPE_LABEL: Record<string, string> = { QUOTE: "견적요청", ORDER: "발주요청" };
const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "요청됨",
  CONFIRMED: "확정됨 (결제 대기)",
  REJECTED: "거절됨",
  COMPLETED: "완료됨",
  CANCELLED: "취소됨",
};
const STATUS_BADGE: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export default async function MallOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">주문내역</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">요청번호</th>
              <th className="px-4 py-2">구분</th>
              <th className="px-4 py-2">금액</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2">요청일</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-slate-500">
                  {o.orderNo}
                </td>
                <td className="px-4 py-2">{TYPE_LABEL[o.type]}</td>
                <td className="px-4 py-2">{formatKRW(o.totalAmount)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {o.createdAt.toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/mall/orders/${o.id}`}
                    className="text-xs font-medium text-slate-700 underline"
                  >
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  아직 요청한 견적/발주가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
