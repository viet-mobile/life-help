"use client";

import { useState } from "react";
import { useHelper } from "@/lib/helper/HelperContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { services } from "@/lib/services";
import { koreanRegions } from "@/lib/region/regions";
import { CANONICAL_SERVICE_SLUGS } from "@/lib/service/catalog";

interface HelperAuthCardProps {
  defaultTab?: "register" | "login";
  onSuccess?: () => void;
}

const ERROR_KEY: Record<string, string> = {
  RATE_LIMITED: "svc.auth.errRate",
  SERVICE_UNAVAILABLE: "svc.auth.errUnavailable",
  FORBIDDEN: "svc.auth.errCode",
  INVALID_INPUT: "svc.auth.errInput",
};

/**
 * Helper application + sign-in, both against the server. Applying creates a PENDING helper and the server issues the access code
 * (shown ONCE here; only its hash is stored). Nothing is emailed or generated in the browser, and a helper can take requests only
 * after staff approve them.
 */
export function HelperAuthCard({ defaultTab = "register", onSuccess }: HelperAuthCardProps) {
  const { locale, t } = useLocale();
  const { register, verifyAccessKey, refresh } = useHelper();

  const [tab, setTab] = useState<"register" | "login">(defaultTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [sido, setSido] = useState(koreanRegions[0]?.name ?? "");
  const [gungu, setGungu] = useState("");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canonical = services.filter((s) => CANONICAL_SERVICE_SLUGS.includes(s.slug));
  const gunguList = koreanRegions.find((s) => s.name === sido)?.gunguList ?? [];
  const fail = (errorCode: string) => setError(t(ERROR_KEY[errorCode] ?? "svc.auth.errGeneric"));

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || picked.length === 0) return setError(t("svc.auth.errInput"));
    setError("");
    setBusy(true);
    const res = await register({ name: name.trim(), email: email.trim() || undefined, primaryLocale: locale, services: picked, regions: [{ sido, gungu }] });
    setBusy(false);
    if (res.success) setIssued(res.credential);
    else fail(res.error);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const res = await verifyAccessKey(code);
    setBusy(false);
    if (res.success) onSuccess?.();
    else fail(res.error);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued ?? "");
      setCopied(true);
    } catch {
      /* the code is also on screen to copy by hand */
    }
  };

  if (issued) {
    return (
      <div className="droplet-card border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl text-white" data-testid="helper-code-card">
        <h2 className="text-xl font-black">🔑 {t("svc.auth.codeTitle")}</h2>
        <p className="mt-2 text-xs font-bold text-amber-300">{t("svc.auth.codeWarn")}</p>
        <p data-testid="helper-code" dir="ltr" className="mt-4 break-all rounded-xl border border-slate-700 bg-slate-800 p-4 text-center font-mono text-sm font-black tracking-wider select-all">{issued}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={copy} className="droplet-btn bg-slate-700 py-3 text-xs font-black cursor-pointer">{copied ? t("svc.auth.codeCopied") : t("svc.auth.codeCopy")}</button>
          <button type="button" data-testid="helper-code-saved" onClick={async () => { await refresh(); onSuccess?.(); }} className="droplet-btn bg-emerald-600 py-3 text-xs font-black cursor-pointer">{t("svc.auth.codeContinue")}</button>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">{t("svc.auth.pendingNote")}</p>
      </div>
    );
  }

  return (
    <div className="droplet-card border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-2xl text-white">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1">
        {(["register", "login"] as const).map((k) => (
          <button key={k} type="button" data-testid={`helper-tab-${k}`} onClick={() => { setTab(k); setError(""); }}
            className={`droplet-btn py-3 text-xs sm:text-sm font-black transition cursor-pointer ${tab === k ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
            {k === "register" ? `📝 ${t("svc.auth.tabRegister")}` : `🔑 ${t("svc.auth.tabLogin")}`}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-black">{tab === "register" ? t("svc.auth.registerTitle") : t("svc.auth.loginTitle")}</h2>
      <p className="mt-1 mb-4 text-xs text-slate-400">{tab === "register" ? t("svc.auth.registerDesc") : t("svc.auth.loginDesc")}</p>

      {error && <div role="alert" data-testid="helper-auth-error" className="mb-4 droplet-card bg-red-950/50 border border-red-800/80 p-3 text-xs font-bold text-red-200">⚠️ {error}</div>}

      {tab === "login" ? (
        <form onSubmit={submitLogin} className="space-y-4">
          <label className="block text-xs font-bold text-slate-300">{t("svc.auth.loginLabel")}
            <input data-testid="helper-code-input" required value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" spellCheck={false} dir="ltr"
              className="mt-1.5 w-full droplet-input border border-slate-700 bg-slate-800 p-4 text-center font-mono text-sm font-black text-white outline-none focus:border-blue-500" />
          </label>
          <button type="submit" disabled={busy} data-testid="helper-login-submit" className="w-full droplet-btn-lg bg-emerald-600 py-4 text-sm font-black text-white disabled:opacity-50 cursor-pointer">
            {busy ? t("svc.auth.working") : t("svc.auth.loginSubmit")}
          </button>
        </form>
      ) : (
        <form onSubmit={submitRegister} className="space-y-4">
          <label className="block text-xs font-bold text-slate-300">{t("svc.auth.name")}
            <input data-testid="helper-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full droplet-input border border-slate-700 bg-slate-800 p-3 text-sm text-white outline-none focus:border-blue-500" />
          </label>
          <label className="block text-xs font-bold text-slate-300">{t("svc.auth.email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
              className="mt-1.5 w-full droplet-input border border-slate-700 bg-slate-800 p-3 text-sm text-white outline-none focus:border-blue-500" />
          </label>
          <fieldset>
            <legend className="text-xs font-bold text-slate-300">{t("svc.auth.services")}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {canonical.map((s) => (
                <label key={s.slug} className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold cursor-pointer ${picked.includes(s.slug) ? "border-blue-500 bg-blue-950/40" : "border-slate-700 bg-slate-800/60"}`}>
                  <input type="checkbox" data-testid={`helper-service-${s.slug}`} checked={picked.includes(s.slug)}
                    onChange={() => setPicked((cur) => (cur.includes(s.slug) ? cur.filter((x) => x !== s.slug) : [...cur, s.slug]))} />
                  <span>{t(`service.${s.key}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="text-xs font-bold text-slate-300">{t("svc.auth.region")}</p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              <select data-testid="helper-sido" aria-label={t("svc.auth.region")} value={sido} onChange={(e) => { setSido(e.target.value); setGungu(""); }} className="droplet-input border border-slate-700 bg-slate-800 p-3 text-sm text-white">
                {koreanRegions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <select data-testid="helper-gungu" aria-label={t("svc.auth.region")} value={gungu} onChange={(e) => setGungu(e.target.value)} className="droplet-input border border-slate-700 bg-slate-800 p-3 text-sm text-white">
                <option value="">{t("svc.auth.wholeProvince")}</option>
                {gunguList.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={busy} data-testid="helper-register-submit" className="w-full droplet-btn-lg bg-blue-600 py-4 text-sm font-black text-white disabled:opacity-50 cursor-pointer">
            {busy ? t("svc.auth.working") : t("svc.auth.registerSubmit")}
          </button>
        </form>
      )}
    </div>
  );
}
