import type { Metadata } from "next";
import type { LearnLocale } from "@/lib/learn/i18n";
import type { MetaBundle } from "@/lib/learn/types";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LearnerProvider } from "@/components/learn/LearnerProvider";
import { PlayShell } from "@/components/learn/PlayShell";
import { toMetaBundle } from "@/lib/learn/content/indexer";
import { getLocale, getSecondaryLocale, getSecondaryLocales } from "@/lib/learn/i18n/server";
import { loadContent, accountsEnabled, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";
import { accessibleBundle } from "@/lib/learn/domain/access";

// Student pages are personal: never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PlayLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const locale = await getLocale();
  const secondaryLocales = (await getSecondaryLocales()).filter((l) => l !== locale).slice(0, 4);
  const secondaryLocale = secondaryLocales[0] ?? null;
  const { bundle } = await loadContent(site, locale);
  const userId = await getUserId();
  const svc = getLearnService();
  const initial = userId ? await svc.getState({ userId }, site) : null;
  // Server-authoritative access: premium lessons stay listed (as Premium) but carry no teaching text for a non-Premium learner.
  const [access, plan] = await Promise.all([svc.getAccess({ userId }, site), svc.accessPlan(site)]);
  const secondaryMetas = await Promise.all(
    secondaryLocales.map(async (secLoc) => {
      try {
        const secRes = await loadContent(site, secLoc);
        return { locale: secLoc, meta: toMetaBundle(accessibleBundle(secRes.bundle, plan, access)) };
      } catch {
        return null;
      }
    })
  );
  const validSecondaryMetas = secondaryMetas.filter((item): item is { locale: LearnLocale; meta: MetaBundle } => item !== null);
  const primarySecondaryMeta = validSecondaryMetas[0]?.meta ?? null;

  return (
    <LearnerProvider
      meta={toMetaBundle(accessibleBundle(bundle, plan, access))}
      secondaryMeta={primarySecondaryMeta}
      secondaryMetas={validSecondaryMetas}
      initialState={initial}
      accountsEnabled={accountsEnabled()}
      access={access}
    >
      <PlayShell>{children}</PlayShell>
    </LearnerProvider>
  );
}
