"use client";

import { useEffect, useRef } from "react";

/** Enter runs the active primary action, including when a choice retains focus.
 * Links, ordinary buttons and text fields keep their own keyboard behavior.
 * Composition, held keys and duplicate presses cannot skip a step.
 */
export function useEnterToContinue(active: boolean, onEnter: () => void, activationKey?: string | number) {
  const handler = useRef(onEnter);
  useEffect(() => {
    handler.current = onEnter;
  });

  useEffect(() => {
    if (!active) return;
    let fired = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.isComposing || e.keyCode === 229 || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("button:not([role='radio']):not([role='checkbox']), a[href], input, textarea, select, [contenteditable='true']")) return;
      if (fired) return;
      fired = true;
      e.preventDefault();
      handler.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, activationKey]);
}
