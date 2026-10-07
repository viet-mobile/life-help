"use client";

import { useEffect, useState } from "react";

type Segment = { kind: "text" | "math" | "bold"; value: string };

/** Split "text $x^2$ **bold**" into segments. `$...$` is inline KaTeX, `**...**` is emphasis. */
export function parseRich(input: string): Segment[] {
  const out: Segment[] = [];
  const re = /\$([^$]+)\$|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) out.push({ kind: "text", value: input.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "math", value: m[1] });
    else out.push({ kind: "bold", value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ kind: "text", value: input.slice(last) });
  return out;
}

type Katex = typeof import("katex");
let katexPromise: Promise<Katex> | null = null;
const loadKatex = () => (katexPromise ??= import("katex").then((m) => (m as unknown as { default: Katex }).default ?? m));

/**
 * Renders inline math with KaTeX (loaded lazily, only when a `$` appears) and
 * keeps the MathML output so screen readers can read formulas.
 */
export function RichText({ text, display = false, className, dir }: { text: string; display?: boolean; className?: string; dir?: "auto" | "ltr" | "rtl" }) {
  const segments = parseRich(text);
  const hasMath = segments.some((s) => s.kind === "math");
  const [katex, setKatex] = useState<Katex | null>(null);

  useEffect(() => {
    if (hasMath) loadKatex().then(setKatex);
  }, [hasMath]);

  return (
    <span className={className} dir={dir}>
      {segments.map((s, i) => {
        if (s.kind === "bold") return <strong key={i}>{s.value}</strong>;
        if (s.kind === "text") return <span key={i}>{s.value}</span>;
        // formulas always read left to right, also inside a right-to-left (ar, fa, he, ur) page
        if (!katex) return <span key={i} className="l-math-fallback" dir="ltr">{s.value}</span>;
        const html = katex.renderToString(s.value, { throwOnError: false, displayMode: display, output: "htmlAndMathml", trust: false });
        return <span key={i} className="l-math" dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}

/** Display-mode LaTeX block for a question's `latex` field. */
export function MathBlock({ latex }: { latex: string }) {
  return (
    <div className="l-mathblock" dir="ltr">
      <RichText text={`$${latex}$`} display />
    </div>
  );
}
