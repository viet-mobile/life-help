import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { StartCta } from "@/components/learn/StartCta";
import { loadIndex } from "@/lib/learn/content/repository";
import { t } from "@/lib/learn/i18n";
import { accountsEnabled, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

export default async function Landing({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  const { bundle } = await loadIndex(site);
  const userId = await getUserId();
  const hasProfile = userId ? !!(await getLearnService().getState({ userId }, site)).profile : false;
  const other = site === "math" ? "english" : "math";
  const otherHost = h.get("x-learn-base") === "" ? `https://${other}.life.help` : `/study/${other}`;

  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="l-brand">{site === "math" ? t("brand.math") : t("brand.english")}</span>
        <Link className="l-link" href={otherHost}>{t("site.other", { name: t(`site.${other}.name` as never) })}</Link>
      </header>

      <section className="l-card l-card-accent l-stack" style={{ padding: 28 }}>
        <p style={{ fontWeight: 800 }}>{t("landing.eyebrow")}</p>
        <h1 className="l-h1">{t(`site.${site}.tagline` as never)}</h1>
        <p>{t(`site.${site}.description` as never)}</p>
        <StartCta accountHasProfile={hasProfile} accountsEnabled={accountsEnabled()} />
        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>{t("landing.privacy")}</p>
      </section>

      <section className="l-stack" aria-labelledby="how-h">
        <h2 id="how-h" className="l-h2">{t("landing.howTitle")}</h2>
        <div className="l-grid l-grid-2">
          {(["1", "2", "3"] as const).map((n) => (
            <div key={n} className="l-card">
              <h3 className="l-h2">{t(`landing.how${n}.title` as never)}</h3>
              <p className="l-muted">{t(`landing.how${n}.body` as never)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-stack" aria-labelledby="worlds-h">
        <h2 id="worlds-h" className="l-h2">{t("landing.worldsTitle")}</h2>
        <div className="l-grid l-grid-2">
          {bundle.catalog.courses.map((c) => (
            <div key={c.id} className="l-card">
              <div style={{ fontSize: "2rem" }} aria-hidden="true">{c.world.emoji}</div>
              <h3 className="l-h2">{c.world.name}</h3>
              <p className="l-muted">{c.title}</p>
            </div>
          ))}
        </div>
      </section>
      <span hidden data-base={base} />
    </div>
  );
}
