"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useCountry } from "@/lib/country/CountryContext";
import { canonicalCountrySlugOrSelf } from "@/lib/visa/slug";
import { VISA_DESTINATIONS } from "@/lib/visa/destinations";
import { ISO_REGIONS } from "@/lib/visa/isoRegions";
import { PURPOSE_ICON, VISA_PURPOSES, type VisaPurpose } from "@/lib/visa/purposes";
import { entryFor } from "@/lib/visa/finder";
import type { DestinationVisaInfo, VisaLink } from "@/lib/visa/types";

const regionName = (locale: string, code: string): string => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};
const fill = (s: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
const LINK_KINDS: VisaLink["kind"][] = ["evisa", "form", "checklist", "info", "fee", "appointment"];

/** Visa document guide: pick destination, nationality and visa type; shows only what was checked against official pages, with the source. */
export function VisaFinder() {
  const { locale, t } = useLocale();
  const { country } = useCountry();
  const [dest, setDest] = useState("");
  const [nat, setNat] = useState("");
  const [purpose, setPurpose] = useState<VisaPurpose | "">("");
  const [info, setInfo] = useState<DestinationVisaInfo | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  // the country host (ghana.life.help ...) pre-selects its own country
  useEffect(() => {
    const slug = canonicalCountrySlugOrSelf(country ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (slug && VISA_DESTINATIONS.some((d) => d.slug === slug)) setDest((cur) => cur || slug);
  }, [country]);

  useEffect(() => {
    if (!dest) return;
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState("loading");
    fetch(`/visa-data/${dest}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: DestinationVisaInfo) => { if (live) { setInfo(d); setState("idle"); } })
      .catch(() => { if (live) { setInfo(null); setState("error"); } });
    return () => { live = false; };
  }, [dest]);

  const destinations = useMemo(() => {
    const c = new Intl.Collator([locale]);
    return [...VISA_DESTINATIONS].map((d) => ({ ...d, label: regionName(locale, d.iso2) })).sort((a, b) => c.compare(a.label, b.label));
  }, [locale]);
  const nationalities = useMemo(() => {
    const c = new Intl.Collator([locale]);
    return ISO_REGIONS.map((code) => ({ code, label: regionName(locale, code) })).sort((a, b) => c.compare(a.label, b.label));
  }, [locale]);

  const current = info && info.slug === dest ? info : null;
  const entry = current && nat ? entryFor(current, nat) : null;
  const purposeInfo = current && purpose ? current.purposes[purpose] : undefined;
  const sel = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900";

  const linkLabel = (k: VisaLink["kind"]) => t(`visa.links.${k}`);
  const sortLinks = (ls: VisaLink[]) => [...ls].sort((a, b) => LINK_KINDS.indexOf(a.kind) - LINK_KINDS.indexOf(b.kind));
  const LinkRow = ({ l }: { l: VisaLink }) => (
    <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-800 underline break-words">{l.title}</a>
      <div className="mt-0.5 text-[11px] text-slate-500">
        {linkLabel(l.kind)} · {fill(t("visa.pageLang"), { langs: l.langs.join(", ") })} · {fill(t("visa.verifiedAt"), { date: l.verifiedAt })}
      </div>
    </li>
  );

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50/60 to-white px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-slate-600 underline">← {t("visa.back")}</Link>
        <h1 className="mt-2 text-2xl font-black text-slate-900" data-testid="visa-title">🛂 {t("visa.title")}</h1>
        <p className="mt-1 text-sm text-slate-700">{t("visa.subtitle")}</p>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900" role="note">{t("visa.disclaimer")}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-black text-slate-700">{t("visa.destination")}
            <select data-testid="visa-destination" className={sel} value={dest} onChange={(e) => setDest(e.target.value)}>
              <option value="">{t("visa.select")}</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-black text-slate-700">{t("visa.nationality")}
            <select data-testid="visa-nationality" className={sel} value={nat} onChange={(e) => setNat(e.target.value)}>
              <option value="">{t("visa.select")}</option>
              {nationalities.map((n) => <option key={n.code} value={n.code}>{n.label}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-black text-slate-700">{t("visa.purpose")}</legend>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label={t("visa.purpose")}>
            {VISA_PURPOSES.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={purpose === p} data-testid={`visa-purpose-${p}`} onClick={() => setPurpose(p)}
                className={`rounded-full border px-3 py-1.5 text-sm font-black transition ${purpose === p ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`}>
                <span aria-hidden="true">{PURPOSE_ICON[p]}</span> {t(`visa.purposes.${p}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {state === "loading" && <p className="mt-4 text-sm text-slate-600" role="status">{t("visa.loading")}</p>}
        {state === "error" && <p className="mt-4 text-sm font-bold text-red-700" role="alert">{t("visa.error")}</p>}

        {current && (
          <div className="mt-5 space-y-4" data-testid="visa-result">
            {current.status !== "verified" && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{current.status === "pending" ? t("visa.pending") : t("visa.partial")}</p>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="visa-entry-h">
              <h2 id="visa-entry-h" className="text-base font-black text-slate-900">{t("visa.entry.title")}</h2>
              {!entry && <p className="mt-1 text-sm text-slate-600">{t("visa.entry.pick")}</p>}
              {entry?.kind === "own" && <p className="mt-1 text-sm font-bold text-slate-800">{t("visa.entry.own")}</p>}
              {entry?.kind === "rule" && (
                <div className="mt-1 text-sm text-slate-800" data-testid="visa-entry-rule">
                  <p className="font-black" data-status={entry.rule.status}>{t(`visa.entry.${entry.rule.status}`)}{entry.rule.days ? ` · ${fill(t("visa.entry.days"), { days: entry.rule.days })}` : ""}</p>
                  {entry.rule.note && <p className="mt-0.5 text-xs text-slate-600">{entry.rule.note}</p>}
                  <a href={entry.rule.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-blue-800 underline">{t("visa.entry.source")}</a>
                </div>
              )}
              {entry?.kind === "unlisted" && (
                <div className="mt-1 text-sm text-slate-700" data-testid="visa-entry-unlisted">
                  <p>{t("visa.entry.unknown")}</p>
                  {entry.listSource && <a href={entry.listSource} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-blue-800 underline">{t("visa.entry.listSource")}</a>}
                </div>
              )}
            </section>

            {purpose && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="visa-purpose-h">
                <h2 id="visa-purpose-h" className="text-base font-black text-slate-900">{PURPOSE_ICON[purpose]} {t(`visa.purposes.${purpose}`)}</h2>
                {!purposeInfo && <p className="mt-1 text-sm text-slate-600">{t("visa.noPurpose")}</p>}
                {purposeInfo && (
                  <div className="mt-2 space-y-3">
                    {purposeInfo.visaTypes.length > 0 && (
                      <div>
                        <h3 className="text-xs font-black text-slate-600">{t("visa.types.title")}</h3>
                        <p className="text-sm font-bold text-slate-900" dir="auto">{purposeInfo.visaTypes.join(" · ")}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-black text-slate-600">{t("visa.docs.title")}</h3>
                      {purposeInfo.docs.length === 0 ? <p className="text-sm text-slate-600">{t("visa.docs.none")}</p> : (
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-800" dir="auto">
                          {purposeInfo.docs.map((d, i) => <li key={i}>{d.text} <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-800 underline">↗</a></li>)}
                        </ul>
                      )}
                    </div>
                    {purposeInfo.links.length > 0 && (
                      <div>
                        <h3 className="text-xs font-black text-slate-600">{t("visa.links.title")}</h3>
                        <ul className="mt-1 space-y-1.5">{sortLinks(purposeInfo.links).map((l) => <LinkRow key={l.url} l={l} />)}</ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {current.officialPortals.length > 0 && (
              <section aria-labelledby="visa-portals-h">
                <h2 id="visa-portals-h" className="text-base font-black text-slate-900">{t("visa.portals")}</h2>
                <ul className="mt-1 space-y-1.5">{sortLinks(current.officialPortals).map((l) => <LinkRow key={l.url} l={l} />)}</ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
