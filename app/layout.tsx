import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { RegionProvider } from "@/lib/region/RegionContext";

export const metadata: Metadata = {
  title: "LIFE.HELP | 다국어 생활서비스 플랫폼",
  description:
    "한국 거주 외국인을 위한 생활서비스 플랫폼. 모국어로 상담하고 신뢰할 수 있는 지역 전문 헬퍼와 연결됩니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LocaleProvider>
          <RegionProvider>{children}</RegionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
