import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LearnerProvider } from "@/components/learn/LearnerProvider";
import { PlayShell } from "@/components/learn/PlayShell";
import { toMetaBundle } from "@/lib/learn/content/indexer";
import { getLocale } from "@/lib/learn/i18n/server";
import { loadContent, accountsEnabled, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

// Student pages are personal: never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PlayLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const { bundle } = await loadContent(site, await getLocale());
  const userId = await getUserId();
  const initial = userId ? await getLearnService().getState({ userId }, site) : null;
  return (
    <LearnerProvider meta={toMetaBundle(bundle)} initialState={initial} accountsEnabled={accountsEnabled()}>
      <PlayShell>{children}</PlayShell>
    </LearnerProvider>
  );
}
