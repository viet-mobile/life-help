"use client";

import { useEffect, useState } from "react";
import { detectDeviceLocale, translate, languages, type Locale } from "@/messages";

/** Last resort when the root layout itself fails: own <html>/<body>, message in the device language (en fallback). */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    try { setLocale(detectDeviceLocale()); } catch { /* keep en */ }
  }, []);
  const title = translate(locale, "system.errorTitle");
  useEffect(() => {
    document.title = `${title} · LIFE.HELP`;
  }, [title]);
  const dir = languages.find((l) => l.code === locale)?.dir ?? "ltr";
  return (
    <html lang={locale} dir={dir}>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main role="alert" style={{ maxWidth: 480, margin: "0 auto", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
          <p style={{ margin: 0, color: "#475569" }}>{translate(locale, "system.errorDesc")}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" onClick={() => retry()} style={{ minHeight: 44, padding: "0 24px", borderRadius: 12, border: 0, background: "#0f172a", color: "#fff", fontWeight: 600 }}>{translate(locale, "system.retry")}</button>
            <a href="/" style={{ minHeight: 44, padding: "0 24px", borderRadius: 12, border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{translate(locale, "system.goHome")}</a>
          </div>
        </main>
      </body>
    </html>
  );
}
