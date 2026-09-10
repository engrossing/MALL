"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "@/lib/actions/auth";

const initialState: FormState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-bold text-slate-900">거래처 가입 신청</h1>
        <p className="mt-1 text-sm text-slate-500">
          가입 신청 후 관리자 승인이 완료되면 로그인 및 주문이 가능합니다.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                회사명 *
              </label>
              <input
                name="companyName"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <FieldError message={errors.companyName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                담당자명 *
              </label>
              <input
                name="contactName"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <FieldError message={errors.contactName} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                이메일 (로그인 아이디) *
              </label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                연락처 *
              </label>
              <input
                name="phone"
                required
                placeholder="010-0000-0000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <FieldError message={errors.phone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                사업자등록번호
              </label>
              <input
                name="businessRegNo"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                주소
              </label>
              <input
                name="address"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              비밀번호 * (8자 이상)
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <FieldError message={errors.password} />
          </div>

          {!state.ok && state.message && !Object.keys(errors).length && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "제출 중..." : "가입 신청하기"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
