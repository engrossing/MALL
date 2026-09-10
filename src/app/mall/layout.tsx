import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";
import { CartProvider } from "@/components/cart-context";
import { CartNavLink } from "@/components/cart-nav-link";

export default async function MallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status !== "APPROVED") redirect("/rejected");

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-bold text-slate-900">
                거래처 전용몰
              </span>
              <nav className="flex gap-4 text-sm text-slate-600">
                <Link href="/mall" className="hover:text-slate-900">
                  상품
                </Link>
                <CartNavLink />
                <Link href="/mall/orders" className="hover:text-slate-900">
                  주문내역
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">
                {user.companyName} · {user.tierName ?? "등급 미지정"}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </CartProvider>
  );
}
