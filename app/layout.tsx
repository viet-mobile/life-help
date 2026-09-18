import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { RegionProvider } from "@/lib/region/RegionContext";
import { CountryProvider } from "@/lib/country/CountryContext";
import {
  getSiteMetadata,
  getPortalMetadata,
  resolveLanguageFromHeaders,
  resolvePortalFromHeaders,
  resolveCountryFromHeaders,
  getIconMetadata,
} from "@/lib/i18n/siteMetadata";

import { TopPwaBar } from "@/components/pwa/TopPwaBar";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);
  const portal = resolvePortalFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);

  const baseMeta =
    portal === "chat" || portal === "tech" || portal === "sys"
      ? getPortalMetadata(portal, lang)
      : getSiteMetadata(lang, country);

  const icons = getIconMetadata(country, portal);

  const appName =
    portal === "tech"
      ? "LIFE.HELP · TECH"
      : portal === "chat"
      ? "LIFE.HELP · CHAT"
      : portal === "sys"
      ? "LIFE.HELP · SYS"
      : country
      ? `LIFE.HELP · ${country.toUpperCase()}`
      : "LIFE.HELP";

  return {
    ...baseMeta,
    icons,
    manifest: "/manifest.webmanifest",
    applicationName: appName,
    appleWebApp: {
      title: appName,
      capable: true,
      statusBarStyle: "default",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <CountryProvider initialCountry={country}>
          <LocaleProvider initialLocale={lang as any}>
            <RegionProvider initialCountry={country}>
              <PwaRegister />
              <TopPwaBar />
              {children}
            </RegionProvider>
          </LocaleProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
