"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartNavLink() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link href="/mall/cart" className="hover:text-slate-900">
      장바구니{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
