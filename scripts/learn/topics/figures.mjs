// Chart / table / number-line figures for the data, number and elective lessons. Same drawing model as the geometry figures
// (lib/learn/types.ts Figure): coordinates in a w x h box, labels = numerals, letters and a few symbols only.
import { F } from "../geometry/figures.mjs";

const W = 260, H = 170;
const T = (x, y, t, a) => (String(t) === "" ? null : { k: "text", p: [Math.round(x), Math.round(y)], t: String(t), ...(a ? { a } : {}) });
const P = (pts, f) => ({ k: "poly", p: pts.flat().map((n) => Math.round(n * 10) / 10), ...(f ? { f } : {}) });
const L = (x1, y1, x2, y2, d) => ({ k: "line", p: [x1, y1, x2, y2].map((n) => Math.round(n * 10) / 10), ...(d ? { d: true } : {}) });
const C = (x, y, r, f) => ({ k: "circle", c: [Math.round(x * 10) / 10, Math.round(y * 10) / 10], r, ...(f ? { f } : {}) });
const fig = (s, w = W, h = H) => ({ w, h, s: s.filter(Boolean) });
const rad = (d) => (d * Math.PI) / 180;

export const G = {
  ...F,
  /** table: rows of strings, first row is the header; every cell is a short label */
  table(rows, colW = 52) {
    const rowH = 28, w = Math.min(W, 20 + colW * rows[0].length), x0 = 10, y0 = 12, s = [];
    const tw = colW * rows[0].length, th = rowH * rows.length;
    s.push(P([[x0, y0], [x0 + tw, y0], [x0 + tw, y0 + th], [x0, y0 + th]]));
    rows.forEach((r, i) => {
      if (i > 0) s.push(L(x0, y0 + i * rowH, x0 + tw, y0 + i * rowH));
      r.forEach((cell, j) => {
        if (i === 0 && j > 0) s.push(L(x0 + j * colW, y0, x0 + j * colW, y0 + th));
        if (i > 0 && j > 0) s.push(L(x0 + j * colW, y0, x0 + j * colW, y0 + th));
        s.push(T(x0 + j * colW + colW / 2, y0 + i * rowH + 19, cell));
      });
    });
    return fig(s, Math.max(w, tw + 20), th + 24);
  },
  /** symbol graph: columns of stacked circles, one column per category letter */
  symbols(cats) {
    const s = [], gx = 48, base = 140;
    cats.forEach(([name, n], i) => {
      const x = 40 + i * gx;
      s.push(T(x, base + 18, name));
      for (let k = 0; k < n; k++) s.push(C(x, base - 10 - k * 18, 7, 1));
    });
    s.push(L(14, base, 40 + cats.length * gx - 10, base));
    return fig(s, 60 + cats.length * gx, 165);
  },
  /** bar chart with value labels on the bars */
  bars(data, o = {}) {
    const max = Math.max(...data.map((d) => d[1])), top = 20, base = 140, bw = 26, gap = 14, left = 28;
    const k = (base - top - 12) / max, s = [L(left - 6, base, left + data.length * (bw + gap), base), L(left - 6, top, left - 6, base)];
    data.forEach(([name, v], i) => {
      const x = left + i * (bw + gap);
      s.push(P([[x, base], [x + bw, base], [x + bw, base - v * k], [x, base - v * k]], 1), T(x + bw / 2, base + 16, name));
      if (o.values !== false) s.push(T(x + bw / 2, base - v * k - 5, v));
    });
    return fig(s, left + data.length * (bw + gap) + 16, 165);
  },
  /** line graph (polyline with markers) over category labels; value labels optional */
  line(data, o = {}) {
    const max = Math.max(...data.map((d) => d[1])), min = Math.min(0, ...data.map((d) => d[1])), top = 22, base = 138, left = 34, step = 38;
    const k = (base - top - 10) / (max - min || 1);
    const pts = data.map(([name, v], i) => [left + i * step, base - (v - min) * k, name, v]);
    const s = [L(left - 12, base, left + (data.length - 1) * step + 14, base), L(left - 12, top - 8, left - 12, base)];
    for (let i = 0; i < pts.length - 1; i++) s.push(L(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
    pts.forEach(([x, y, name, v]) => { s.push(C(x, y, 3.5, 3), T(x, base + 16, name)); if (o.values !== false) s.push(T(x, y - 8, v)); });
    return fig(s, left + (data.length - 1) * step + 30, 165);
  },
  /** pie chart: [[letter, percent]]; labels carry letter and percent */
  pie(parts, hide = []) {
    const cx = 110, cy = 85, R = 62, s = [C(cx, cy, R)];
    let a = 90;
    for (const [name, pct] of parts) {
      const a2 = a - (pct / 100) * 360;
      s.push(L(cx, cy, cx + R * Math.cos(rad(a)), cy - R * Math.sin(rad(a))));
      const mid = rad((a + a2) / 2);
      s.push(T(cx + (R * 0.62) * Math.cos(mid), cy - (R * 0.62) * Math.sin(mid) + 5, `${name}${hide.includes(name) ? "" : ` ${pct}%`}`));
      a = a2;
    }
    return fig(s, 220, 170);
  },
  /** band graph: one bar split into parts [[letter, percent]] */
  band(parts) {
    const x0 = 14, w = 232, y = 60, h = 38, s = [];
    let x = x0;
    parts.forEach(([name, pct], i) => {
      const pw = (w * pct) / 100;
      s.push(P([[x, y], [x + pw, y], [x + pw, y + h], [x, y + h]], (i % 3) + 1), T(x + pw / 2, y + h / 2 + 5, name), T(x + pw / 2, y + h + 18, `${pct}%`));
      x += pw;
    });
    return fig(s, 260, 130);
  },
  /** number line with integer marks from lo to hi and labelled points [[letter, value]] */
  numberLine(lo, hi, points = []) {
    const x0 = 24, x1 = 236, y = 90, step = (x1 - x0) / (hi - lo), s = [L(10, y, 250, y)];
    for (let v = lo; v <= hi; v++) { s.push(L(x0 + (v - lo) * step, y - 5, x0 + (v - lo) * step, y + 5), T(x0 + (v - lo) * step, y + 22, v)); }
    for (const [name, v] of points) s.push(C(x0 + (v - lo) * step, y, 5, 3), T(x0 + (v - lo) * step, y - 14, name));
    return fig(s, 260, 130);
  },
  /** coordinate plane with numbered ticks; box = [xmin, xmax, ymin, ymax] the grid must show; points [[name,x,y]], segments [[x1,y1,x2,y2,dashed]] */
  plane(points = [], segments = [], o = {}) {
    const w = 260, h = 170, s = [];
    const [bx0, bx1, by0, by1] = o.box ?? [-1, 5, -1, 4];
    const xs = [bx0, bx1, 0], ys = [by0, by1, 0];
    for (const [, x, y] of points) { xs.push(x); ys.push(y); }
    for (const [x1, y1, x2, y2] of segments) { xs.push(x1, x2); ys.push(y1, y2); }
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const u = Math.min(30, (w - 50) / (xmax - xmin + 1), (h - 40) / (ymax - ymin + 1));
    const ox = 22 + (0 - xmin) * u + 8, oy = h - 20 - (0 - ymin) * u;
    s.push(L(8, oy, w - 8, oy), L(ox, h - 8, ox, 8), T(w - 12, oy - 6, "x"), T(ox + 10, 16, "y"), T(ox - 7, oy - 6, "O", "e"));
    for (let x = Math.ceil(xmin); x <= xmax; x++) if (x !== 0) { s.push(L(ox + x * u, oy - 3, ox + x * u, oy + 3)); if (u >= 15 || x % 2 === 0) s.push(T(ox + x * u, oy + 15, x)); }
    for (let y = Math.ceil(ymin); y <= ymax; y++) if (y !== 0) { s.push(L(ox - 3, oy - y * u, ox + 3, oy - y * u)); if (u >= 15 || y % 2 === 0) s.push(T(ox - 8, oy - y * u + 5, y, "e")); }
    for (const [x1, y1, x2, y2, d] of segments) s.push(L(ox + x1 * u, oy - y1 * u, ox + x2 * u, oy - y2 * u, d));
    for (const [name, x, y] of points) { s.push(C(ox + x * u, oy - y * u, 3.5, 3)); s.push(T(ox + x * u + 8, oy - y * u - 8, name, "s")); }
    return fig(s, w, h);
  },
  /** two straight lines y = a x + b drawn on an auto-fitted plane, intersection marked */
  lines(l1, l2, cross) {
    const u = 22, ox = 46, oy = 128, X0 = -1, X1 = 6, YMAX = 5.4;
    const s = [L(8, oy, 252, oy), L(ox, 164, ox, 8), T(246, oy - 6, "x"), T(ox + 12, 16, "y"), T(ox - 7, oy - 6, "O", "e")];
    for (let x = 1; x <= 6; x++) s.push(L(ox + x * u, oy - 3, ox + x * u, oy + 3), T(ox + x * u, oy + 15, x));
    for (let y = 1; y <= 5; y++) s.push(L(ox - 3, oy - y * u, ox + 3, oy - y * u), T(ox - 8, oy - y * u + 5, y, "e"));
    const draw = (m, b) => {
      let x0 = X0, x1 = X1;
      if (m !== 0) { const a = (0 - b) / m, c = (YMAX - b) / m; const lo = Math.min(a, c), hi = Math.max(a, c); x0 = Math.max(x0, lo); x1 = Math.min(x1, hi); }
      return x1 > x0 ? L(ox + x0 * u, oy - (m * x0 + b) * u, ox + x1 * u, oy - (m * x1 + b) * u) : null;
    };
    s.push(draw(...l1), draw(...l2));
    if (cross) s.push(C(ox + cross[0] * u, oy - cross[1] * u, 4, 3), T(ox + cross[0] * u + 8, oy - cross[1] * u - 8, "P", "s"));
    return fig(s, 260, 170);
  },
  /** supply and demand lines: price on y, quantity on x; equilibrium E */
  market(demand, supply) {
    return G.lines(demand, supply, null);
  },
};
