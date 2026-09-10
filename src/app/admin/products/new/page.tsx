import Link from "next/link";
import { createProductAction } from "@/lib/actions/admin";

export default function NewProductPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-slate-900">상품 등록</h1>

      <form action={createProductAction} className="space-y-4">
        <Field label="SKU (상품코드) *" name="sku" required />
        <Field label="상품명 *" name="name" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="카테고리" name="category" />
          <Field label="단위 (EA, BOX 등) *" name="unit" defaultValue="EA" required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="기준가(원) *" name="basePrice" type="number" required />
          <Field label="현재 재고 *" name="stock" type="number" defaultValue="0" required />
          <Field label="안전재고" name="safetyStock" type="number" defaultValue="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">설명</label>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            등록하기
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
