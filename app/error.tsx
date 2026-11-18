"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

/** Runtime error boundary for every page below the root layout: localized message, retry and a way home. */
export default function GlobalRouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLocale();
  const title = t("system.errorTitle");
  useEffect(() => {
    document.title = `${title} · LIFE.HELP`;
  }, [title]);
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main role="alert" className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-600">{t("system.errorDesc")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => retry()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-6 py-2 font-semibold text-white">
          {t("system.retry")}
        </button>
        <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-6 py-2 font-semibold text-slate-900">
          {t("system.goHome")}
        </a>
      </div>
    </main>
  );
}
