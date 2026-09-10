"use client";

type Tier = { id: string; name: string };

export function TierSelectForm({
  action,
  userId,
  tiers,
  defaultTierId,
}: {
  action: (formData: FormData) => void;
  userId: string;
  tiers: Tier[];
  defaultTierId: string | null;
}) {
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="tierId"
        defaultValue={defaultTierId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      >
        <option value="">미지정</option>
        {tiers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </form>
  );
}
