import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/learn/LessonRunner";
import { PremiumGate } from "@/components/learn/PremiumGate";
import { getServerT } from "@/lib/learn/i18n/server";
import { getLearnService, getUserId, loadContent } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

export default async function Page({ params }: { params: Promise<{ site: string; lessonId: string }> }) {
  const { site, lessonId } = await params;
  if (!isSite(site)) notFound();
  const { t, locale } = await getServerT();
  const { index } = await loadContent(site, locale);
  const found = index.lessons.get(lessonId);
  if (!found) notFound();
  // Server-authoritative gate (also enforced by every learning API action): a direct URL never opens a premium lesson without Premium.
  const svc = getLearnService();
  const [access, plan] = await Promise.all([svc.getAccess({ userId: await getUserId() }, site), svc.accessPlan(site)]);
  if (plan.lessonTier.get(lessonId) === "PREMIUM" && access.tier !== "PREMIUM") {
    const base = (await headers()).get("x-learn-base") ?? `/study/${site}`;
    return <PremiumGate t={t} access={access} title={found.lesson.title} backHref={`${base}/learn`} />;
  }
  return <LessonRunner kind="lesson" lessonId={lessonId} />;
}
