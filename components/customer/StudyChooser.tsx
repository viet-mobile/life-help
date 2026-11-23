"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { studyUrls } from "@/lib/home/studyHosts";
import { HangeulCalligraphyIcon } from "@/components/shared/HangeulCalligraphyIcon";

/**
 * The Study card's chooser: three plain links to the learning sub-domains (a real navigation, not a route of this site).
 * Accessible dialog: labelled, Escape and backdrop close, focus moves in and returns to the card.
 */
// The host is constant for this document. Read it before rendering actionable links;
// there is no post-open effect that can replace production links with different destinations.
const subscribeHost = () => () => {};
const browserHost = () => window.location.host;
const serverHost = () => "life.help";

export function StudyChooser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useLocale();
  const locationHost = useSyncExternalStore(subscribeHost, browserHost, serverHost);
  const [hostname, port = ""] = locationHost.split(":");
  const urls = studyUrls(hostname, port, locale);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const goTo = (site: string) => t("study.chooser.goTo").replace("{site}", site);
  const options: { id: string; href: string; site: string; icon: React.ReactNode; title: string; desc: string; ring: string }[] = [
    { id: "korean", href: urls.korean, site: "korean.life.help", icon: <HangeulCalligraphyIcon className="w-5 h-5" />, title: t("study.chooser.korean"), desc: t("study.chooser.koreanDesc"), ring: "border-violet-300 hover:border-violet-500 hover:bg-violet-50" },
    { id: "english", href: urls.english, site: "english.life.help", icon: "🔤", title: t("study.chooser.english"), desc: t("study.chooser.englishDesc"), ring: "border-sky-300 hover:border-sky-500 hover:bg-sky-50" },
    { id: "math", href: urls.math, site: "math.life.help", icon: "➗", title: t("study.chooser.math"), desc: t("study.chooser.mathDesc"), ring: "border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50" },
    { id: "physics", href: urls.physics, site: "physics.life.help", icon: "🔬", title: t("study.chooser.physics"), desc: t("study.chooser.physicsDesc"), ring: "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50" },
    { id: "chemistry", href: urls.chemistry, site: "chemistry.life.help", icon: "🧪", title: t("study.chooser.chemistry"), desc: t("study.chooser.chemistryDesc"), ring: "border-teal-300 hover:border-teal-500 hover:bg-teal-50" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={t("study.chooser.aria")} data-testid="study-chooser" className="w-full max-w-md sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-3.5 sm:p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">{t("study.chooser.title")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">{t("study.chooser.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("study.chooser.close")} className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-sm font-black text-slate-600 hover:bg-slate-100">✕</button>
        </div>
        <div className="mt-4 grid gap-2.5">
          {options.map((o, i) => (
            <a key={o.id} ref={i === 0 ? firstLink : undefined} href={o.href} data-testid={`study-link-${o.id}`} className={`flex items-center gap-2.5 sm:gap-3.5 rounded-xl border-2 bg-white p-2.5 sm:p-3.5 transition ${o.ring} active:scale-[0.99]`}>
              <span className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl sm:text-2xl shadow-2xs" aria-hidden="true">{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm sm:text-base font-black text-slate-900">{o.title}</span>
                <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 line-clamp-1 sm:line-clamp-none">{o.desc}</span>
              </span>
              <span className="shrink-0 text-xs font-black text-slate-500">{goTo(o.site)} →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
