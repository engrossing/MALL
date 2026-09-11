import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { formatKRW } from "@/lib/pricing";
import { toggleProductActiveAction, adjustStockAction } from "@/lib/actions/admin";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">상품/재고 관리</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + 상품 등록
        </Link>
      </div>

      {error === "blob_missing" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          상품 정보는 저장됐지만, 이미지 저장소(Vercel Blob)가 아직 연결되지 않아
          이미지는 업로드되지 않았습니다. Vercel 프로젝트의 Storage 탭에서 Blob
          저장소를 추가한 뒤, 상품 수정 화면에서 이미지를 다시 올려주세요.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">이미지</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">상품명</th>
              <th className="px-4 py-2">기준가</th>
              <th className="px-4 py-2">재고</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => {
              const lowStock = p.stock <= p.safetyStock;
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-dashed border-slate-200" />
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {p.name}
                    <span className="ml-1 text-xs text-slate-400">
                      ({p.unit})
                    </span>
                  </td>
                  <td className="px-4 py-2">{formatKRW(p.basePrice)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          lowStock ? "font-semibold text-red-600" : "text-slate-700"
                        }
                      >
                        {p.stock}
                      </span>
                      <form action={adjustStockAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="delta" value="-1" />
                        <button className="rounded border border-slate-300 px-1.5 text-xs hover:bg-slate-50">
                          -
                        </button>
                      </form>
                      <form action={adjustStockAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="delta" value="1" />
                        <button className="rounded border border-slate-300 px-1.5 text-xs hover:bg-slate-50">
                          +
                        </button>
                      </form>
                      {lowStock && (
                        <span className="text-xs text-red-500">
                          (안전재고 {p.safetyStock})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {p.isActive ? "판매중" : "숨김"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-xs font-medium text-slate-700 underline"
                      >
                        수정
                      </Link>
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={String(p.isActive)}
                        />
                        <button className="text-xs font-medium text-slate-500 underline">
                          {p.isActive ? "숨기기" : "노출하기"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {allProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  등록된 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
