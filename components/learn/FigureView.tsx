import type { Figure, FigureShape } from "@/lib/learn/types";

const clamp = (n: number, lo = -2000, hi = 2000) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0);
const FILL = { 1: "var(--l-fig-1, #dbeafe)", 2: "var(--l-fig-2, #fde68a)", 3: "var(--l-fig-3, #bbf7d0)" } as const;

function pts(p: number[]): string {
  const out: string[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) out.push(`${clamp(p[i])},${clamp(p[i + 1])}`);
  return out.join(" ");
}
const rad = (d: number) => (d * Math.PI) / 180;

function Shape({ s }: { s: FigureShape }) {
  switch (s.k) {
    case "poly":
      return <polygon points={pts(s.p)} fill={s.f ? FILL[s.f] : "none"} strokeDasharray={s.d ? "5 4" : undefined} />;
    case "line":
      return <line x1={clamp(s.p[0])} y1={clamp(s.p[1])} x2={clamp(s.p[2])} y2={clamp(s.p[3])} strokeDasharray={s.d ? "5 4" : undefined} markerEnd={s.m ? "url(#fig-arrow)" : undefined} />;
    case "circle":
      return <circle cx={clamp(s.c[0])} cy={clamp(s.c[1])} r={clamp(s.r, 0, 1000)} fill={s.f ? FILL[s.f] : "none"} />;
    case "ellipse":
      return <ellipse cx={clamp(s.c[0])} cy={clamp(s.c[1])} rx={clamp(s.rx, 0, 1000)} ry={clamp(s.ry, 0, 1000)} fill={s.f ? FILL[s.f] : "none"} strokeDasharray={s.d ? "5 4" : undefined} />;
    case "arc": {
      const [cx, cy] = s.c;
      const x0 = cx + s.r * Math.cos(rad(s.a0));
      const y0 = cy - s.r * Math.sin(rad(s.a0));
      const x1 = cx + s.r * Math.cos(rad(s.a1));
      const y1 = cy - s.r * Math.sin(rad(s.a1));
      const large = Math.abs(s.a1 - s.a0) > 180 ? 1 : 0;
      return <path d={`M ${clamp(x0)} ${clamp(y0)} A ${clamp(s.r, 0, 1000)} ${clamp(s.r, 0, 1000)} 0 ${large} 0 ${clamp(x1)} ${clamp(y1)}`} fill="none" />;
    }
    case "text":
      return (
        <text x={clamp(s.p[0])} y={clamp(s.p[1])} textAnchor={s.a === "s" ? "start" : s.a === "e" ? "end" : "middle"} stroke="var(--l-card, #fff)" strokeWidth="4" strokeLinejoin="round" paintOrder="stroke" fill="currentColor" fontSize="14" fontWeight="700">
          {s.t}
        </text>
      );
  }
}

/** Renders a language-neutral figure (see FigureShape). Drawing data only: no HTML, no scripts. */
export function FigureView({ figure, label }: { figure: Figure; label: string }) {
  const w = clamp(figure.w, 20, 600);
  const h = clamp(figure.h, 20, 600);
  return (
    <svg className="l-figure" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ width: "100%", maxWidth: Math.min(w * 1.6, 420), height: "auto", display: "block", margin: "8px auto" }}>
      <defs>
        <marker id="fig-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none">
        {figure.s.slice(0, 80).map((s, i) => (
          <Shape key={i} s={s} />
        ))}
      </g>
    </svg>
  );
}
