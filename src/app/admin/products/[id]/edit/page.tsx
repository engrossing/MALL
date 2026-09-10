import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { updateProductAction } from "@/lib/actions/admin";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  const product = rows[0];
  if (!product) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">상품 수정</h1>

      <form action={updateProductAction} className="space-y-4">
        <input type="hidden" name="id" value={product.id} />
        <Field label="SKU (상품코드) *" name="sku" defaultValue={product.sku} required />
        <Field label="상품명 *" name="name" defaultValue={product.name} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="카테고리" name="category" defaultValue={product.category ?? ""} />
          <Field
            label="단위 (EA, BOX 등) *"
            name="unit"
            defaultValue={product.unit}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field
            label="기준가(원) *"
            name="basePrice"
            type="number"
            defaultValue={product.basePrice}
            required
          />
          <Field
            label="현재 재고 *"
            name="stock"
            type="number"
            defaultValue={String(product.stock)}
            required
          />
          <Field
            label="안전재고"
            name="safetyStock"
            type="number"
            defaultValue={String(product.safetyStock)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">설명</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={product.description ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            저장하기
          </button>
          <Link
            href="/admin/products"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={type === "number" ? "any" : undefined}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}
