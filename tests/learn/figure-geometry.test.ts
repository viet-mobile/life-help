import { describe, expect, it } from "vitest";
import { F } from "@/scripts/learn/geometry/figures.mjs";

type Shape = { k: string; p?: number[]; c?: number[]; r?: number; t?: string; a0?: number; a1?: number };
const shapes = (f: { s: Shape[] }) => f.s;
const texts = (f: { s: Shape[] }) => shapes(f).filter((s) => s.k === "text").map((s) => ({ t: s.t!, x: s.p![0], y: s.p![1] }));
const lines = (f: { s: Shape[] }) => shapes(f).filter((s) => s.k === "line").map((s) => s.p!);
const ang = (cx: number, cy: number, x: number, y: number) => ((Math.atan2(-(y - cy), x - cx) * 180) / Math.PI + 360) % 360;
/** the four rays of two lines crossing at (cx, cy), as sorted math angles; returns the wedge (start, size) a point lies in */
function wedgeOf(rays: number[], a: number) {
  const r = [...rays].sort((x, y) => x - y);
  for (let i = 0; i < r.length; i++) {
    const lo = r[i], hi = r[(i + 1) % r.length] + (i + 1 === r.length ? 360 : 0), aa = a < lo ? a + 360 : a;
    if (aa >= lo && aa < hi) return { lo, size: hi - lo };
  }
  throw new Error("no wedge");
}
const poly = (f: { s: Shape[] }) => { const p = shapes(f).find((s) => s.k === "poly")!.p!; const out: number[][] = []; for (let i = 0; i < p.length; i += 2) out.push([p[i], p[i + 1]]); return out; };
const vAngle = (pts: number[][], i: number) => { const n = pts.length, c = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]; const v1 = [a[0] - c[0], a[1] - c[1]], v2 = [b[0] - c[0], b[1] - c[1]]; return (Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180) / Math.PI; };

describe("angle figures put the labels where the question says (real angle sizes, real relations)", () => {
  for (const deg of [40, 65, 70, 110]) {
    it(`crossing lines ${deg}°: adjacent unknown shares a ray (180-${deg}); vertical unknown is opposite (${deg})`, () => {
      for (const rel of ["adjacent", "vertical"] as const) {
        const f = F.cross(`${deg}°`, "x", deg, rel);
        const [l1, l2] = lines(f); // both pass through the same centre
        const cx = (l1[0] + l1[2]) / 2, cy = (l1[1] + l1[3]) / 2;
        expect(Math.hypot((l2[0] + l2[2]) / 2 - cx, (l2[1] + l2[3]) / 2 - cy)).toBeLessThan(0.5);
        const rays = [ang(cx, cy, l1[0], l1[1]), ang(cx, cy, l1[2], l1[3]), ang(cx, cy, l2[0], l2[1]), ang(cx, cy, l2[2], l2[3])];
        const t = texts(f), A = t.find((x) => x.t === `${deg}°`)!, X = t.find((x) => x.t === "x")!;
        const wa = wedgeOf(rays, ang(cx, cy, A.x, A.y)), wx = wedgeOf(rays, ang(cx, cy, X.x, X.y));
        expect(wa.size).toBeCloseTo(deg, 0);
        if (rel === "adjacent") { expect(wx.size).toBeCloseTo(180 - deg, 0); const shares = Math.abs(((wa.lo + wa.size) % 360) - wx.lo) < 1 || Math.abs(((wx.lo + wx.size) % 360) - wa.lo) < 1; expect(shares).toBe(true); }
        else { expect(wx.size).toBeCloseTo(deg, 0); expect(Math.abs(((wx.lo - wa.lo + 360) % 360) - (180 + 0))).toBeLessThan(1 + 0); } // opposite wedge starts 180° after
      }
    });
  }
  it("parallel lines: corresponding labels sit in the same wedge of the two intersections; alternate labels in alternate wedges", () => {
    for (const rel of ["corresponding", "alternate"] as const) {
      const deg = 55, f = F.parallel("55°", "x", rel, deg);
      const ls = lines(f), trans = ls.find((l) => Math.abs(l[1] - l[3]) > 20)!;
      const horiz = ls.filter((l) => Math.abs(l[1] - l[3]) < 1).sort((a, b) => a[1] - b[1]);
      const inter = (hl: number[]) => { const t = (hl[1] - trans[1]) / (trans[3] - trans[1]); return [trans[0] + t * (trans[2] - trans[0]), hl[1]]; };
      const [u, lo] = [inter(horiz[0]), inter(horiz[1])];
      const tAng = ang(u[0], u[1], trans[2], trans[3]);
      const rays = (c: number[]) => [0, 180, tAng, (tAng + 180) % 360].map((x) => x);
      const t = texts(f), A = t.find((x) => x.t === "55°")!, X = t.find((x) => x.t === "x")!;
      const wA = wedgeOf(rays(u), ang(u[0], u[1], A.x, A.y)), wX = wedgeOf(rays(lo), ang(lo[0], lo[1], X.x, X.y));
      expect(wA.size).toBeCloseTo(deg, 0); expect(wX.size).toBeCloseTo(deg, 0); // equal angles in both cases
      if (rel === "corresponding") expect(wA.lo).toBeCloseTo(wX.lo, 0); // same wedge position
      else expect(Math.abs(((wA.lo - wX.lo + 360) % 360) - 180)).toBeLessThan(1); // opposite wedge position = alternate (between the lines)
    }
  });
  it("triangle and quadrilateral angle figures are drawn with the labelled angles", () => {
    for (const [a, b, c] of [["50°", "60°", "x"], ["90°", "35°", "x"], ["45°", "45°", "x"], ["70°", "70°", "x"], ["35°", "35°", "x"]]) {
      const pts = poly(F.triAngles(a, b, c)), known = [a, b].map((s) => parseFloat(s));
      expect(vAngle(pts, 0)).toBeCloseTo(known[0], 0); expect(vAngle(pts, 1)).toBeCloseTo(known[1], 0); expect(vAngle(pts, 2)).toBeCloseTo(180 - known[0] - known[1], 0);
    }
    for (const q of [["90°", "90°", "70°", "x"], ["80°", "100°", "95°", "x"], ["120°", "60°", "100°", "x"]]) {
      const pts = poly(F.quadAngles(...q)), known = q.slice(0, 3).map((s) => parseFloat(s));
      known.forEach((k, i) => expect(vAngle(pts, i)).toBeCloseTo(k, 0)); expect(vAngle(pts, 3)).toBeCloseTo(360 - known.reduce((n, k) => n + k, 0), 0);
    }
  });
  it("parallelogram: the angle at A is drawn at its labelled size and angle B is its supplement", () => {
    for (const a of [65, 110]) { const pts = poly(F.paraAngle(a, `${a}°`, "x")); expect(vAngle(pts, 0)).toBeCloseTo(a, 0); expect(vAngle(pts, 1)).toBeCloseTo(180 - a, 0); }
  });
  it("sine/cosine-law triangles: the angle C between sides a and b is drawn at its size and the sides keep their ratio", () => {
    for (const [a, b, C] of [[5, 8, 60], [6, 8, 30], [10, 4, 90], [12, 5, 30]]) {
      const pts = poly(F.tri3({ C: `${C}°`, a: `${a}`, b: `${b}` }, { sas: [a, b, C] }));
      expect(vAngle(pts, 2)).toBeCloseTo(C, 0);
      const ca = Math.hypot(pts[0][0] - pts[2][0], pts[0][1] - pts[2][1]), cb = Math.hypot(pts[1][0] - pts[2][0], pts[1][1] - pts[2][1]);
      expect(cb / ca).toBeCloseTo(a / b, 1); // a = CB, b = CA
    }
  });
  it("circle angles: central angle AOB and the inscribed angle at C (half), and the cyclic quadrilateral's opposite angles add to 180", () => {
    for (const d of [100, 140]) {
      const f = F.inscribed(`${d}°`, "x", d), ls = lines(f);
      const [ac, cb] = ls; // A->C and C->B are the first two lines
      const A = [ac[0], ac[1]], C = [ac[2], ac[3]], B = [cb[2], cb[3]];
      expect(vAngle([A, C, B], 1)).toBeCloseTo(d / 2, 0); // the inscribed angle at C is half the central angle
      const arc = shapes(f).find((s) => s.k === "arc")!;
      expect(arc.a1! - arc.a0!).toBeCloseTo(d, 0); // the central angle arc at O
    }
    for (const a of [75, 100]) {
      const pts = poly(F.cyclic(`${a}°`, "x", a));
      expect(vAngle(pts, 0)).toBeCloseTo(a, 0); expect(vAngle(pts, 2)).toBeCloseTo(180 - a, 0);
    }
  });
});
