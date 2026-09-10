"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/actions/auth";

const initialState: FormState = { ok: true };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-900">로그인</h1>
        <p className="mt-1 text-sm text-slate-500">
          거래처 계정으로 로그인하세요.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          {!state.ok && state.message && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            거래처 가입 신청
          </Link>
        </p>
      </div>
    </main>
  );
}
