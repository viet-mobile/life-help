import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/learn/BrandLogo";
import { LocaleSwitch } from "@/components/learn/LocaleSwitch";
import { StartCta } from "@/components/learn/StartCta";
import { getServerT } from "@/lib/learn/i18n/server";
import { loadContent, accountsEnabled, getLearnService, getUserId } from "@/lib/learn/server/runtime";
import { learnHost, parseLearnHost } from "@/lib/learn/hosts";
import { siteConfig } from "@/lib/learn/sites";
import { SITES, isSite, schoolLevel } from "@/lib/learn/types";
import { HUB } from "@/components/think/hubLabels";
import { thinkLangFor } from "@/lib/think/lang";

export default async function Landing({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const h = await headers();
  const base = h.get("x-learn-base") ?? `/study/${site}`;
  const { t, locale } = await getServerT();
  const { bundle } = await loadContent(site, locale);
  const userId = await getUserId();
  const hasProfile = userId ? !!(await getLearnService().getState({ userId }, site)).profile : false;
  // Links to the other learning sites: same stage (production / staging) on their own hosts, or the /study path locally.
  const stage = parseLearnHost(h.get("host") ?? "")?.stage;
  const others = SITES.filter((s) => s !== site).map((s) => ({ site: s, href: stage && stage !== "local" ? `https://${learnHost(s, stage)}` : `/study/${s}` }));

  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <header className="l-landing-head">
        <span className="l-brand"><BrandLogo site={site} name={t(siteConfig(site).brandKey)} size={56} /></span>
        <LocaleSwitch />
        {others.map((o) => <Link key={o.site} className="l-link" href={o.href} data-testid={`other-site-${o.site}`}>{t("site.other", { name: t(`site.${o.site}.name` as never) })}</Link>)}
      </header>

      <section className="l-card l-card-accent l-stack" style={{ padding: 28 }}>
        <p style={{ fontWeight: 800 }}>{t("landing.eyebrow")}</p>
        <h1 className="l-h1">{t(`site.${site}.tagline` as never)}</h1>
        <p>{t(`site.${site}.description` as never)}</p>
        <StartCta accountHasProfile={hasProfile} accountsEnabled={accountsEnabled()} />
        <Link className="l-btn l-btn-light l-btn-block" data-testid="landing-think" href={`${base}/think`}>🧠 {HUB[thinkLangFor(locale, site)].title}</Link>
        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>{t("landing.privacy")}</p>
        <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
          <Link className="l-link" href={`${base}/privacy`}>{t("legal.privacy")}</Link> · <Link className="l-link" href={`${base}/terms`}>{t("legal.terms")}</Link>
        </p>
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
        {siteConfig(site).levelGroups.map(({ key: level }) => {
          const courses = bundle.catalog.courses.filter((c) => schoolLevel(c.grade) === level);
          if (courses.length === 0) return null;
          return (
            <div key={level} className="l-stack">
              <h3 className="l-h2">{t(`grade.group.${level}` as never)}</h3>
              <div className="l-grid l-grid-2">
                {courses.map((c) => (
                  <div key={c.id} className="l-card">
                    <div style={{ fontSize: "2rem" }} aria-hidden="true">{c.world.emoji}</div>
                    <h3 className="l-h2">{c.world.name}</h3>
                    <p className="l-muted">{c.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      <span hidden data-base={base} />
    </div>
  );
}
