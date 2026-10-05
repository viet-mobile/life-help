"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { studyUrls } from "@/lib/home/studyHosts";

/**
 * The Study card's chooser: two plain links to the learning sub-domains (a real navigation, not a route of this site).
 * Accessible dialog: labelled, Escape and backdrop close, focus moves in and returns to the card.
 */
export function StudyChooser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [urls, setUrls] = useState(() => studyUrls("life.help"));
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrls(studyUrls(window.location.hostname, window.location.port));
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const goTo = (site: string) => t("study.chooser.goTo").replace("{site}", site);
  const options = [
    { id: "math", href: urls.math, site: "math.life.help", icon: "➗", title: t("study.chooser.math"), desc: t("study.chooser.mathDesc"), ring: "border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50" },
    { id: "english", href: urls.english, site: "english.life.help", icon: "🔤", title: t("study.chooser.english"), desc: t("study.chooser.englishDesc"), ring: "border-sky-300 hover:border-sky-500 hover:bg-sky-50" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={t("study.chooser.aria")} data-testid="study-chooser" className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">{t("study.chooser.title")}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">{t("study.chooser.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("study.chooser.close")} className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-sm font-black text-slate-600 hover:bg-slate-100">✕</button>
        </div>
        <div className="mt-4 grid gap-2.5">
          {options.map((o, i) => (
            <a key={o.id} ref={i === 0 ? firstLink : undefined} href={o.href} data-testid={`study-link-${o.id}`} className={`flex items-center gap-3 rounded-xl border-2 bg-white p-3 transition ${o.ring}`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl" aria-hidden="true">{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-slate-900">{o.title}</span>
                <span className="block text-xs font-semibold text-slate-500">{o.desc}</span>
              </span>
              <span className="shrink-0 text-xs font-black text-slate-500">{goTo(o.site)} →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
