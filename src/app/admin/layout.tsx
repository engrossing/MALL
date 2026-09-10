import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "거래처 승인/관리" },
  { href: "/admin/products", label: "상품/재고" },
  { href: "/admin/tiers", label: "등급/단가" },
  { href: "/admin/orders", label: "견적/발주 관리" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/mall");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-900">
              관리자 콘솔
            </span>
            <nav className="flex gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
