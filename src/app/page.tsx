import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") redirect("/admin");
    if (user.status === "APPROVED") redirect("/mall");
    if (user.status === "PENDING") redirect("/pending");
    if (user.status === "REJECTED") redirect("/rejected");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">거래처 전용몰</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          승인된 거래처만 이용할 수 있는 폐쇄몰입니다.
          <br />
          거래처 등급에 따라 다른 단가가 적용됩니다.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            거래처 가입 신청
          </Link>
        </div>
      </div>
    </main>
  );
}
