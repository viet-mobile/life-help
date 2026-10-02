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
  return {
    title: { default: `${t(site === "math" ? "brand.math" : "brand.english")} · ${t(`site.${site}.tagline` as never)}`, template: `%s · ${t(site === "math" ? "brand.math" : "brand.english")}` },
    description: t(`site.${site}.description` as never),
    // Staging/local are never indexed; individual pages narrow this further.
    // First (guest-only) production release: the learning sites are NOT indexed. Search visibility is a separate, later decision.
    robots: { index: false, follow: false },
    applicationName: t(site === "math" ? "brand.math" : "brand.english"),
    openGraph: { title: t(`site.${site}.tagline` as never), description: t(`site.${site}.description` as never), locale: "ko_KR", type: "website" },
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
