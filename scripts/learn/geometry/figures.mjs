// Figure builders for the geometry lessons. Output is the language-neutral Figure of lib/learn/types.ts (drawing data only).
// Coordinates: x right, y DOWN, viewBox 0 0 w h. Labels contain only numerals / letters / units.
const W = 260, H = 170;
const T = (x, y, t, a) => (String(t) === "" ? null : { k: "text", p: [Math.round(x), Math.round(y)], t: String(t), ...(a ? { a } : {}) });
const P = (pts, f, d) => ({ k: "poly", p: pts.flat().map((n) => Math.round(n * 10) / 10), ...(f ? { f } : {}), ...(d ? { d: true } : {}) });
const L = (x1, y1, x2, y2, d, m) => ({ k: "line", p: [x1, y1, x2, y2].map((n) => Math.round(n * 10) / 10), ...(d ? { d: true } : {}), ...(m ? { m: "a" } : {}) });
const C = (x, y, r, f) => ({ k: "circle", c: [Math.round(x), Math.round(y)], r: Math.round(r * 10) / 10, ...(f ? { f } : {}) });
const E = (x, y, rx, ry, f, d) => ({ k: "ellipse", c: [Math.round(x), Math.round(y)], rx: Math.round(rx * 10) / 10, ry: Math.round(ry * 10) / 10, ...(f ? { f } : {}), ...(d ? { d: true } : {}) });
const A = (x, y, r, a0, a1) => ({ k: "arc", c: [Math.round(x), Math.round(y)], r, a0, a1 });
const fig = (s, w = W, h = H) => ({ w, h, s: s.filter(Boolean) });
const sq = (x, y, n = 9) => [P([[x, y], [x + n, y], [x + n, y - n], [x, y - n]])]; // right-angle mark at (x,y) opening up-right
const rad = (d) => (d * Math.PI) / 180;
/** scale so that a w x h shape fits in a box */
const fit = (w, h, bw = 170, bh = 105) => Math.min(bw / w, bh / h);

const deg = (r) => (r * 180) / Math.PI;
const numOf = (t) => { const m = /^(-?\d+(?:\.\d+)?)(?:°|cm)?$/.exec(String(t).trim()); return m ? Number(m[1]) : null; };
/** fit polygon vertices into a box, centred at (cx, cy) */
function fitPoly(pts, bw = 190, bh = 105, cx = 130, cy = 85) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(bw / Math.max(1e-9, x1 - x0), bh / Math.max(1e-9, y1 - y0));
  return pts.map(([x, y]) => [cx + (x - (x0 + x1) / 2) * k, cy + (y - (y0 + y1) / 2) * k]);
}
/** interior angle (degrees) of a polygon vertex i (any orientation) */
function vertexAngle(pts, i) {
  const n = pts.length, p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
  const v1 = [a[0] - p[0], a[1] - p[1]], v2 = [b[0] - p[0], b[1] - p[1]];
  return deg(Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))));
}
/** unit direction (screen coords) of the interior bisector at vertex i */
function bisector(pts, i) {
  const n = pts.length, p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
  const u = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
  const ua = u(a), ub = u(b), m = [ua[0] + ub[0], ua[1] + ub[1]], d = Math.hypot(...m) || 1;
  return [m[0] / d, m[1] / d];
}
/** angle arc at vertex i of `pts` between its two sides (screen y down), radius r, as an Arc shape in the math-angle convention of A() */
function cornerArc(pts, i, r = 16) {
  const n = pts.length, p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
  const ang = (q) => (deg(Math.atan2(-(q[1] - p[1]), q[0] - p[0])) + 360) % 360;
  let a0 = ang(a), a1 = ang(b);
  // the arc runs counter-clockwise from a0 to a1; pick the order that spans the interior angle (< 180 for convex corners)
  const span = (a1 - a0 + 360) % 360;
  if (span > 180) [a0, a1] = [a1, a0];
  if (a1 < a0) a1 += 360;
  return A(p[0], p[1], r, a0, a1);
}
const squareAt = (pts, i, n = 9) => {
  const len = pts.length, p = pts[i], a = pts[(i + len - 1) % len], b = pts[(i + 1) % len];
  const u = (q) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / d, (q[1] - p[1]) / d]; };
  const ua = u(a), ub = u(b);
  return P([[p[0], p[1]], [p[0] + ua[0] * n, p[1] + ua[1] * n], [p[0] + (ua[0] + ub[0]) * n, p[1] + (ua[1] + ub[1]) * n], [p[0] + ub[0] * n, p[1] + ub[1] * n]]);
};
/** vertex letters outside the corners + the optional angle labels inside (strings; "" skips) */
function marks(pts, names, angleLabels, inner0 = 30, outer = 13) {
  const s = [];
  pts.forEach((p, i) => {
    const b = bisector(pts, i);
    const inner = inner0 + Math.max(0, 50 - vertexAngle(pts, i)) * 0.45; // a narrow wedge pushes its label further in
    if (names?.[i]) s.push(T(p[0] - b[0] * outer, p[1] - b[1] * outer + 5, names[i]));
    if (angleLabels?.[i]) {
      const lab = angleLabels[i];
      if (numOf(lab) === 90 && /°/.test(lab)) s.push(squareAt(pts, i, 10));
      else s.push(cornerArc(pts, i, 14));
      s.push(T(p[0] + b[0] * inner * (numOf(lab) === 90 ? 1.1 : 1), p[1] + b[1] * inner * (numOf(lab) === 90 ? 1.1 : 1) + 5, lab));
    }
  });
  return s;
}

export const F = {
  rect(w, h, lw = `${w}cm`, lh = `${h}cm`, o = {}) {
    const k = fit(w, h), pw = w * k, ph = h * k, x = (W - pw) / 2, y = (H - ph) / 2 + 4;
    return fig([P([[x, y], [x + pw, y], [x + pw, y + ph], [x, y + ph]], 1), ...(lw ? [T(x + pw / 2, y + ph + 18, lw)] : []), ...(lh ? [T(x + pw + 8, y + ph / 2 + 5, lh, "s")] : []), ...(o.right ? sq(x, y + ph) : [])]);
  },
  square(s, label = `${s}cm`) {
    const p = 100, x = (W - p) / 2, y = 25;
    return fig([P([[x, y], [x + p, y], [x + p, y + p], [x, y + p]], 1), T(x + p / 2, y + p + 18, label), ...sq(x, y + p)]);
  },
  tri(b, h, lb = `${b}cm`, lh = `${h}cm`, o = {}) {
    const k = fit(b, h, 170, 100), pb = b * k, ph = h * k, x = (W - pb) / 2, y = 135, ax = x + pb * (o.apex ?? 0.35);
    return fig([P([[x, y], [x + pb, y], [ax, y - ph]], 1), L(ax, y - ph, ax, y, true), ...(lb ? [T(x + pb / 2, y + 18, lb)] : []), ...(lh ? [T(ax + 6, y - ph / 2 + 5, lh, "s")] : []), ...sq(ax, y, 8)]);
  },
  rightTri(a, b, la = `${a}`, lb = `${b}`, lc = "", o = {}) {
    const k = fit(b, a, 150, 100), pb = b * k, pa = a * k, x = 50, y = 140;
    return fig([P([[x, y], [x + pb, y], [x, y - pa]], 1), ...sq(x, y, 10), T(x - 8, y - pa / 2 + 5, la, "e"), T(x + pb / 2, y + 18, lb), T(x + pb / 2 + 12, y - pa / 2 - 4, lc, "s"), ...(o.angle ? [A(x + pb, y, 24, 180 - Math.atan2(pa, pb) * 180 / Math.PI, 180), T(x + pb - 34, y - 6, o.angle, "e")] : [])]);
  },
  para(b, h, lb = `${b}cm`, lh = `${h}cm`) {
    const sl0 = 0.35 * h, k = fit(b + sl0, h, 190, 100), pb = b * k, ph = h * k, sl = sl0 * k, x = (W - pb - sl) / 2, y = 135;
    return fig([P([[x, y], [x + pb, y], [x + pb + sl, y - ph], [x + sl, y - ph]], 1), L(x + sl, y - ph, x + sl, y, true), T(x + pb / 2, y + 18, lb), T(x + sl + 6, y - ph / 2 + 5, lh, "s")]);
  },
  trap(a, b, h, la = `${a}cm`, lb = `${b}cm`, lh = `${h}cm`) {
    const k = fit(Math.max(a, b), h, 170, 95), pa = a * k, pb = b * k, ph = h * k, cx = W / 2, y = 135;
    return fig([P([[cx - pb / 2, y], [cx + pb / 2, y], [cx + pa / 2, y - ph], [cx - pa / 2, y - ph]], 1), L(cx - pa / 2, y - ph, cx - pa / 2, y, true), T(cx, y - ph - 8, la), T(cx, y + 18, lb), T(cx - pa / 2 + 6, y - ph / 2 + 5, lh, "s")]);
  },
  rhombus(d1, d2, l1 = `${d1}cm`, l2 = `${d2}cm`) {
    const k = fit(d1, d2, 170, 110), p1 = d1 * k, p2 = d2 * k, cx = W / 2, cy = H / 2;
    return fig([P([[cx - p1 / 2, cy], [cx, cy - p2 / 2], [cx + p1 / 2, cy], [cx, cy + p2 / 2]], 1), L(cx - p1 / 2, cy, cx + p1 / 2, cy, true), L(cx, cy - p2 / 2, cx, cy + p2 / 2, true), T(cx + p1 / 4, cy - 6, l1), T(cx + 6, cy + p2 / 4, l2, "s")]);
  },
  circleR(r, label = `${r}cm`, o = {}) {
    const R = 55, cx = W / 2, cy = H / 2 + 2;
    return fig([C(cx, cy, R, 1), o.diameter ? L(cx - R, cy, cx + R, cy) : L(cx, cy, cx + R, cy), C(cx, cy, 2.5), T(cx + (o.diameter ? 0 : R / 2), cy - 8, label)]);
  },
  /** regular n-gon, vertices marked with dots when `dots` */
  polygon(n, o = {}) {
    const cx = W / 2, cy = H / 2 + 4, R = 62, pts = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
    const s = [P(pts, 1)];
    if (o.diagonals) for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1)) s.push(L(...pts[i], ...pts[j], true));
    if (o.dots) pts.forEach(([x, y]) => s.push(C(x, y, 3.5, 3)));
    return fig(s);
  },
  /** picture of several simple shapes for counting: list of "t" (triangle) | "s" (square) | "c" (circle) */
  shapes(list, cols = 4) {
    const s = [], gx = 56, gy = 62;
    list.forEach((k, i) => {
      const c = i % cols, r = Math.floor(i / cols), x = 40 + c * gx, y = 34 + r * gy;
      if (k === "t") s.push(P([[x, y + 34], [x + 40, y + 34], [x + 20, y]], 1));
      else if (k === "s") s.push(P([[x, y], [x + 36, y], [x + 36, y + 36], [x, y + 36]], 2));
      else if (k === "c") s.push(C(x + 19, y + 18, 18, 3));
      else if (k === "p") s.push(P([[x + 20, y], [x + 38, y + 14], [x + 31, y + 36], [x + 9, y + 36], [x + 2, y + 14]], 1));
    });
    return fig(s, 40 + cols * gx, 40 + Math.ceil(list.length / cols) * gy);
  },
  single(kind) {
    const cx = W / 2, cy = H / 2;
    if (kind === "tri") return fig([P([[cx - 55, cy + 45], [cx + 55, cy + 45], [cx, cy - 50]], 1)]);
    if (kind === "quad") return fig([P([[cx - 55, cy + 40], [cx + 55, cy + 40], [cx + 55, cy - 40], [cx - 55, cy - 40]], 2)]);
    if (kind === "circ") return fig([C(cx, cy, 48, 3)]);
    if (kind === "pent") return F.polygon(5);
    if (kind === "hex") return F.polygon(6);
    if (kind === "square") return fig([P([[cx - 45, cy + 45], [cx + 45, cy + 45], [cx + 45, cy - 45], [cx - 45, cy - 45]], 2)]);
    if (kind === "trap") return fig([P([[cx - 65, cy + 40], [cx + 65, cy + 40], [cx + 35, cy - 40], [cx - 35, cy - 40]], 1)]);
    if (kind === "para") return fig([P([[cx - 70, cy + 40], [cx + 40, cy + 40], [cx + 70, cy - 40], [cx - 40, cy - 40]], 1)]);
    if (kind === "rhom") return fig([P([[cx - 65, cy], [cx, cy - 45], [cx + 65, cy], [cx, cy + 45]], 1)]);
    if (kind === "rect") return fig([P([[cx - 70, cy + 35], [cx + 70, cy + 35], [cx + 70, cy - 35], [cx - 70, cy - 35]], 1)]);
    throw new Error(`single(${kind})`);
  },
  /** 3-D solids in oblique projection */
  solid(kind, l = "", w = "", h = "") {
    const s = [];
    if (kind === "cube" || kind === "cuboid") {
      const a = kind === "cube" ? 70 : 100, b = kind === "cube" ? 70 : 60, dx = 36, dy = 26, x = 60, y = 135;
      s.push(P([[x, y], [x + a, y], [x + a, y - b], [x, y - b]], 1));
      s.push(P([[x, y - b], [x + dx, y - b - dy], [x + a + dx, y - b - dy], [x + a, y - b]], 2));
      s.push(P([[x + a, y], [x + a + dx, y - dy], [x + a + dx, y - b - dy], [x + a, y - b]], 3));
      if (l) s.push(T(x + a / 2, y + 17, l));
      if (w) s.push(T(x + a + dx / 2 + 8, y - dy / 2 + 18, w, "s"));
      if (h) s.push(T(x - 6, y - b / 2 + 5, h, "e"));
      return fig(s, 260, 170);
    }
    if (kind === "cyl") {
      const cx = 130, rx = 48, ry = 14, top = 36, bot = 130;
      s.push(P([[cx - rx, top], [cx + rx, top], [cx + rx, bot], [cx - rx, bot]], 1));
      s.push(E(cx, bot, rx, ry, 1), E(cx, top, rx, ry, 2));
      if (l) s.push(L(cx, top, cx + rx, top), T(cx + rx / 2, top - ry - 4, l));
      if (h) s.push(T(cx + rx + 8, (top + bot) / 2 + 5, h, "s"));
      return fig(s);
    }
    if (kind === "sph") return fig([C(130, 85, 56, 1), E(130, 85, 56, 16, 0, true), C(130, 85, 2.5, 3), ...(l ? [L(130, 85, 169.6, 45.4), T(176, 44, l, "s")] : [])]);
    if (kind === "cone") {
      const cx = 130, rx = 52, ry = 14, top = 28, bot = 130;
      s.push(P([[cx - rx, bot], [cx, top], [cx + rx, bot]], 1), E(cx, bot, rx, ry, 1), L(cx, top, cx, bot, true), L(cx, bot, cx + rx, bot), C(cx, bot, 2.5, 3));
      if (l) s.push(T(cx + rx / 2, bot + 30, l));
      if (h) s.push(T(cx - 6, bot - 28, h, "e"));
      return fig(s);
    }
    if (kind === "prism") { // triangular prism lying on a rectangular face: base labelled l, length w; hidden back-bottom edge dashed
      const x = 45, y = 140, bw = 90, bh = 70, dx = 70, dy = 26;
      const F0 = [x, y], F1 = [x + bw, y], F2 = [x + bw / 2, y - bh], B0 = [x + dx, y - dy], B1 = [x + bw + dx, y - dy], B2 = [x + bw / 2 + dx, y - bh - dy];
      s.push(P([F1, B1, B2, F2], 2), P([F0, F1, F2], 1), L(...F0, ...B0, true), L(...B0, ...B1, true), L(...B0, ...B2, true)); // visible: front triangle + right slanted face; hidden edges dashed
      if (l) s.push(T(x + bw / 2, y + 17, l));
      if (w) s.push(T(x + bw + dx / 2 + 8, y - dy / 2 + 17, w));
      return fig(s);
    }
    throw new Error(`solid(${kind})`);
  },
  ruler(from, to, max = 10) {
    const x0 = 28, step = 22, y = 100, s = [P([[x0 - 14, y], [x0 + max * step + 14, y], [x0 + max * step + 14, y + 30], [x0 - 14, y + 30]], 2)];
    for (let i = 0; i <= max; i++) { s.push(L(x0 + i * step, y, x0 + i * step, y + (i % 5 === 0 ? 14 : 9))); s.push(T(x0 + i * step, y + 26, i)); }
    s.push(L(x0 + from * step, 60, x0 + to * step, 60));
    s.push(L(x0 + from * step, 52, x0 + from * step, 68), L(x0 + to * step, 52, x0 + to * step, 68));
    return fig(s, x0 * 2 + max * step + 8, 150);
  },
  twoBars(a, b, la = `${a}cm`, lb = `${b}cm`) {
    const k = 190 / Math.max(a, b);
    return fig([L(30, 50, 30 + a * k, 50), L(30, 40, 30, 60), L(30 + a * k, 40, 30 + a * k, 60), T(30 + (a * k) / 2, 34, la),
      L(30, 115, 30 + b * k, 115), L(30, 105, 30, 125), L(30 + b * k, 105, 30 + b * k, 125), T(30 + (b * k) / 2, 99, lb)], 240, 150);
  },
  /** two rays from a vertex at the origin with the angle arc; label shown at the arc */
  angle(deg, label = `${deg}°`) {
    const ox = 70, oy = 130, len = 120, a = rad(deg);
    return fig([L(ox, oy, ox + len, oy), L(ox, oy, ox + len * Math.cos(a), oy - len * Math.sin(a)), A(ox, oy, 30, 0, deg), T(ox + 44 * Math.cos(a / 2) + 6, oy - 44 * Math.sin(a / 2) + 5, label, "s")], 240, 160);
  },
  /**
   * Triangle with its three angles labelled (strings: "50°", or "x" for the unknown), drawn with the REAL angles: vertices A (left), B (right), C (apex).
   * Letters / sides (labels that are not angles) fall back to a generic scalene shape.
   */
  triAngles(A_, B_, C_) {
    const given = [A_, B_, C_].map((t) => (/°/.test(String(t)) ? numOf(t) : null));
    let ang = given.slice();
    const unknown = ang.filter((a) => a === null).length;
    if (unknown === 1 && [A_, B_, C_].filter((t) => /°/.test(String(t))).length === 2) ang = ang.map((a) => (a === null ? 180 - given.reduce((n, g) => n + (g ?? 0), 0) : a));
    else if (unknown > 1) { const rest = 180 - given.reduce((n, g) => n + (g ?? 0), 0); let k = 0; ang = ang.map((g) => (g === null ? rest * (k++ ? 0.45 : 0.55) : g)); }
    const [a, b, c] = ang, sA = rad(a), sB = rad(b), sC = rad(c);
    const ab = 1, ca = Math.sin(sB) / Math.sin(sC);
    const pts0 = [[0, 0], [ab, 0], [ca * Math.cos(sA), -ca * Math.sin(sA)]]; // y down: apex above the base
    const pts = fitPoly(pts0, 190, 105, 130, 88);
    const label = (t, i) => (/°/.test(String(t)) || String(t) === "x" ? String(t) : "");
    return fig([P(pts, 1), ...marks(pts, ["A", "B", "C"], [label(A_, 0), label(B_, 1), label(C_, 2)])]);
  },
  /**
   * Triangle ABC for the sine / cosine laws: pass the labels to show. sas = [a, b, Cdeg] draws the two sides a=BC, b=CA with the real angle C between them;
   * otherwise angles [Adeg, Bdeg] fix the shape. labels: { A, B, C (angle labels), a, b, c (side labels) }.
   */
  tri3(labels, o = {}) {
    let A_, B_, C_;
    if (o.sas) { const [a, b, C] = o.sas, c = rad(C); C_ = [0, 0]; B_ = [a, 0]; A_ = [b * Math.cos(c), b * Math.sin(c)]; }
    else { const [Aa, Bb] = o.angles; const sA = rad(Aa), sB = rad(Bb), sC = rad(180 - Aa - Bb); A_ = [0, 0]; B_ = [1, 0]; C_ = [(Math.sin(sB) / Math.sin(sC)) * Math.cos(sA), (Math.sin(sB) / Math.sin(sC)) * Math.sin(sA)]; }
    let pts = [A_, B_, C_];
    // orient: A bottom-left, B bottom-right, C above (rotate so AB is horizontal)
    const th = Math.atan2(B_[1] - A_[1], B_[0] - A_[0]);
    pts = pts.map(([x, y]) => [x * Math.cos(-th) - y * Math.sin(-th), x * Math.sin(-th) + y * Math.cos(-th)]);
    if (pts[2][1] > 0) pts = pts.map(([x, y]) => [x, -y]);
    pts = fitPoly(pts.map(([x, y]) => [x, y]), 190, 100, 130, 88);
    // the mirror above keeps y down on screen: C must have the smaller y
    if (pts[2][1] > pts[0][1]) pts = pts.map(([x, y]) => [x, 176 - y]);
    const out = [P(pts, 1), ...marks(pts, ["A", "B", "C"], [labels.A, labels.B, labels.C])];
    const mid = (i, j, off) => { const m = [(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2], c = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3]; const d = Math.hypot(m[0] - c[0], m[1] - c[1]) || 1; return [m[0] + ((m[0] - c[0]) / d) * off, m[1] + ((m[1] - c[1]) / d) * off + 5]; };
    if (labels.a) out.push(T(...mid(1, 2, 14), labels.a)); // a = BC
    if (labels.b) out.push(T(...mid(2, 0, 14), labels.b)); // b = CA
    if (labels.c) out.push(T(...mid(0, 1, 14), labels.c)); // c = AB
    return fig(out);
  },
  /** quadrilateral drawn with the REAL interior angles (A bottom-left, B bottom-right, C top-right, D top-left; strings "80°" or "x") */
  quadAngles(a, b, c, d) {
    const labs = [a, b, c, d], given = labs.map((t) => (/°/.test(String(t)) ? numOf(t) : null));
    const known = given.filter((g) => g !== null), sum = known.reduce((n, g) => n + g, 0);
    const ang = given.map((g) => (g === null ? (360 - sum) / (4 - known.length) : g));
    // directions of the sides A->B, B->C, C->D, D->A (math coordinates, counter-clockwise), exterior turn 180 - interior
    const [A_, B_, C_, D_] = ang, dir = [0, 180 - B_, 360 - B_ - C_, 540 - B_ - C_ - D_].map((x) => rad(x));
    const u = dir.map((t) => [Math.cos(t), Math.sin(t)]);
    let best = null;
    for (let t = 0.4; t <= 2.2; t += 0.05) {
      // s0 = 1, s1 = t; solve s2 u2 + s3 u3 = -(u0 + t u1)
      const rx = -(u[0][0] + t * u[1][0]), ry = -(u[0][1] + t * u[1][1]), det = u[2][0] * u[3][1] - u[2][1] * u[3][0];
      if (Math.abs(det) < 1e-6) continue;
      const s2 = (rx * u[3][1] - ry * u[3][0]) / det, s3 = (u[2][0] * ry - u[2][1] * rx) / det;
      if (s2 > 0.25 && s3 > 0.25) { const sc = Math.min(t, s2, s3) / Math.max(1, t, s2, s3); if (!best || sc > best.sc) best = { sc, s: [1, t, s2, s3] }; }
    }
    void A_;
    const sides = best ? best.s : [1, 0.6, 1, 0.6];
    const pts0 = [[0, 0]];
    for (let i = 0; i < 3; i++) { const q = pts0[i]; pts0.push([q[0] + sides[i] * u[i][0], q[1] - sides[i] * u[i][1]]); } // y down on screen
    const pts = fitPoly(pts0, 180, 105, 130, 85);
    return fig([P(pts, 1), ...marks(pts, ["A", "B", "C", "D"], labs.map((t) => (/°/.test(String(t)) || String(t) === "x" ? String(t) : "")))]);
  },
  /** parallelogram ABCD with the angle at A drawn at its real size; labels for angle A and angle B ("65°", "x", "") */
  paraAngle(aDeg, labelA, labelB) {
    const t = rad(aDeg), w = 1, d = 0.7;
    const pts0 = [[0, 0], [w, 0], [w + d * Math.cos(t), -d * Math.sin(t)], [d * Math.cos(t), -d * Math.sin(t)]];
    const pts = fitPoly(pts0, 180, 100, 130, 88);
    return fig([P(pts, 1), ...marks(pts, ["A", "B", "C", "D"], [labelA, labelB, "", ""])]);
  },
  /** triangle with the segment joining the midpoints of the two slanted sides drawn solid (x), base labelled */
  midSeg(baseLabel, segLabel = "x") {
    const x = 40, y = 140, b = 180, ax = x + b * 0.4, ay = 40, B = [x + b, y], A_ = [x, y], C_ = [ax, ay];
    const mL = [(A_[0] + C_[0]) / 2, (A_[1] + C_[1]) / 2], mR = [(B[0] + C_[0]) / 2, (B[1] + C_[1]) / 2];
    return fig([P([A_, B, C_], 1), L(...mL, ...mR), C(...mL, 3, 3), C(...mR, 3, 3), T(x + b / 2, y + 18, baseLabel), T((mL[0] + mR[0]) / 2, mL[1] + 18, segLabel)]);
  },
  /**
   * Two crossing lines drawn with the real angle `deg`: the wedge labelled `labelA` measures deg at the top.
   * rel "adjacent": the unknown `labelB` is the wedge at the right that SHARES a ray with it (180-deg);
   * rel "vertical": the unknown is the opposite wedge at the bottom (same size). Arcs mark both wedges.
   */
  cross(labelA, labelB, deg = 65, rel = "adjacent") {
    const cx = 130, cy = 85, R = 80, t1 = 90 - deg / 2, t2 = 90 + deg / 2;
    const end = (t, sign = 1) => [cx + sign * R * Math.cos(rad(t)), cy - sign * R * Math.sin(rad(t))];
    const s = [L(...end(t1, -1), ...end(t1)), L(...end(t2, -1), ...end(t2))];
    s.push(A(cx, cy, 26, t1, t2), T(cx, cy - 36 - (deg < 40 ? 6 : 0), labelA));
    if (rel === "vertical") s.push(A(cx, cy, 26, 270 - deg / 2, 270 + deg / 2), T(cx, cy + 50, labelB));
    else s.push(A(cx, cy, 26, -t1, t1), T(cx + 46, cy + 5, labelB));
    return fig(s);
  },
  /**
   * Parallel lines l and m cut by a transversal that makes the angle `deg` with them (upward to the right).
   * Wedges at an intersection (angles from the right-hand ray): UR (above, right of the transversal) = deg, UL = 180-deg, LL = deg, LR = 180-deg.
   * rel "corresponding": labelA at UR of the upper line, labelB at UR of the lower line.
   * rel "alternate": labelA at LL of the upper line, labelB at UR of the lower line (alternate interior angles).
   */
  parallel(labelA, labelB, rel = "corresponding", deg = 55) {
    const y1 = 55, y2 = 120, ux = 160, dx = (y2 - y1) / Math.tan(rad(deg)), lx = ux - dx;
    const ext = 36;
    const top = [ux + ext * Math.cos(rad(deg)), y1 - ext * Math.sin(rad(deg))], bot = [lx - ext * Math.cos(rad(deg)), y2 + ext * Math.sin(rad(deg))];
    const s = [L(15, y1, 245, y1), L(15, y2, 245, y2), L(...bot, ...top), T(236, y1 - 8, "l"), T(236, y2 - 8, "m")];
    const wedge = (ix, iy, a0, a1, label) => {
      const mid = rad((a0 + a1) / 2), r = 30;
      s.push(A(ix, iy, 16, a0, a1), T(ix + r * Math.cos(mid), iy - r * Math.sin(mid) + 5, label));
    };
    if (rel === "alternate") wedge(ux, y1, 180, 180 + deg, labelA);
    else wedge(ux, y1, 0, deg, labelA);
    wedge(lx, y2, 0, deg, labelB);
    return fig(s);
  },
  /** right triangle for trigonometric ratios: angle A at the left-bottom, sides labelled */
  trig(opp, adj, hyp, angle = "A", oppLabel = `${opp}`) {
    const k = fit(adj, opp, 160, 100), pa = adj * k, po = opp * k, x = 45, y = 140;
    return fig([P([[x, y], [x + pa, y], [x + pa, y - po]], 1), ...sq(x + pa - 10, y, 10).map((s) => s), A(x, y, 26, 0, Math.atan2(po, pa) * 180 / Math.PI), T(x + 40, y - 5, angle, "s"), T(x + pa + 8, y - po / 2 + 5, oppLabel, "s"), T(x + pa / 2, y + 18, `${adj}`), T(x + pa / 2 - 10, y - po / 2 - 6, `${hyp}`, "e")]);
  },
  /** coordinate plane (grid 1 unit = u px) with points and optional segments */
  plane(points, segments = [], o = {}) {
    const w = 260, h = 170, s = [];
    const xs = [0], ys = [0];
    for (const [, x, y] of points) { xs.push(x); ys.push(y); }
    for (const [x1, y1, x2, y2] of segments) { xs.push(x1, x2); ys.push(y1, y2); }
    if (o.circle) { const [cx, cy, r] = o.circle; xs.push(cx - r, cx + r); ys.push(cy - r, cy + r); }
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const u = Math.min(26, (w - 70) / Math.max(1, xmax - xmin), (h - 60) / Math.max(1, ymax - ymin));
    const ox = 35 + (0 - xmin) * u, oy = h - 28 - (0 - ymin) * u;
    s.push(L(8, oy, w - 8, oy, false, "a"), L(ox, h - 8, ox, 8, false, "a"), T(w - 12, oy + 16, "x"), T(ox + 12, 16, "y"), ...(points.some(([, x, y]) => x === 0 && y === 0) ? [] : [T(ox - 9, oy + 14, "O", "e")]));
    for (const [name, x, y] of points) {
      const px = ox + x * u, py = oy - y * u;
      s.push(C(px, py, 3.5, 3));
      // the label goes on the side AWAY from the segments that end at this point (never on top of a line)
      let dx = 0, dy = 0;
      for (const [x1, y1, x2, y2] of segments) {
        if (x1 === x && y1 === y) { dx += x2 - x; dy += y2 - y; } else if (x2 === x && y2 === y) { dx += x1 - x; dy += y1 - y; }
      }
      const d = Math.hypot(dx, dy);
      if (x === 0 && y !== 0) s.push(T(px + 10, py + 4, name, "s")); // on the y axis: to the right of the point
      else if (d > 0) s.push(T(px - (dx / d) * 14, py + (dy / d) * 14 + 5, name)); // screen y is down: +dy moves toward a point that lies higher (negative screen dy)
      else s.push(T(px + 6, py - 6, name, "s"));
    }
    for (const [x1, y1, x2, y2, dash] of segments) s.push(L(ox + x1 * u, oy - y1 * u, ox + x2 * u, oy - y2 * u, dash));
    if (o.circle) s.push(C(ox + o.circle[0] * u, oy - o.circle[1] * u, o.circle[2] * u));
    return fig(s, w, h);
  },
  /** the line Ax + By = C with the perpendicular from the origin to it */
  lineDist(A_, B_, C_) {
    const d = A_ * A_ + B_ * B_, fx = (A_ * C_) / d, fy = (B_ * C_) / d;
    return F.plane([["H", fx, fy]], [[C_ / A_, 0, 0, C_ / B_], [0, 0, fx, fy, true]]);
  },
  /** hyperbola x^2/a^2 - y^2/b^2 = 1 (a, b in drawing units) with its asymptotes */
  hyperbola(a, b) {
    const cx = 130, cy = 85, s = [L(10, cy, 250, cy, false, "a"), L(cx, 162, cx, 8, false, "a")];
    const k = 60 / Math.max(a, b), A_ = a * k, B_ = b * k;
    for (const sg of [1, -1]) {
      let prev = null;
      for (let t = -1.6; t <= 1.6; t += 0.2) {
        const x = cx + sg * A_ * Math.cosh(t), y = cy - B_ * Math.sinh(t);
        if (prev) s.push(L(prev[0], prev[1], x, y));
        prev = [x, y];
      }
    }
    s.push(L(cx - 100, cy + (100 * B_) / A_, cx + 100, cy - (100 * B_) / A_, true), L(cx - 100, cy - (100 * B_) / A_, cx + 100, cy + (100 * B_) / A_, true));
    s.push(C(cx + Math.sqrt(A_ * A_ + B_ * B_), cy, 3, 3), C(cx - Math.sqrt(A_ * A_ + B_ * B_), cy, 3, 3));
    return fig(s, 260, 170);
  },
  sector(r, deg, lr = `${r}cm`, la = `${deg}°`) {
    const R = 70, cx = 90, cy = 120, a = rad(deg), x1 = cx + R, y1 = cy, x2 = cx + R * Math.cos(a), y2 = cy - R * Math.sin(a), pts = [[cx, cy]];
    for (let i = 0; i <= 24; i++) { const t = (a * i) / 24; pts.push([cx + R * Math.cos(t), cy - R * Math.sin(t)]); }
    return fig([P(pts, 1), A(cx, cy, 26, 0, deg), T(cx + 36 * Math.cos(a / 2) + 8, cy - 36 * Math.sin(a / 2) + 4, la, "s"), T((cx + x1) / 2, cy + 18, lr)]);
  },
  /**
   * Circle with centre O: the central angle AOB = `centralDeg` (A and B symmetric about the vertical below O) and the inscribed angle at C on the OTHER arc
   * (so it measures half of it). centralLabel sits inside the central angle, inscribedLabel inside the angle at C.
   */
  inscribed(centralLabel, inscribedLabel, centralDeg = 100) {
    const cx = 130, cy = 85, R = 62, pt = (d) => [cx + R * Math.cos(rad(d)), cy - R * Math.sin(rad(d))];
    const a = pt(270 - centralDeg / 2), b = pt(270 + centralDeg / 2), c = pt(90);
    return fig([C(cx, cy, R), L(...a, ...c), L(...c, ...b), L(cx, cy, ...a, true), L(cx, cy, ...b, true), C(cx, cy, 2.5), A(cx, cy, 16, 270 - centralDeg / 2, 270 + centralDeg / 2), T(cx, cy + 34, centralLabel), T(cx + 5, cy - 5, "O", "s"), T(c[0], c[1] + 30, inscribedLabel), T(a[0] - 8, a[1] + 14, "A", "e"), T(b[0] + 8, b[1] + 14, "B", "s"), T(c[0], c[1] - 8, "C")], 240, 170);
  },
  /** tangent from external point P: OP and the radius to the point of tangency A are drawn in the ratio of their labels; right angle at A */
  tangent(po, r, pa = "x") {
    const cx = 70, cy = 90, R = 45, k = numOf(r) ? R / numOf(r) : 1, d = Math.min(150, (numOf(po) ?? 5) * k), px = cx + d, py = 90, ang = Math.acos(R / d), tx = cx + R * Math.cos(ang), ty = cy - R * Math.sin(ang);
    const u = [(px - tx) / Math.hypot(px - tx, py - ty), (py - ty) / Math.hypot(px - tx, py - ty)], v = [(cx - tx) / R, (cy - ty) / R];
    return fig([C(cx, cy, R), C(cx, cy, 2.5), L(cx, cy, px, py, true), L(cx, cy, tx, ty), L(px, py, tx, ty), P([[tx, ty], [tx + u[0] * 8, ty + u[1] * 8], [tx + (u[0] + v[0]) * 8, ty + (u[1] + v[1]) * 8], [tx + v[0] * 8, ty + v[1] * 8]]),
      T(cx + R + (d - R) / 2, cy + 16, po), T((cx + tx) / 2 - 8, (cy + ty) / 2 + 2, r, "e"), T((tx + px) / 2 + 8, (ty + py) / 2 - 6, pa, "s"), T(px + 8, py + 4, "P", "s"), T(cx - 10, cy + 4, "O", "e"), T(tx, ty - 8, "A")], 260, 170);
  },
  /** chord at distance d from the centre: radius to an end of the chord (dashed), perpendicular distance d, right-angle mark; `whole` labels the whole chord */
  chord(r, d, whole = "x") {
    const cx = 130, cy = 95, R = 62, dd = (numOf(d) / numOf(r)) * R, hw = Math.sqrt(R * R - dd * dd), y = cy - dd;
    return fig([C(cx, cy, R), L(cx - hw, y, cx + hw, y), L(cx, cy, cx, y, true), L(cx, cy, cx + hw, y, true), C(cx, cy, 2.5), P([[cx, y], [cx + 8, y], [cx + 8, y + 8], [cx, y + 8]]),
      T(cx - 8, cy - dd / 2 + 5, d, "e"), T(cx + hw / 2 + 12, cy - dd / 2 + 8, r, "s"), T(cx, y - 8, whole), T(cx - 12, cy + 4, "O", "e")], 260, 170);
  },
  /** cyclic quadrilateral PQRS with the labelled angle at the top vertex P and the unknown at the opposite vertex R (the angle at P is exactly `aDeg`) */
  cyclic(a, d, aDeg = 75) {
    const cx = 130, cy = 85, R = 62, pt = (dg) => [cx + R * Math.cos(rad(dg)), cy - R * Math.sin(rad(dg))];
    const p = [pt(90), pt(-90 + aDeg), pt(270), pt(270 - aDeg)];
    return fig([C(cx, cy, R), P(p, 1), T(p[0][0], p[0][1] + 26, a), T(p[2][0], p[2][1] - 14, d), T(p[0][0], p[0][1] - 8, "P"), T(p[2][0], p[2][1] + 16, "R")], 260, 170);
  },
  /**
   * Two congruent / similar triangles with labelled sides (base, left, right; strings). The shapes come from the NUMERIC labels: the unknown ("x") side
   * is read off its counterpart (congruent: equal; similar: times the ratio fixed by a known pair), so the picture is a true copy / scaled copy.
   */
  triPair(a1, a2, b1, b2, c1, c2, o = {}) {
    const n1 = [a1, b1, c1].map(numOf), n2 = [a2, b2, c2].map(numOf);
    let k = 1; // second = first * k
    for (let i = 0; i < 3; i++) if (n1[i] !== null && n2[i] !== null) { k = n2[i] / n1[i]; break; }
    if (o.k) k = o.k;
    const t1 = o.shape ?? n1.map((v, i) => v ?? (n2[i] === null ? 1 : n2[i] / k)), t2 = t1.map((v) => v * k);
    const shape = ([a, b, c]) => { const x = (a * a + b * b - c * c) / (2 * a), y = Math.sqrt(Math.max(0, b * b - x * x)); return [[0, 0], [a, 0], [x, -y]]; };
    const p1 = shape(t1), p2 = shape(t2).map(([x, y]) => [x, y]);
    const w1 = Math.max(...p1.map((p) => p[0])) - Math.min(...p1.map((p) => p[0])), w2 = Math.max(...p2.map((p) => p[0])) - Math.min(...p2.map((p) => p[0]));
    const h = Math.max(...p1.map((p) => -p[1]), ...p2.map((p) => -p[1]));
    const sc = Math.min(235 / (w1 + w2 + 0.5 * Math.max(w1, w2)), 100 / h);
    const put = (pts, ox) => pts.map(([x, y]) => [ox + x * sc, 138 + y * sc]);
    const o2 = 15 + w1 * sc + 30;
    const q1 = put(p1, 15), q2 = put(p2, o2);
    const side = (q, i, j, label, out) => { const m = [(q[i][0] + q[j][0]) / 2, (q[i][1] + q[j][1]) / 2], c = [(q[0][0] + q[1][0] + q[2][0]) / 3, (q[0][1] + q[1][1] + q[2][1]) / 3], d = Math.hypot(m[0] - c[0], m[1] - c[1]) || 1; return T(m[0] + ((m[0] - c[0]) / d) * out, m[1] + ((m[1] - c[1]) / d) * out + 5, label); };
    const cen = (q) => [(q[0][0] + q[1][0] + q[2][0]) / 3, (q[0][1] + q[1][1] + q[2][1]) / 3 + 5];
    return fig([P(q1, 1), P(q2, 2), side(q1, 0, 1, a1, 14), side(q1, 0, 2, b1, 12), side(q1, 1, 2, c1, 12), side(q2, 0, 1, a2, 14), side(q2, 0, 2, b2, 12), side(q2, 1, 2, c2, 12), ...(o.center ? [T(...cen(q1), o.center[0]), T(...cen(q2), o.center[1])] : [])], 260, 170);
  },
  /** parabola y^2 = 4px (p = 15 drawing units): the focus F is the real focus of the drawn curve, axes through the vertex (60,85) */
  parabola(label = "") {
    const p = 15, s = [L(10, 85, 250, 85, false, "a"), L(60, 160, 60, 10, false, "a")], pts = [];
    for (let i = -66; i <= 66; i += 6) pts.push([60 + (i * i) / (4 * p), 85 - i]);
    for (let i = 0; i < pts.length - 1; i++) s.push(L(...pts[i], ...pts[i + 1]));
    s.push(C(60 + p, 85, 3.5, 3), T(60 + p, 105, "F"));
    if (label) s.push(T(185, 30, label));
    return fig(s, 260, 170);
  },
  ellipseFig(a, b, la = "", lb = "") {
    return fig([L(15, 85, 245, 85, false, "a"), L(130, 160, 130, 10, false, "a"), E(130, 85, a, b), ...(la ? [T(130 + a / 2, 100, la)] : []), ...(lb ? [T(138, 85 - b / 2, lb, "s")] : []), C(130 + Math.sqrt(a * a - b * b), 85, 3, 3), C(130 - Math.sqrt(a * a - b * b), 85, 3, 3)], 260, 170);
  },
  vectors(list) { // list of [name, x, y] drawn from the origin of an auto-fitted plane
    const w = 260, h = 170, xs = [0, ...list.map((v) => v[1])], ys = [0, ...list.map((v) => v[2])];
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const u = Math.min(24, (w - 80) / Math.max(1, xmax - xmin), (h - 60) / Math.max(1, ymax - ymin));
    const ox = 40 + (0 - xmin) * u, oy = h - 28 - (0 - ymin) * u;
    const s = [L(8, oy, w - 8, oy, false, "a"), L(ox, h - 8, ox, 8, false, "a"), T(ox - 8, oy + 14, "O", "e")];
    for (const [n, x, y] of list) { const m = Math.hypot(x, y) || 1; s.push(L(ox, oy, ox + x * u, oy - y * u, false, "a")); s.push(T(ox + x * u + (x / m) * 14, oy - y * u - (y / m) * 14 + 5, n)); }
    return fig(s, w, h);
  },
  /** analog clock: hour h (1..12), minute m (0..59); only the numerals 12, 3, 6, 9 are written */
  clock(h, m) {
    const cx = 130, cy = 85, R = 66, s = [C(cx, cy, R, 1)];
    for (let i = 0; i < 12; i++) { const a = rad(i * 30 - 90); s.push(L(cx + (R - 8) * Math.cos(a), cy + (R - 8) * Math.sin(a), cx + R * Math.cos(a), cy + R * Math.sin(a))); }
    const ma = rad(m * 6 - 90), ha = rad(((h % 12) + m / 60) * 30 - 90);
    s.push(L(cx, cy, cx + 54 * Math.cos(ma), cy + 54 * Math.sin(ma)), L(cx, cy, cx + 34 * Math.cos(ha), cy + 34 * Math.sin(ha)), C(cx, cy, 3, 3));
    s.push(T(cx, cy - R + 24, "12"), T(cx + R - 18, cy + 5, "3"), T(cx, cy + R - 14, "6"), T(cx - R + 18, cy + 5, "9")); // numerals last: the halo keeps a hand from striking them through
    return fig(s, 260, 170);
  },
  /** triangle drawn from its three side lengths, each side labelled with its length */
  triSides(a, b, c) {
    const k = Math.min(150 / Math.max(a, b, c), 100 / (Math.max(a, b, c) * 0.9)) , A_ = a * k, B_ = b * k, C_ = c * k;
    const x = (B_ * B_ + C_ * C_ - A_ * A_) / (2 * C_), y = Math.sqrt(Math.max(0, B_ * B_ - x * x)); // |p0 p2| = b (left side), |p1 p2| = a (right side)
    const ox = 130 - C_ / 2, oy = 140;
    const p0 = [ox, oy], p1 = [ox + C_, oy], p2 = [ox + x, oy - y];
    return fig([P([p0, p1, p2], 1), T((p0[0] + p1[0]) / 2, oy + 18, c), T((p0[0] + p2[0]) / 2 - 8, (p0[1] + p2[1]) / 2, b, "e"), T((p1[0] + p2[0]) / 2 + 8, (p1[1] + p2[1]) / 2, a, "s")], 260, 170);
  },
  /** two congruent mirror halves with the line of symmetry */
  symmetric(kind) {
    const cx = 130, cy = 85;
    if (kind === "heart") return fig([P([[cx, cy + 50], [cx - 60, cy - 5], [cx - 35, cy - 40], [cx, cy - 15], [cx + 35, cy - 40], [cx + 60, cy - 5]], 1), L(cx, cy - 55, cx, cy + 58, true)]);
    return F.single(kind);
  },
};
export const FIG_SIZE = { W, H };
