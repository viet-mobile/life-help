import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { reviewModeEnabled } from "@/lib/learn/review/access";
import { readLearnPublicConfig } from "@/lib/learn/server/supabase/config";
import { ReviewPasswordReset } from "@/components/learn/ReviewPasswordReset";

export const metadata: Metadata = { title: "검토 계정 비밀번호 재설정", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (site !== "korean" || !reviewModeEnabled()) notFound();
  const config = readLearnPublicConfig();
  if (!config) notFound();
  return <ReviewPasswordReset url={config.url} publishableKey={config.publishableKey} />;
}
