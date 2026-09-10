import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "거래처 전용몰",
  description: "벤더/유통사 폐쇄몰",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
