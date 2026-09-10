import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";

export default async function RejectedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.status === "APPROVED") redirect("/mall");
  if (user.status === "PENDING") redirect("/pending");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          가입이 거절되었습니다
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          자세한 사유는 거래 담당자에게 문의해주세요.
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
