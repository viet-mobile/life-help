import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { RegionProvider } from "@/lib/region/RegionContext";
import { getSiteMetadata, resolveLanguageFromHeaders } from "@/lib/i18n/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);
  return getSiteMetadata(lang);
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);

  return (
    <html lang={lang}>
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
