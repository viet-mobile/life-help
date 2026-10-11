import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/LegalPage";
import { getServerT } from "@/lib/learn/i18n/server";
import { isSite } from "@/lib/learn/types";

export const metadata: Metadata = { title: "이용약관 · Terms of Service", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const base = (await headers()).get("x-learn-base") ?? `/study/${site}`;
  const { locale } = await getServerT();
  return <LegalPage kind="terms" primary={locale === "ko" ? "ko" : "en"} home={base || "/"} other={{ href: `${base}/privacy`, label: "개인정보처리방침 · Privacy" }} />;
}
