import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

const PROTECTED_PREFIXES = ["/mall", "/admin", "/pending", "/rejected"];

// Next.js 16: `middleware.ts` 파일명은 `proxy.ts`로 변경되었습니다.
// 여기서는 "로그인 여부"만 빠르게 검사하고, 실제 권한(관리자/승인상태)은
// 각 레이아웃(Server Component)에서 DB를 조회해 최신 상태로 판단합니다.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mall/:path*", "/admin/:path*", "/pending", "/rejected"],
};
