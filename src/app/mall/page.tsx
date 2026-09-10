import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productTierPrices } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { calcUnitPrice, formatKRW } from "@/lib/pricing";
import { AddToCartButton } from "@/components/add-to-cart-button";

export default async function MallProductsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // 레이아웃에서 이미 처리되지만 타입 안전을 위해 방어

  const [allProducts, overrides] = await Promise.all([
    db.select().from(products).where(eq(products.isActive, true)),
    user.tierId
      ? db
          .select()
          .from(productTierPrices)
          .where(eq(productTierPrices.tierId, user.tierId))
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">상품 목록</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.tierName
            ? `귀사의 등급(${user.tierName})에 맞는 단가로 표시됩니다.`
            : "등급이 지정되지 않아 기준가로 표시됩니다. 담당자에게 문의해주세요."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allProducts.map((p) => {
          const unitPrice = calcUnitPrice({
            basePrice: p.basePrice,
            tierId: user.tierId,
            tierDiscountPercent: user.tierDiscountPercent,
            overrides: overrides.map((o) => ({ tierId: o.tierId, price: o.price })),
          });
          const isDiscounted = unitPrice < Number(p.basePrice);

          return (
            <div
              key={p.id}
              data-testid="product-card"
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="text-xs text-slate-400">{p.category ?? "일반"}</p>
                <h2 className="mt-1 font-semibold text-slate-900">{p.name}</h2>
                <p className="text-xs text-slate-400">
                  SKU {p.sku} · 단위 {p.unit}
                </p>

                <div className="mt-3">
                  {isDiscounted && (
                    <p className="text-xs text-slate-400 line-through">
                      {formatKRW(p.basePrice)}
                    </p>
                  )}
                  <p className="text-lg font-bold text-slate-900">
                    {formatKRW(unitPrice)}
                  </p>
                </div>

                <p
                  className={`mt-1 text-xs ${
                    p.stock > p.safetyStock ? "text-slate-400" : "text-red-500"
                  }`}
                >
                  재고 {p.stock}
                  {p.unit}
                </p>
              </div>

              <div className="mt-4">
                <AddToCartButton
                  productId={p.id}
                  name={p.name}
                  unit={p.unit}
                  unitPrice={unitPrice}
                />
              </div>
            </div>
          );
        })}

        {allProducts.length === 0 && (
          <p className="col-span-full py-10 text-center text-slate-400">
            현재 판매중인 상품이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
