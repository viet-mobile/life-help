"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { learnConfig } from "@/lib/learn/config";
import { indexContent, scopeToGrade, type ContentIndex } from "@/lib/learn/content/indexer";
import { createInitialState } from "@/lib/learn/domain/engine";
import { createTranslator, type LearnLocale, type Messages, type Translator } from "@/lib/learn/i18n";
import { FREE_ACCESS, buildAccessPlan, type Access, type AccessPlan } from "@/lib/learn/domain/access";
import type { MetaBundle, PlayerState, Site } from "@/lib/learn/types";

import { JournalSender } from "@/components/learn/JournalSender";

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

interface SiteCtx {
  site: Site;
  /** "" on the site's own subdomain, "/study/<site>" when reached by path (local/dev). */
  base: string;
  /** The learner's language for this page (cookie, resolved on the server). */
  locale: LearnLocale;
  t: Translator;
  href: (path: string) => string;
}
const SiteContext = createContext<SiteCtx | null>(null);

export function SiteProvider({ site, base, locale, messages, children }: { site: Site; base: string; locale: LearnLocale; messages: Messages; children: ReactNode }) {
  // `messages` is the server-resolved dictionary of this locale only (never the whole catalogue in the browser bundle).
  const value = useMemo(() => ({ site, base, locale, t: createTranslator(messages), href: (path: string) => `${base}${path}` }), [site, base, locale, messages]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
export function useSite(): SiteCtx {
  const v = useContext(SiteContext);
  if (!v) throw new Error("SiteProvider missing");
  return v;
}

interface LearnerCtx extends SiteCtx {
  /** Free / Premium as decided by the server for this page (display only: every payload is authorised again on the server). */
  access: Access;
  plan: AccessPlan;
  mode: "guest" | "account";
  accountsEnabled: boolean;
  ready: boolean;
  state: PlayerState;
  index: ContentIndex;
  /** POST to the learning API. Guest state is attached automatically; the returned state is adopted. */
  api: <T extends object>(action: string, body?: Record<string, unknown>) => Promise<T & { state?: PlayerState }>;
  resetGuest: () => void;
}
const LearnerContext = createContext<LearnerCtx | null>(null);
export function useLearner(): LearnerCtx {
  const v = useContext(LearnerContext);
  if (!v) throw new Error("LearnerProvider missing");
  return v;
}

function loadGuest(site: Site): PlayerState {
  try {
    const raw = window.localStorage.getItem(`${learnConfig.guestStorageKey}:${site}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.site === site) return parsed as PlayerState;
    }
  } catch {
    /* storage unavailable: fall back to a fresh state */
  }
  return createInitialState(site);
}

const IDEMPOTENT_ACTIONS = ["hint", "reveal", "cards", "state"];
/** Actions whose caller already shows its own error panel; everything else gets the common toast. */
const OWN_ERROR_UI = ["attempt", "onboard"];
function notifyApiFailure(action: string) {
  if (typeof window !== "undefined" && !OWN_ERROR_UI.includes(action)) window.dispatchEvent(new CustomEvent("learn:api-error", { detail: action }));
}

/** Common error toast: a failed server call (network down, 5xx) tells the learner once, politely, that progress is safe and to try again. */
function ApiErrorToast({ message, closeLabel }: { message: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const show = () => { setOpen(true); window.clearTimeout(timer); timer = window.setTimeout(() => setOpen(false), 8000); };
    window.addEventListener("learn:api-error", show);
    return () => { window.removeEventListener("learn:api-error", show); window.clearTimeout(timer); };
  }, []);
  if (!open) return null;
  return (
    <div role="alert" className="l-toast">
      <span>{message}</span>
      <button type="button" className="l-link" onClick={() => setOpen(false)}>{closeLabel}</button>
    </div>
  );
}

export function LearnerProvider({
  meta,
  initialState,
  accountsEnabled,
  access = FREE_ACCESS,
  children,
}: {
  access?: Access;
  meta: MetaBundle;
  /** Present for signed-in students (server-loaded); null means guest/demo mode. */
  initialState: PlayerState | null;
  accountsEnabled: boolean;
  children: ReactNode;
}) {
  const { site, base, locale, t, href } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const mode = initialState ? "account" : "guest";
  const [state, setStateRaw] = useState<PlayerState>(initialState ?? createInitialState(site));
  // The curriculum is scoped to the student's grade with the same pure function the server uses (middle / high: the secondary courses,
  // exactly as before; elementary: only that grade's course). Before onboarding there is no grade yet and the secondary default applies.
  const grade = state.profile?.grade ?? "M1";
  const index = useMemo(() => indexContent(scopeToGrade(meta, grade)), [meta, grade]);
  const [ready, setReady] = useState(mode === "account");
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydration-safe load: guest progress lives in localStorage, which the server render cannot see.
  useEffect(() => {
    if (mode === "guest") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStateRaw(loadGuest(site));
      setReady(true);
    }
  }, [mode, site]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialState) setStateRaw(initialState);
  }, [initialState]);

  const adopt = useCallback(
    (next: PlayerState) => {
      stateRef.current = next; // visible to the very next API call, before React re-renders
      setStateRaw(next);
      if (mode === "guest") {
        try {
          window.localStorage.setItem(`${learnConfig.guestStorageKey}:${site}`, JSON.stringify(next));
        } catch {
          /* private mode: progress simply won't persist on this device */
        }
      }
    },
    [mode, site],
  );

  const api = useCallback(
    async <T extends object>(action: string, body: Record<string, unknown> = {}): Promise<T & { state?: PlayerState }> => {
      // API URLs have no /<locale> prefix: send the page's resolved presentation language explicitly.
      const payload: Record<string, unknown> = { ...body, site, locale };
      if (mode === "guest") payload.state = stateRef.current;
      // Read-only actions are safe to repeat: one automatic retry with a short backoff on a network failure or 5xx.
      const attempts = IDEMPOTENT_ACTIONS.includes(action) ? 2 : 1;
      let res: Response | null = null;
      for (let i = 0; i < attempts; i++) {
        try {
          res = await fetch(`/api/learn/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          res = null;
        }
        if (res && res.status < 500) break;
        if (i + 1 < attempts) await new Promise((r) => setTimeout(r, 600));
      }
      if (!res) {
        notifyApiFailure(action);
        throw new ApiError("network", 0);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status >= 500) notifyApiFailure(action);
        throw new ApiError(String(data?.error ?? "error"), res.status);
      }
      // Only adopt state after a fully successful response: a failed request never alters progress.
      if (data.state) adopt(data.state as PlayerState);
      if (["start", "attempt", "complete", "cards", "diagnostic"].includes(action)) window.dispatchEvent(new CustomEvent("jiu-activity", { detail: action }));
      return data as T & { state?: PlayerState };
    },
    [mode, site, locale, adopt],
  );

  const resetGuest = useCallback(() => {
    try {
      window.localStorage.removeItem(`${learnConfig.guestStorageKey}:${site}`);
    } catch {
      /* ignore */
    }
    setStateRaw(createInitialState(site));
    router.replace(href("/"));
  }, [site, router, href]);

  // New students go through onboarding first.
  useEffect(() => {
    if (ready && !state.profile && !pathname.endsWith("/onboarding")) {
      // keep the deep link: after onboarding the learner returns to the page they asked for (validated again by safeReturnTo)
      const inner = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
      const back = safeReturnTo(inner);
      router.replace(href("/onboarding") + (back && back !== "/" ? `?returnTo=${encodeURIComponent(back)}` : ""));
    }
  }, [ready, state.profile, pathname, router, href, base]);

  const toastMsg = t("lesson.error");
  const toastClose = t("common.close");
  const plan = useMemo(() => buildAccessPlan(meta.catalog, meta.questions), [meta]);
  const value = useMemo<LearnerCtx>(
    () => ({ site, base, locale, t, mode, accountsEnabled, ready, state, index, api, href, resetGuest, access, plan }),
    [site, base, locale, t, mode, accountsEnabled, ready, state, index, api, href, resetGuest, access, plan],
  );
  return <LearnerContext.Provider value={value}><JournalSender site={site} />{children}<ApiErrorToast message={toastMsg} closeLabel={toastClose} /></LearnerContext.Provider>;
}

/** A same-site, in-app path ("/learn/..."): never a URL, protocol-relative or backslash form, and never the onboarding page itself. */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || value.length > 200 || !value.startsWith("/") || value.startsWith("//") || /[\\:\s\u0000-\u001f]/.test(value)) return null;
  if (value.startsWith("/onboarding") || value.startsWith("/api")) return null;
  return value;
}
