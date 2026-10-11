import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "../study.css";
import { SiteProvider } from "@/components/learn/LearnerProvider";
import { localeDir } from "@/lib/learn/i18n";
import { getServerT } from "@/lib/learn/i18n/server";
import { siteConfig } from "@/lib/learn/sites";
import { isSite } from "@/lib/learn/types";
import { learnHost, parseLearnHost } from "@/lib/learn/hosts";
import { locales } from "@/messages/registry";

/** "/study/math/en" -> "/study/math"; "/en" -> ""; "" -> "" : the part of x-learn-base before the language prefix. */
function parseSiteRoot(base: string, site: string): string {
  const root = base.startsWith(`/study/${site}`) ? `/study/${site}` : "";
  return root;
}

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  if (!isSite(site)) return {};
  const { t, locale } = await getServerT(); // title / description / social preview in the learner's language
  const name = t(siteConfig(site).brandKey);
  // Absolute URL for social previews (relative og:image would be resolved against a default origin).
  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  // A production learning host is always presented under its REPRESENTATIVE address (korean.life.help for the Korean study site):
  // canonical, hreflang, og:url and the social image never name an alias.
  const info = parseLearnHost(requestHost);
  const host = info?.stage === "production" ? learnHost(info.site, "production") : requestHost;
  const origin = host ? `${host.startsWith("localhost") || host.includes(".localhost") || host.startsWith("127.") ? "http" : "https"}://${host}` : "";
  const logo = `${origin}/logos/logo-${site}.png`;
  // Language alternates (hreflang) for the SAME page: the site's own host serves /<locale>/<page>; path mode (staging / local) sits under /study/<site>.
  const siteRoot = origin;
  const rootPath = parseSiteRoot(h.get("x-learn-base") ?? "", site);
  const innerPath = h.get("x-learn-path") ?? "/";
  const page = innerPath === "/" ? "" : innerPath;
  const urlLocale = h.get("x-learn-locale");
  const languages = Object.fromEntries([...locales.map((l) => [l, `${siteRoot}${rootPath}/${l}${page}`] as const), ["x-default", `${siteRoot}${rootPath}${page || "/"}`] as const]);
  return {
    metadataBase: origin ? new URL(origin) : undefined,
    alternates: { canonical: urlLocale ? languages[urlLocale] : `${siteRoot}${rootPath}${page || "/"}`, languages },
    title: { default: `${name} · ${t(`site.${site}.tagline` as never)}`, template: `%s · ${name}` },
    description: t(`site.${site}.description` as never),
    // Staging/local are never indexed; individual pages narrow this further.
    // First (guest-only) production release: the learning sites are NOT indexed. Search visibility is a separate, later decision.
    robots: { index: false, follow: false },
    applicationName: name,
    // The site's own logo (LIFE.HELP with MATH / ENGLISH above it) replaces the generic LIFE.HELP icons of the root layout.
    icons: {
      icon: [
        { url: `/logos/favicon-${site}-32.png`, sizes: "32x32", type: "image/png" },
        { url: `/logos/favicon-${site}.png`, sizes: "192x192", type: "image/png" },
        { url: `/logos/favicon-${site}.ico`, sizes: "any" },
      ],
      shortcut: [`/logos/favicon-${site}.png`],
      apple: [{ url: `/logos/apple-touch-icon-${site}.png`, sizes: "180x180", type: "image/png" }],
    },
    openGraph: { url: urlLocale ? languages[urlLocale] : `${siteRoot}${rootPath}${page || "/"}`, alternateLocale: locales.filter((l) => l !== locale).map((l) => l.replace("-", "_")), title: t(`site.${site}.tagline` as never), description: t(`site.${site}.description` as never), locale: locale.replace("-", "_"), type: "website", siteName: name, images: [{ url: logo, width: 512, height: 512, alt: name }] },
    twitter: { card: "summary", title: t(`site.${site}.tagline` as never), description: t(`site.${site}.description` as never), images: [logo] },
  };
}

export default async function StudyLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  const { locale, messages } = await getServerT();
  // lang / dir from the locale registry: Arabic-script and Hebrew locales render right-to-left; target-language material and formulas
  // inside keep their own direction (components mark them dir="ltr" / lang).
  return (
    <div className="study-root" data-site={site} lang={locale} dir={localeDir(locale)}>
      <SiteProvider site={site} base={base} locale={locale} messages={messages}>
        {children}
      </SiteProvider>
    </div>
  );
}
