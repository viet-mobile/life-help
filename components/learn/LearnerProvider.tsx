"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { learnConfig } from "@/lib/learn/config";
import { indexContent, type ContentIndex } from "@/lib/learn/content/indexer";
import { createInitialState } from "@/lib/learn/domain/engine";
import { createTranslator, type Translator } from "@/lib/learn/i18n";
import type { MetaBundle, PlayerState, Site } from "@/lib/learn/types";

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

interface SiteCtx {
  site: Site;
  /** "" on the site's own subdomain, "/study/<site>" when reached by path (local/dev). */
  base: string;
  t: Translator;
  href: (path: string) => string;
}
const SiteContext = createContext<SiteCtx | null>(null);

export function SiteProvider({ site, base, children }: { site: Site; base: string; children: ReactNode }) {
  const value = useMemo(() => ({ site, base, t: createTranslator("ko"), href: (path: string) => `${base}${path}` }), [site, base]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
export function useSite(): SiteCtx {
  const v = useContext(SiteContext);
  if (!v) throw new Error("SiteProvider missing");
  return v;
}

interface LearnerCtx extends SiteCtx {
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

export function LearnerProvider({
  meta,
  initialState,
  accountsEnabled,
  children,
}: {
  meta: MetaBundle;
  /** Present for signed-in students (server-loaded); null means guest/demo mode. */
  initialState: PlayerState | null;
  accountsEnabled: boolean;
  children: ReactNode;
}) {
  const { site, base, t, href } = useSite();
  const router = useRouter();
  const pathname = usePathname();
  const mode = initialState ? "account" : "guest";
  const index = useMemo(() => indexContent(meta), [meta]);
  const [state, setStateRaw] = useState<PlayerState>(initialState ?? createInitialState(site));
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
      const payload: Record<string, unknown> = { ...body, site };
      if (mode === "guest") payload.state = stateRef.current;
      let res: Response;
      try {
        res = await fetch(`/api/learn/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        throw new ApiError("network", 0);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new ApiError(String(data?.error ?? "error"), res.status);
      // Only adopt state after a fully successful response: a failed request never alters progress.
      if (data.state) adopt(data.state as PlayerState);
      return data as T & { state?: PlayerState };
    },
    [mode, site, adopt],
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
    if (ready && !state.profile && !pathname.endsWith("/onboarding")) router.replace(href("/onboarding"));
  }, [ready, state.profile, pathname, router, href]);

  const value = useMemo<LearnerCtx>(
    () => ({ site, base, t, mode, accountsEnabled, ready, state, index, api, href, resetGuest }),
    [site, base, t, mode, accountsEnabled, ready, state, index, api, href, resetGuest],
  );
  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}
