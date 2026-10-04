"use client";

import { useEffect, useRef } from "react";

/**
 * While `active` (a "next question" button is on screen), pressing Enter does what that button does.
 *
 * It stays out of the way of the browser's own behaviour: when the focus is on a button, link or form field the native Enter already
 * acts there, so handling it again would run the action twice. Held-down (auto-repeat) Enter and IME composition are ignored, and the
 * action runs at most once per activation, so a quick double press cannot skip a question.
 */
export function useEnterToContinue(active: boolean, onEnter: () => void) {
  const handler = useRef(onEnter);
  useEffect(() => {
    handler.current = onEnter;
  });

  useEffect(() => {
    if (!active) return;
    let fired = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.isComposing || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("button, a[href], input, textarea, select, [contenteditable='true']")) return;
      if (fired) return;
      fired = true;
      e.preventDefault();
      handler.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}
