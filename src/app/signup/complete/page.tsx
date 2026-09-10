import Link from "next/link";

export default function SignupCompletePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          가입 신청이 완료되었습니다
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          관리자 승인 후 로그인하실 수 있습니다.
          <br />
          승인까지 다소 시간이 걸릴 수 있습니다.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          로그인 화면으로
        </Link>
      </div>
    </main>
  );
}
