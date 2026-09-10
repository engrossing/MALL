import { db } from "@/db/client";
import { priceTiers, products, productTierPrices } from "@/db/schema";
import {
  createTierAction,
  updateTierAction,
  setProductTierPriceAction,
} from "@/lib/actions/admin";
import { AutoSubmitField } from "@/components/auto-submit-field";
import { formatKRW } from "@/lib/pricing";

export default async function AdminTiersPage() {
  const [tiers, allProducts, overrides] = await Promise.all([
    db.select().from(priceTiers).orderBy(priceTiers.createdAt),
    db.select().from(products),
    db.select().from(productTierPrices),
  ]);

  const overrideMap = new Map<string, string>();
  for (const o of overrides) {
    overrideMap.set(`${o.productId}:${o.tierId}`, o.price);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">거래처 등급/단가 관리</h1>
        <p className="mt-1 text-sm text-slate-500">
          등급별 기본 할인율을 설정하고, 필요한 경우 상품별로 개별 단가를 지정할 수 있습니다.
          개별 단가가 설정되면 기본 할인율보다 우선 적용됩니다.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">등급 목록</h2>
        <div className="mt-3 space-y-3">
          {tiers.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="w-28 font-semibold text-slate-900">{t.name}</span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                기본 할인율
                <AutoSubmitField
                  action={updateTierAction}
                  hidden={{ id: t.id, description: t.description ?? "" }}
                  name="discountPercent"
                  defaultValue={t.discountPercent}
                  type="number"
                  className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                %
              </div>
              <span className="text-xs text-slate-400">{t.description}</span>
            </div>
          ))}
        </div>

        <form
          action={createTierAction}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-slate-300 p-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600">
              새 등급명
            </label>
            <input
              name="name"
              required
              className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              기본 할인율(%)
            </label>
            <input
              name="discountPercent"
              type="number"
              defaultValue="0"
              className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600">설명</label>
            <input
              name="description"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            등급 추가
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700">
          상품별 등급 개별 단가 (비워두면 기본 할인율 적용)
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">상품명</th>
                <th className="px-4 py-2">기준가</th>
                {tiers.map((t) => (
                  <th key={t.id} className="px-4 py-2">
                    {t.name} ({t.discountPercent}%)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allProducts.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatKRW(p.basePrice)}
                  </td>
                  {tiers.map((t) => (
                    <td key={t.id} className="px-4 py-2">
                      <AutoSubmitField
                        action={setProductTierPriceAction}
                        hidden={{ productId: p.id, tierId: t.id }}
                        name="price"
                        type="number"
                        defaultValue={overrideMap.get(`${p.id}:${t.id}`) ?? ""}
                        placeholder="기본할인 적용"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {allProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={2 + tiers.length}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
