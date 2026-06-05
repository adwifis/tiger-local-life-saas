import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "虎鲸本地生活商家营销助手",
  description: "面向本地生活商家和代理团队的商业化 AI 营销 SaaS 开发底座"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
