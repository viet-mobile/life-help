import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "../study.css";
import { SiteProvider } from "@/components/learn/LearnerProvider";
import { t } from "@/lib/learn/i18n";
import { isSite } from "@/lib/learn/types";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  if (!isSite(site)) return {};
  const name = t(site === "math" ? "brand.math" : "brand.english");
  // Absolute URL for social previews (relative og:image would be resolved against a default origin).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const origin = host ? `${host.startsWith("localhost") || host.includes(".localhost") || host.startsWith("127.") ? "http" : "https"}://${host}` : "";
  const logo = `${origin}/logos/logo-${site}.png`;
  return {
    title: { default: `${t(site === "math" ? "brand.math" : "brand.english")} · ${t(`site.${site}.tagline` as never)}`, template: `%s · ${t(site === "math" ? "brand.math" : "brand.english")}` },
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
    openGraph: { title: t(`site.${site}.tagline` as never), description: t(`site.${site}.description` as never), locale: "ko_KR", type: "website", siteName: name, images: [{ url: logo, width: 512, height: 512, alt: name }] },
    twitter: { card: "summary", title: t(`site.${site}.tagline` as never), description: t(`site.${site}.description` as never), images: [logo] },
  };
}

export default async function StudyLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  return (
    <div className="study-root" data-site={site} lang="ko">
      <SiteProvider site={site} base={base}>
        {children}
      </SiteProvider>
    </div>
  );
}
