import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { formatKRW } from "@/lib/pricing";
import {
  toggleProductActiveAction,
  adjustStockAction,
  bulkImportProductsAction,
} from "@/lib/actions/admin";

const BULK_ERROR_MESSAGE: Record<string, string> = {
  bulk_no_file: "업로드할 엑셀 파일을 선택해주세요.",
  bulk_parse_failed: "엑셀 파일을 읽지 못했습니다. 파일이 손상되지 않았는지 확인해주세요.",
  bulk_empty: "엑셀 파일에 상품 데이터가 없습니다.",
  bulk_bad_format:
    "엑셀 파일의 열 구성을 인식하지 못했습니다. '상품명', '모델명', '공급가' 열이 있는지 확인해주세요.",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    bulk_created?: string;
    bulk_updated?: string;
    bulk_skipped?: string;
  }>;
}) {
  const { error, bulk_created, bulk_updated, bulk_skipped } = await searchParams;
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

      {error && BULK_ERROR_MESSAGE[error] && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {BULK_ERROR_MESSAGE[error]}
        </p>
      )}

      {bulk_created !== undefined && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          엑셀 일괄 등록 완료 — 신규 등록 {bulk_created}건, 업데이트 {bulk_updated}건
          {Number(bulk_skipped) > 0 && `, 건너뜀 ${bulk_skipped}건 (상품명/모델명/가격 누락)`}
        </p>
      )}

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-900">엑셀로 상품 일괄 등록</h2>
        <p className="mt-1 text-xs text-slate-500">
          '상품명', '모델명', '공급가' 등의 열이 있는 엑셀 파일(.xlsx)을 올리면
          한 번에 여러 상품을 등록/업데이트합니다. 모델명이 이미 있는 상품은
          내용이 갱신됩니다.
        </p>
        <form
          action={bulkImportProductsAction}
          encType="multipart/form-data"
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            업로드 및 일괄 등록
          </button>
        </form>
      </div>

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
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
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
