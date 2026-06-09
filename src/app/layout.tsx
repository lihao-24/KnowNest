import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "河南志愿 AI 助手",
  description: "面向河南高考志愿填报的本地优先 AI 问答助手"
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
