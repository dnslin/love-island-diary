import type { Metadata } from "next";
import "animal-island-ui/dist/index.css";
import "./globals.css";

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
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
