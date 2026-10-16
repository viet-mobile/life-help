"use client";

import { useEffect, useRef } from "react";

/** A tick that has not settled after this long is abandoned (its late result is ignored) so one stuck request can never end the loop. */
export const POLL_TICK_TIMEOUT_MS = 20_000;
/** When the tab comes back, a tick that has already been waiting this long is abandoned and replaced right away. */
export const POLL_STALE_ON_VISIBLE_MS = 10_000;

/**
 * Runs `tick` now and then every `ms` while the tab is visible (and immediately again when it becomes visible). The server is the
 * source of truth; this is how a second device sees changes without a reload. Errors are handed to `onError`, never thrown.
 *
 * Ticks never overlap while they are healthy, but a tick that hangs (a request that neither completes nor fails) is given up on after
 * POLL_TICK_TIMEOUT_MS - reported to `onError` as a "poll_timeout" error - and the loop goes on. Without this, one stalled request kept
 * `running` true forever: no timer, no visibility change and no later tick could start, and only a reload brought the updates back.
 */
export function usePoll(tick: () => Promise<void>, ms: number, enabled = true, onError?: (e: unknown) => void) {
  const latest = useRef({ tick, onError });
  useEffect(() => { latest.current = { tick, onError }; });
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;          // identifies the tick that currently owns the loop
    let running = false;
    let startedAt = 0;
    const schedule = () => { clearTimeout(timer); if (!stopped) timer = setTimeout(run, ms); };
    const settle = (gen: number, error?: unknown, failed = false) => {
      if (gen !== generation) return; // a tick that was already abandoned: its late result changes nothing
      clearTimeout(watchdog);
      running = false;
      if (failed) latest.current.onError?.(error);
      schedule();
    };
    const run = () => {
      if (stopped || running) return;
      if (document.visibilityState !== "visible") { schedule(); return; }
      const gen = ++generation;
      running = true;
      startedAt = Date.now();
      watchdog = setTimeout(() => settle(gen, Object.assign(new Error("poll_timeout"), { code: "poll_timeout", status: 0 }), true), POLL_TICK_TIMEOUT_MS);
      let p: Promise<void>;
      try { p = Promise.resolve(latest.current.tick()); } catch (e) { p = Promise.reject(e); }
      p.then(() => settle(gen), (e) => settle(gen, e, true));
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (running && Date.now() - startedAt >= POLL_STALE_ON_VISIBLE_MS) { generation++; running = false; clearTimeout(watchdog); } // abandon the stale tick
      clearTimeout(timer);
      run();
    };
    document.addEventListener("visibilitychange", onVisible);
    run();
    return () => { stopped = true; generation++; clearTimeout(timer); clearTimeout(watchdog); document.removeEventListener("visibilitychange", onVisible); };
  }, [ms, enabled]);
}
