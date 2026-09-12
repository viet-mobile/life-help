import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIET.MOBILE | 한국 생활서비스를 베트남어로",
  description:
    "한국에 거주하는 베트남인을 위한 생활서비스 플랫폼. 베트남어로 상담하고 신뢰할 수 있는 지역 전문기사와 연결됩니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
