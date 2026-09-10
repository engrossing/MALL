import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, priceTiers } from "@/db/schema";
import {
  approveUserAction,
  rejectUserAction,
  suspendUserAction,
  reactivateUserAction,
  updateUserTierAction,
} from "@/lib/actions/admin";
import { TierSelectForm } from "@/components/tier-select-form";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "승인대기",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  SUSPENDED: "정지됨",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-slate-200 text-slate-700",
};

export default async function AdminUsersPage() {
  const [allUsers, tiers] = await Promise.all([
    db
      .select()
      .from(users)
      .where(eq(users.role, "VENDOR"))
      .orderBy(desc(users.createdAt)),
    db.select().from(priceTiers),
  ]);

  const pending = allUsers.filter((u) => u.status === "PENDING");
  const others = allUsers.filter((u) => u.status !== "PENDING");

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-900">거래처 승인/관리</h1>

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700">
            승인 대기 ({pending.length})
          </h2>
          <div className="mt-3 space-y-3">
            {pending.map((u) => (
              <div
                key={u.id}
                data-testid="pending-user-card"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {u.companyName}{" "}
                      <span className="font-normal text-slate-500">
                        ({u.contactName})
                      </span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {u.email} · {u.phone}
                    </p>
                    {u.businessRegNo && (
                      <p className="text-sm text-slate-500">
                        사업자번호: {u.businessRegNo}
                      </p>
                    )}
                    {u.address && (
                      <p className="text-sm text-slate-500">{u.address}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form action={approveUserAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="tierId"
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        defaultValue=""
                      >
                        <option value="">등급 미지정</option>
                        {tiers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        승인
                      </button>
                    </form>
                    <form action={rejectUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        거절
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-700">전체 거래처</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">회사명</th>
                <th className="px-4 py-2">담당자</th>
                <th className="px-4 py-2">이메일</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">등급</th>
                <th className="px-4 py-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {others.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {u.companyName}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{u.contactName}</td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[u.status]}`}
                    >
                      {STATUS_LABEL[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <TierSelectForm
                      action={updateUserTierAction}
                      userId={u.id}
                      tiers={tiers}
                      defaultTierId={u.tierId}
                    />
                  </td>
                  <td className="px-4 py-2">
                    {u.status === "APPROVED" && (
                      <form action={suspendUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="text-xs font-medium text-red-600 underline">
                          이용정지
                        </button>
                      </form>
                    )}
                    {(u.status === "SUSPENDED" || u.status === "REJECTED") && (
                      <form action={reactivateUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button className="text-xs font-medium text-green-700 underline">
                          승인상태로 복원
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {others.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    등록된 거래처가 없습니다.
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
