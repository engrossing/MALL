"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

export function AddToCartButton({
  productId,
  name,
  unit,
  unitPrice,
}: {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
        className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button
        onClick={() => {
          addItem({ productId, name, unit, unitPrice }, qty);
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1200);
        }}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        {justAdded ? "담김 ✓" : "장바구니 담기"}
      </button>
    </div>
  );
}
