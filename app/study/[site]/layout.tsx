import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "../study.css";
import { SiteProvider } from "@/components/learn/LearnerProvider";
import { localeDir, type LearnLocale, type Messages } from "@/lib/learn/i18n";
import { getServerT, getSecondaryLocale, getSecondaryLocales } from "@/lib/learn/i18n/server";
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
  const secondaryLocale = await getSecondaryLocale();
  const sec = secondaryLocale && secondaryLocale !== locale ? await getServerT(secondaryLocale) : null;

  const name = t(siteConfig(site).brandKey);
  const primaryTagline = t(`site.${site}.tagline` as never);
  const primaryDesc = t(`site.${site}.description` as never);
  const secName = sec ? sec.t(siteConfig(site).brandKey) : "";
  const secTagline = sec ? sec.t(`site.${site}.tagline` as never) : "";
  const secDesc = sec ? sec.t(`site.${site}.description` as never) : "";

  const titleText = sec
    ? `${name} · ${primaryTagline} · ${secName} · ${secTagline}`
    : `${name} · ${primaryTagline}`;
  const descText = sec
    ? `${primaryDesc}\n${secDesc}`
    : primaryDesc;

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
  const ogImageUrl = `${origin}/og-${site}.png?v=20261123d`;

  return {
    metadataBase: origin ? new URL(origin) : undefined,
    alternates: { canonical: urlLocale ? languages[urlLocale] : `${siteRoot}${rootPath}${page || "/"}`, languages },
    title: { default: titleText, template: `%s · ${name}` },
    description: descText,
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
    openGraph: {
      url: urlLocale ? languages[urlLocale] : `${siteRoot}${rootPath}${page || "/"}`,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => l.replace("-", "_")),
      title: sec ? titleText : primaryTagline,
      description: descText,
      locale: locale.replace("-", "_"),
      type: "website",
      siteName: name,
      images: [{ url: logo, width: 512, height: 512, alt: name }, { url: ogImageUrl, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: sec ? titleText : primaryTagline,
      description: descText,
      images: [ogImageUrl],
    },
  };
}

export default async function StudyLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  const { locale, messages } = await getServerT();
  const secondaryLocales = (await getSecondaryLocales()).filter((l) => l !== locale).slice(0, 4);
  const secondaryLocale = secondaryLocales[0] ?? null;
  const secondaryMessagesList = await Promise.all(
    secondaryLocales.map(async (secLoc) => {
      try {
        const res = await getServerT(secLoc);
        return { locale: secLoc, messages: res.messages };
      } catch {
        return null;
      }
    })
  );
  const validSecMessages = secondaryMessagesList.filter((m): m is { locale: LearnLocale; messages: Messages } => m !== null);
  const secondaryMessages = validSecMessages[0]?.messages ?? null;
  const secondaryMessagesMap = Object.fromEntries(validSecMessages.map((m) => [m.locale, m.messages]));

  return (
    <div className="study-root" data-site={site} lang={locale} dir={localeDir(locale)}>
      <SiteProvider
        site={site}
        base={base}
        locale={locale}
        messages={messages}
        secondaryLocale={secondaryLocale}
        secondaryLocales={secondaryLocales}
        secondaryMessages={secondaryMessages}
        secondaryMessagesMap={secondaryMessagesMap}
      >
        {children}
      </SiteProvider>
    </div>
  );
}
