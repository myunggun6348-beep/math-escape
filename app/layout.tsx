import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마지막 종이 울리기 전에 | 수학 탈출실",
  description: "15분, 세 개의 열쇠. 수학으로 잠긴 교실을 탈출하세요.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
