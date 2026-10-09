"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { navigateToMainHome } from "@/lib/navigation";
import { rememberRequestToken, requestToken } from "@/lib/service/client";
import { CustomerRequest } from "@/components/service/CustomerRequest";
import { MyRequests } from "@/components/service/MyRequests";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function CustomerChatContent() {
  const { t } = useLocale();
  const requestId = useSearchParams().get("r");
  // The request link carries its access token in the URL fragment (never sent to the server except as a header by our own fetches).
  // localStorage only remembers it for this browser; the server is the source of truth for the request and its messages.
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates from the server / browser cache after mount
    if (!requestId) return setReady(true);
    const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("t");
    const t64 = fromHash && /^[0-9a-f]{64}$/.test(fromHash) ? fromHash : null;
    if (t64) rememberRequestToken(requestId, t64);
    setToken(t64 ?? requestToken(requestId));
    setReady(true);
  }, [requestId]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <Link href="/" onClick={navigateToMainHome} className="flex items-center gap-2 text-base font-extrabold text-blue-800 hover:opacity-80 transition shrink-0" title="LIFE.HELP">
            <BrandLogo portal="chat" size="md" priority />
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/tech" className="droplet-btn border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100">🛠️ {t("svc.nav.helperPortal")}</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4">
        {!ready ? null : requestId && UUID.test(requestId) ? <CustomerRequest requestId={requestId} token={token} /> : <MyRequests />}
      </div>
    </main>
  );
}

export default function CustomerChatPage() {
  return (
    <Suspense fallback={null}>
      <CustomerChatContent />
    </Suspense>
  );
}
