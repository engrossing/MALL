"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { createOrderAction } from "@/lib/actions/mall";

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const [note, setNote] = useState("");
  const [taxInvoice, setTaxInvoice] = useState(false);
  const [type, setType] = useState<"QUOTE" | "ORDER">("ORDER");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction({
        type,
        note,
        taxInvoiceRequested: taxInvoice,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      clear();
      router.push(`/mall/orders/${result.orderId}`);
    });
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        장바구니가 비어있습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">장바구니</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">상품명</th>
              <th className="px-4 py-2">단가</th>
              <th className="px-4 py-2">수량</th>
              <th className="px-4 py-2">소계</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.productId} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {i.name} <span className="text-xs text-slate-400">({i.unit})</span>
                </td>
                <td className="px-4 py-2">{formatKRW(i.unitPrice)}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={1}
                    value={i.quantity}
                    onChange={(e) =>
                      updateQuantity(i.productId, Number(e.target.value) || 0)
                    }
                    className="w-16 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2">{formatKRW(i.unitPrice * i.quantity)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => removeItem(i.productId)}
                    className="text-xs text-red-600 underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end text-lg font-bold text-slate-900">
        합계 {formatKRW(total)}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">요청 구분</label>
          <div className="mt-1 flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={type === "ORDER"}
                onChange={() => setType("ORDER")}
              />
              발주요청
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={type === "QUOTE"}
                onChange={() => setType("QUOTE")}
              />
              견적요청
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">요청사항</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="납기 희망일, 배송 요청사항 등을 입력해주세요."
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={taxInvoice}
            onChange={(e) => setTaxInvoice(e.target.checked)}
          />
          세금계산서 발행 요청
        </label>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? "요청 중..." : "요청 보내기"}
        </button>
        <p className="text-xs text-slate-400">
          * 결제는 계좌이체로 진행되며, 관리자 확정 후 계좌 정보가 안내됩니다.
        </p>
      </div>
    </div>
  );
}
