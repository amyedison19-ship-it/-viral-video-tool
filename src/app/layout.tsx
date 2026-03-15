import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "爆款短视频拆解工具",
  description: "AI驱动的视频结构分析",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
