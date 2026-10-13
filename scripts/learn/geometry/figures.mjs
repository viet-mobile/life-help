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
      if (w) s.push(T(x + a + dx + 6, y - b / 2 - dy / 2 + 5, w, "s"));
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
    if (kind === "sph") return fig([C(130, 85, 56, 1), E(130, 85, 56, 16, 0, true), ...(l ? [L(130, 85, 186, 85), T(158, 78, l)] : [])]);
    if (kind === "cone") {
      const cx = 130, rx = 52, ry = 14, top = 28, bot = 130;
      s.push(P([[cx - rx, bot], [cx, top], [cx + rx, bot]], 1), E(cx, bot, rx, ry, 1), L(cx, top, cx, bot, true));
      if (l) s.push(T(cx + rx / 2, bot + 30, l));
      if (h) s.push(T(cx - 6, (top + bot) / 2, h, "e"));
      return fig(s);
    }
    if (kind === "prism") { // triangular prism, base labelled l, length w
      const x = 55, y = 132, bw = 90, bh = 70, dx = 70, dy = 0;
      s.push(P([[x, y], [x + bw, y], [x + bw / 2, y - bh]], 1));
      s.push(P([[x + bw, y], [x + bw + dx, y], [x + bw / 2 + dx, y - bh], [x + bw / 2, y - bh]], 2));
      s.push(L(x, y, x + dx, y, true), L(x + dx, y, x + bw + dx, y, true));
      if (l) s.push(T(x + bw / 2, y + 17, l));
      if (w) s.push(T(x + bw + dx / 2, y + 17, w));
      return fig(s);
    }
    throw new Error(`solid(${kind})`);
  },
  ruler(from, to, max = 10) {
    const x0 = 20, step = 22, y = 100, s = [P([[x0 - 6, y], [x0 + max * step + 6, y], [x0 + max * step + 6, y + 30], [x0 - 6, y + 30]], 2)];
    for (let i = 0; i <= max; i++) { s.push(L(x0 + i * step, y, x0 + i * step, y + (i % 5 === 0 ? 14 : 9))); s.push(T(x0 + i * step, y + 26, i)); }
    s.push(L(x0 + from * step, 60, x0 + to * step, 60));
    s.push(L(x0 + from * step, 52, x0 + from * step, 68), L(x0 + to * step, 52, x0 + to * step, 68));
    return fig(s, x0 * 2 + max * step, 150);
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
  /** triangle with its three angles labelled (strings; use "x" for the unknown) */
  triAngles(A_, B_, C_) {
    const ax = 40, ay = 135, bx = 215, by = 135, cx = 115, cy = 35;
    return fig([P([[ax, ay], [bx, by], [cx, cy]], 1), T(ax + 30, ay - 8, A_, "s"), T(bx - 30, by - 8, B_, "e"), T(cx, cy + 34, C_)]);
  },
  quadAngles(a, b, c, d) {
    return fig([P([[45, 135], [215, 135], [195, 38], [70, 38]], 1), T(80, 126, a, "s"), T(190, 126, b, "e"), T(184, 62, c, "e"), T(84, 62, d, "s")]);
  },
  /** two crossing lines, the labelled angle and the one to find */
  cross(labelA, labelB) {
    const cx = 130, cy = 85;
    return fig([L(40, 140, 220, 30), L(40, 30, 220, 140), T(cx, cy - 36, labelA), T(cx, cy + 46, labelB), A(cx, cy, 22, 31, 149)]);
  },
  /** parallel lines cut by a transversal; labels at the two marked angles */
  parallel(labelA, labelB, same = true) {
    const s = [L(25, 55, 235, 55), L(25, 120, 235, 120), L(70, 150, 190, 25), T(222, 48, "l"), T(222, 113, "m")];
    s.push(T(150, 48, labelA, "s"));
    s.push(T(same ? 118 : 175, same ? 113 : 134, labelB, "s"));
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
    s.push(L(8, oy, w - 8, oy, false, "a"), L(ox, h - 8, ox, 8, false, "a"), T(w - 12, oy + 16, "x"), T(ox + 12, 16, "y"), T(ox - 8, oy + 14, "O", "e"));
    for (const [name, x, y] of points) { s.push(C(ox + x * u, oy - y * u, 3.5, 3)); s.push(T(ox + x * u + 6, oy - y * u - 6, name, "s")); }
    for (const [x1, y1, x2, y2, dash] of segments) s.push(L(ox + x1 * u, oy - y1 * u, ox + x2 * u, oy - y2 * u, dash));
    if (o.circle) s.push(C(ox + o.circle[0] * u, oy - o.circle[1] * u, o.circle[2] * u));
    return fig(s, w, h);
  },
  /** the line Ax + By = C with the perpendicular from the origin to it */
  lineDist(A_, B_, C_) {
    const d = A_ * A_ + B_ * B_, fx = (A_ * C_) / d, fy = (B_ * C_) / d;
    return F.plane([["O", 0, 0]], [[C_ / A_, 0, 0, C_ / B_], [0, 0, fx, fy, true]]);
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
  /** circle with centre O and an inscribed angle subtending a labelled arc / central angle */
  inscribed(centralLabel, inscribedLabel) {
    const cx = 120, cy = 85, R = 62, pt = (deg) => [cx + R * Math.cos(rad(deg)), cy - R * Math.sin(rad(deg))];
    const a = pt(210), b = pt(330), c = pt(90);
    return fig([C(cx, cy, R), L(...a, ...c), L(...c, ...b), L(cx, cy, ...a, true), L(cx, cy, ...b, true), C(cx, cy, 2.5), T(cx, cy + 22, centralLabel), T(c[0], c[1] + 30, inscribedLabel), T(cx - 6, cy - 6, "O", "e")], 240, 170);
  },
  /** tangent from external point P: PO, radius r, tangent length PA */
  tangent(po, r, pa = "x") {
    const cx = 80, cy = 90, R = 45, px = 215, py = 90, d = px - cx, ang = Math.acos(R / d), tx = cx + R * Math.cos(ang), ty = cy - R * Math.sin(ang);
    return fig([C(cx, cy, R), C(cx, cy, 2.5), L(cx, cy, px, py, true), L(cx, cy, tx, ty), L(px, py, tx, ty), T(cx + 30, cy + 18, po), T(cx + 10, cy - 28, r), T((tx + px) / 2 + 6, (ty + py) / 2 - 8, pa, "s"), T(px + 8, py + 4, "P", "s"), T(cx - 4, cy + 16, "O", "e")], 250, 170);
  },
  /** chord at distance d from the centre; labels: radius, distance, half chord */
  chord(r, d, half = "x") {
    const cx = 130, cy = 85, R = 62, dd = (d / r) * R, hw = Math.sqrt(R * R - dd * dd);
    return fig([C(cx, cy, R), L(cx - hw, cy - dd, cx + hw, cy - dd), L(cx, cy, cx, cy - dd, true), L(cx, cy, cx + hw, cy - dd, true), C(cx, cy, 2.5), T(cx + 8, cy - dd / 2 + 4, d, "s"), T(cx + hw / 2 + 4, cy - dd - 8, half), T(cx + hw / 2 + 14, cy - dd / 2 + 14, r, "s")], 260, 170);
  },
  cyclic(a, d) {
    const cx = 130, cy = 85, R = 62, pt = (deg) => [cx + R * Math.cos(rad(deg)), cy - R * Math.sin(rad(deg))];
    const p = [pt(120), pt(20), pt(-70), pt(200)];
    return fig([C(cx, cy, R), P(p, 1), T(p[0][0] + 6, p[0][1] - 6, a, "s"), T(p[2][0] - 6, p[2][1] + 16, d, "e")], 260, 170);
  },
  /** two congruent / similar triangles with labelled sides */
  triPair(a1, a2, b1, b2, c1, c2) {
    return fig([P([[20, 130], [110, 130], [60, 45]], 1), T(65, 148, a1), T(30, 82, b1, "e"), T(98, 82, c1, "s"),
      P([[140, 130], [240, 130], [175, 45]], 2), T(190, 148, a2), T(148, 82, b2, "e"), T(224, 82, c2, "s")], 260, 160);
  },
  /** parabola y^2 = 4px sketch with focus mark, axes through (60,85) */
  parabola(label = "") {
    const s = [L(10, 85, 250, 85, false, "a"), L(60, 160, 60, 10, false, "a")], pts = [];
    for (let i = -60; i <= 60; i += 6) pts.push([60 + (i * i) / 30, 85 - i]);
    for (let i = 0; i < pts.length - 1; i++) s.push(L(...pts[i], ...pts[i + 1]));
    s.push(C(90, 85, 3.5, 3), T(96, 105, "F", "s"));
    if (label) s.push(T(190, 30, label));
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
    for (const [n, x, y] of list) { s.push(L(ox, oy, ox + x * u, oy - y * u, false, "a")); s.push(T(ox + x * u + 8, oy - y * u - 4, n, "s")); }
    return fig(s, w, h);
  },
  /** analog clock: hour h (1..12), minute m (0..59); only the numerals 12, 3, 6, 9 are written */
  clock(h, m) {
    const cx = 130, cy = 85, R = 66, s = [C(cx, cy, R, 1)];
    for (let i = 0; i < 12; i++) { const a = rad(i * 30 - 90); s.push(L(cx + (R - 8) * Math.cos(a), cy + (R - 8) * Math.sin(a), cx + R * Math.cos(a), cy + R * Math.sin(a))); }
    s.push(T(cx, cy - R + 24, "12"), T(cx + R - 18, cy + 5, "3"), T(cx, cy + R - 14, "6"), T(cx - R + 18, cy + 5, "9"));
    const ma = rad(m * 6 - 90), ha = rad(((h % 12) + m / 60) * 30 - 90);
    s.push(L(cx, cy, cx + 54 * Math.cos(ma), cy + 54 * Math.sin(ma)), L(cx, cy, cx + 34 * Math.cos(ha), cy + 34 * Math.sin(ha)), C(cx, cy, 3, 3));
    return fig(s, 260, 170);
  },
  /** triangle drawn from its three side lengths, each side labelled with its length */
  triSides(a, b, c) {
    const k = Math.min(150 / Math.max(a, b, c), 100 / (Math.max(a, b, c) * 0.9)) , A_ = a * k, B_ = b * k, C_ = c * k;
    const x = (A_ * A_ + C_ * C_ - B_ * B_) / (2 * C_), y = Math.sqrt(Math.max(0, A_ * A_ - x * x));
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
