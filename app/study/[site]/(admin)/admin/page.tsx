import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserRole } from "@/lib/auth/roles";
import { getContentRepository } from "@/lib/learn/content/repository";
import { t } from "@/lib/learn/i18n";
import { accountsEnabled } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: t("admin.title"), robots: { index: false, follow: false } };

/**
 * Content overview (read-only foundation). Staff only, verified from the
 * Supabase session (app_metadata.role), never from a client-set cookie.
 * Answer keys are deliberately never rendered.
 */
export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();

  let allowed = false;
  if (accountsEnabled()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = getUserRole(user);
      allowed = role === "ADMIN" || role === "STAFF";
    } catch {
      allowed = false;
    }
  }
  if (!allowed) {
    return (
      <div className="l-wrap">
        <div className="l-panel l-panel-reveal" role="alert">{t("admin.forbidden")}</div>
      </div>
    );
  }

  const bundle = await getContentRepository().getBundle(site);
  const byStatus = new Map<string, number>();
  for (const q of bundle.questions) byStatus.set(q.status, (byStatus.get(q.status) ?? 0) + 1);
  const lessons = bundle.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons));
  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">{t("admin.title")}</h1>
      <p className="l-muted">{t("admin.summary", { source: "bundled demo curriculum" })}</p>
      <div className="l-grid l-grid-2">
        <div className="l-card">{t("admin.lessons")}: {lessons.length}</div>
        <div className="l-card">{t("admin.skills")}: {bundle.catalog.skills.length}</div>
      </div>
      <div className="l-card">
        <h2 className="l-h2">{t("admin.questions")} · {t("admin.status")}</h2>
        <ul>{[...byStatus].map(([s, n]) => <li key={s}>{s}: {n}</li>)}</ul>
      </div>
      <div className="l-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: "0.9rem" }}>
          <thead><tr><th align="left">id</th><th align="left">type</th><th align="left">skill</th><th>diff</th><th align="left">{t("admin.status")}</th></tr></thead>
          <tbody>
            {bundle.questions.map((q) => (
              <tr key={q.id}><td>{q.id}</td><td>{q.type}</td><td>{q.skillId}</td><td align="center">{q.difficulty}</td><td>{q.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
