"use client";

import { useState } from "react";
import motionBySkill from "@/lib/learn/content/motion-by-skill.json";

const MOTION = motionBySkill as Record<string, string[]>;

/** Up to six 10-second concept videos for the skills a math lesson teaches (ChatGPT's math motion set, mapped by docs/math-motion-skill-map.json; high/medium confidence only).
 *  Language-neutral chrome (poster + "10s"): the viewer page localizes the titles itself. */
export function LessonMotion({ skillIds, locale }: { skillIds: readonly string[]; locale: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const ids = [...new Set(skillIds.flatMap((s) => MOTION[s] ?? []))].slice(0, 6);
  if (ids.length === 0) return null;
  return (
    <section className="l-card l-stack" aria-labelledby="motion-h" data-testid="lesson-motion">
      <h2 id="motion-h" className="l-h2">🎬 10s</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ids.map((id) => (
          <button key={id} type="button" className="l-link" data-testid={`motion-${id}`} aria-label={`▶ 10s #${ids.indexOf(id) + 1}`} onClick={() => setOpen(id)}
            style={{ position: "relative", padding: 0, border: "2px solid currentColor", borderRadius: 12, overflow: "hidden", width: 132, background: "transparent", cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static poster from the motion asset set */}
            <img src={`/math-motion/posters/${id}-240.png`} alt="" width={132} height={74} loading="lazy" style={{ display: "block", width: "100%", height: "auto" }} />
            <span aria-hidden="true" style={{ position: "absolute", right: 6, bottom: 4, fontWeight: 800, background: "rgba(11,30,76,.85)", color: "#fff", borderRadius: 8, padding: "0 6px" }}>▶ 10s</span>
          </button>
        ))}
      </div>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="▶ 10s" data-testid="motion-dialog" style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <button type="button" onClick={() => setOpen(null)} aria-label="✕" data-testid="motion-close" style={{ alignSelf: "flex-end", fontSize: 28, color: "#fff", background: "transparent", border: 0, cursor: "pointer" }}>✕</button>
          <iframe title="▶ 10s" src={`/math-motion/index.html?lang=${encodeURIComponent(locale)}#${open}`} style={{ width: "min(960px,100%)", height: "min(80vh,720px)", border: 0, borderRadius: 12, background: "#fff" }} allow="fullscreen" />
        </div>
      )}
    </section>
  );
}
