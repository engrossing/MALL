// 거래처 등급(Tier)에 따른 단가 계산 로직
// 1) 해당 상품에 그 등급 전용 지정가(ProductTierPrice)가 있으면 그 가격을 최우선 사용
// 2) 없으면 등급의 기본 할인율(discountPercent)을 기준가(basePrice)에 적용
// 3) 등급이 없는 회원(신규 등)은 기준가 그대로 적용

export type TierPriceOverride = {
  tierId: string;
  price: string; // numeric은 pg에서 string으로 옴
};

export function calcUnitPrice({
  basePrice,
  tierId,
  tierDiscountPercent,
  overrides,
}: {
  basePrice: string | number;
  tierId: string | null | undefined;
  tierDiscountPercent: string | number | null | undefined;
  overrides: TierPriceOverride[];
}): number {
  const base = Number(basePrice);

  if (tierId) {
    const override = overrides.find((o) => o.tierId === tierId);
    if (override) {
      return round2(Number(override.price));
    }
  }

  const discount = Number(tierDiscountPercent ?? 0);
  if (!tierId || !discount) return round2(base);

  const discounted = base * (1 - discount / 100);
  return round2(discounted);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatKRW(n: number | string): string {
  const num = typeof n === "string" ? Number(n) : n;
  return num.toLocaleString("ko-KR") + "원";
}
