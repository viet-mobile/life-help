"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `tick` now and then every `ms` while the tab is visible (and immediately again when it becomes visible). The server is the
 * source of truth; this is how a second device sees changes without a reload. Errors are handed to `onError`, never thrown.
 */
export function usePoll(tick: () => Promise<void>, ms: number, enabled = true, onError?: (e: unknown) => void) {
  const latest = useRef({ tick, onError });
  useEffect(() => { latest.current = { tick, onError }; });
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    const run = async () => {
      if (stopped || running) return;
      running = true;
      try {
        if (document.visibilityState === "visible") await latest.current.tick();
      } catch (e) {
        latest.current.onError?.(e);
      } finally {
        running = false;
        if (!stopped) timer = setTimeout(run, ms);
      }
    };
    const onVisible = () => { if (document.visibilityState === "visible") { clearTimeout(timer); void run(); } };
    document.addEventListener("visibilitychange", onVisible);
    void run();
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [ms, enabled]);
}
