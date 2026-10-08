import type { Translator } from "@/lib/learn/i18n";
import type { Access } from "@/lib/learn/domain/access";

/**
 * Shown instead of a premium lesson when the server says this learner has no active Premium. It carries no lesson content (the server
 * did not send any). There is no checkout yet: the button is disabled and says so; nothing is charged and no success is pretended.
 */
export function PremiumGate({ t, access, title, backHref }: { t: Translator; access: Access; title: string; backHref: string }) {
  return (
    <section className="l-wrap l-stack l-card l-premium-gate" data-testid="premium-gate" data-access={access.status}>
      <div style={{ fontSize: "2.4rem" }} aria-hidden="true">💎</div>
      <p className="l-tier" data-tier="premium">{t("premium.content")}</p>
      <h1 className="l-h1">{title}</h1>
      <p data-testid="premium-reason">{t(access.status === "expired" ? "premium.expired" : "premium.required")}</p>
      <p className="l-muted">{t("premium.progressSaved")}</p>
      <button type="button" className="l-btn l-btn-block" disabled aria-describedby="premium-not-available" data-testid="premium-unlock">
        {t(access.status === "expired" ? "premium.upgrade" : "premium.unlock")}
      </button>
      <p id="premium-not-available" className="l-muted" data-testid="premium-not-available">{t("premium.notAvailable")}</p>
      <a className="l-btn l-btn-ghost l-btn-block" href={backHref}>{t("premium.continue")}</a>
    </section>
  );
}
