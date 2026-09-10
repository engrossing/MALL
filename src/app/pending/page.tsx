import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.status === "APPROVED") redirect("/mall");
  if (user.status === "REJECTED") redirect("/rejected");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          ⏳
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          승인 대기중입니다
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {user.companyName}님, 관리자가 가입 신청을 확인하는 중입니다.
          <br />
          승인이 완료되면 이용 가능합니다.
        </p>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </form>
      </div>
    </main>
  );
}
