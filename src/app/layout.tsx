import type { Metadata } from "next";
import localFont from "next/font/local";
import "animal-island-ui/dist/index.css";
import "./globals.css";

const hyTiaoTiao = localFont({
  src: "./fonts/HYTiaoTiao.ttf",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "恋爱小岛日记",
  description: "一个私密、温柔、治愈的恋爱日记网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${hyTiaoTiao.variable} antialiased pb-[env(safe-area-inset-bottom)]`}>{children}</body>
    </html>
  );
}
