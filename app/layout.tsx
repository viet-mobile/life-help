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

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);
  const portal = resolvePortalFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);

  const baseMeta =
    portal === "chat" || portal === "tech" || portal === "sys"
      ? getPortalMetadata(portal, lang)
      : getSiteMetadata(lang);

  const icons = getIconMetadata(country);

  return {
    ...baseMeta,
    icons,
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
      </head>
      <body>
        <CountryProvider initialCountry={country}>
          <LocaleProvider initialLocale={lang as any}>
            <RegionProvider initialCountry={country}>{children}</RegionProvider>
          </LocaleProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
