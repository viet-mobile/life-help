import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LearnerProvider } from "@/components/learn/LearnerProvider";
import { PlayShell } from "@/components/learn/PlayShell";
import { toMetaBundle } from "@/lib/learn/content/indexer";
import { getLocale } from "@/lib/learn/i18n/server";
import { loadContent, accountsEnabled, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";
import { accessibleBundle } from "@/lib/learn/domain/access";

// Student pages are personal: never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PlayLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const { bundle } = await loadContent(site, await getLocale());
  const userId = await getUserId();
  const svc = getLearnService();
  const initial = userId ? await svc.getState({ userId }, site) : null;
  // Server-authoritative access: premium lessons stay listed (as Premium) but carry no teaching text for a non-Premium learner.
  const [access, plan] = await Promise.all([svc.getAccess({ userId }, site), svc.accessPlan(site)]);
  return (
    <LearnerProvider meta={toMetaBundle(accessibleBundle(bundle, plan, access))} initialState={initial} accountsEnabled={accountsEnabled()} access={access}>
      <PlayShell>{children}</PlayShell>
    </LearnerProvider>
  );
}
