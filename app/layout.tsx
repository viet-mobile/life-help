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
import { isJiuHost, jiuMetadata } from "@/lib/jiu/brand";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { directionForLocale } from "@/lib/i18n/direction";
import { buildAlternates, countryBrandName, originFromHost } from "@/lib/i18n/seo";
import { getLocale as getLearnLocale } from "@/lib/learn/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  if (isJiuHost(headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "")) return jiuMetadata;
  const lang = resolveLanguageFromHeaders(headersList);
  const portal = resolvePortalFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);

  const baseMeta =
    portal === "chat" || portal === "tech" || portal === "sys"
      ? getPortalMetadata(portal, lang)
      : getSiteMetadata(lang, country);

  const icons = getIconMetadata(country, portal);

  // canonical + hreflang for public customer pages (the proxy passes the public path and any language prefix of the requested URL)
  const publicPath = headersList.get("x-life-path");
  const alternates =
    portal === "customer" && publicPath
      ? buildAlternates(originFromHost(headersList.get("x-forwarded-host") ?? headersList.get("host")), publicPath, headersList.get("x-life-url-lang"))
      : undefined;

  const appName =
    portal === "tech"
      ? "LIFE.HELP · TECH"
      : portal === "chat"
      ? "LIFE.HELP · CHAT"
      : portal === "sys"
      ? "LIFE.HELP · SYS"
      : country
      ? `LIFE.HELP · ${countryBrandName(country)}`
      : "LIFE.HELP";

  return {
    ...baseMeta,
    ...(alternates ? { alternates } : {}),
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
  const portalHeader = headersList.get("x-life-portal") ?? "";
  const isLearn = portalHeader === "learn";
  // Learning sites resolve their language from the URL / cookie (same source as the study layout); the marketplace from host + path.
  const lang = isLearn ? await getLearnLocale() : resolveLanguageFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);

  const jiu = isJiuHost(headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "");
  return (
    <html lang={lang} dir={directionForLocale(lang)} data-learn={isLearn ? "1" : undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {!jiu && <link rel="manifest" href="/manifest.json" />}
        <meta name="theme-color" content={jiu ? "#253b35" : "#000000"} />
      </head>
      <body>
        <CountryProvider initialCountry={country}>
          <LocaleProvider initialLocale={lang as any}>
            <RegionProvider initialCountry={country}>
              <PwaRegister />
              {!["learn", "jiu"].includes(headersList.get("x-life-portal") ?? "") && <TopPwaBar />}
              {children}
            </RegionProvider>
          </LocaleProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
