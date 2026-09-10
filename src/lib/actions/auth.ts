"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createId } from "@/db/id";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

const signupSchema = z.object({
  companyName: z.string().min(1, "회사명을 입력해주세요."),
  contactName: z.string().min(1, "담당자명을 입력해주세요."),
  email: z.string().email("올바른 이메일을 입력해주세요."),
  phone: z.string().min(1, "연락처를 입력해주세요."),
  businessRegNo: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function signupAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, fieldErrors, message: "입력값을 확인해주세요." };
  }

  const data = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    return {
      ok: false,
      message: "이미 가입된 이메일입니다.",
      fieldErrors: { email: "이미 가입된 이메일입니다." },
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.insert(users).values({
    id: createId(),
    email: data.email,
    passwordHash,
    role: "VENDOR",
    status: "PENDING",
    companyName: data.companyName,
    contactName: data.contactName,
    phone: data.phone,
    businessRegNo: data.businessRegNo || null,
    address: data.address || null,
  });

  redirect("/signup/complete");
}

const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, message: "이메일과 비밀번호를 입력해주세요." };
  }

  const { email, password } = parsed.data;

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  if (user.status === "REJECTED") {
    return {
      ok: false,
      message: "가입이 거절된 계정입니다. 관리자에게 문의해주세요.",
    };
  }
  if (user.status === "SUSPENDED") {
    return {
      ok: false,
      message: "이용이 정지된 계정입니다. 관리자에게 문의해주세요.",
    };
  }

  await setSessionCookie(user.id);

  if (user.status === "PENDING") {
    redirect("/pending");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/mall");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
