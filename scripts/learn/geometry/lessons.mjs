// Geometry lessons (two per grade, E1..H3): figure-based practice following the 2022 revised curriculum's shape / measurement /
// geometry domains. Item = template key + variables + figure + answer. Every lesson: 4 core + 1 challenge + 2 variants.
import { F } from "./figures.mjs";

const num = (t, v, ans, fig, o = {}) => ({ k: "num", t, v, ans, fig, ...o });
const mc = (t, v, ans, opts, fig, o = {}) => ({ k: "mc", t, v, ans, opts, fig, ...o });
const tf = (t, v, ans, fig, o = {}) => ({ k: "tf", t, v, ans, fig, ...o });
const c = { challenge: true }, vr = { variant: true };
const r2 = (n) => Math.round(n * 100) / 100;
const hyp = (a, b) => Math.sqrt(a * a + b * b);
const polyN = { 3: "tri", 4: "quad", 5: "pent", 6: "hex" };

export const LESSONS = [
  // ---------------- E1 ----------------
  { grade: "E1", n: 1, items: [
    mc("nameShape", {}, "tri", ["tri", "quad", "circ"], F.single("tri")),
    mc("nameShape", {}, "circ", ["tri", "quad", "circ"], F.single("circ")),
    num("countVertices", {}, 3, F.single("tri")),
    num("countSides", {}, 4, F.single("quad")),
    num("countVertices", {}, 0, F.single("circ"), c),
    mc("nameShape", {}, "quad", ["tri", "quad", "circ"], F.single("quad"), vr),
    num("countSides", {}, 3, F.single("tri"), vr),
  ] },
  { grade: "E1", n: 2, items: [
    mc("nameSolid", { name: "@cuboid" }, "cuboid", ["cuboid", "cyl", "sph"], F.solid("cuboid")),
    mc("nameSolid", { name: "@cyl" }, "cyl", ["cuboid", "cyl", "sph"], F.solid("cyl")),
    mc("nameSolid", { name: "@sph" }, "sph", ["cuboid", "cyl", "sph"], F.solid("sph")),
    num("countOf", { shape: "@triP" }, 3, F.shapes(["t", "c", "t", "s", "t", "c"], 3)),
    num("countOf", { shape: "@circP" }, 4, F.shapes(["c", "t", "c", "c", "s", "c", "t", "s"], 4), c),
    mc("nameSolid", { name: "@cuboid" }, "cuboid", ["cuboid", "cyl", "sph"], F.solid("cuboid", "", "", ""), vr),
    num("countOf", { shape: "@squareP" }, 2, F.shapes(["s", "t", "c", "s", "t"], 5), vr),
  ] },
  // ---------------- E2 ----------------
  { grade: "E2", n: 1, items: [
    mc("nameShape", {}, "quad", ["tri", "quad", "circ"], F.single("trap")),
    mc("nameShape", {}, "quad", ["tri", "quad", "circ"], F.single("para")),
    num("countVertices", {}, 4, F.single("trap")),
    num("countSides", {}, 3, F.polygon(3, { dots: true })),
    num("countVertices", {}, 4, F.single("rhom"), c),
    num("countSides", {}, 4, F.single("para"), vr),
    mc("nameShape", {}, "tri", ["tri", "quad", "circ"], F.polygon(3), vr),
  ] },
  { grade: "E2", n: 2, items: [
    num("rulerRead", { from: 0, to: 6 }, 6, F.ruler(0, 6)),
    num("rulerRead", { from: 0, to: 9 }, 9, F.ruler(0, 9)),
    num("rulerRead", { from: 2, to: 7 }, 5, F.ruler(2, 7)),
    num("mToCm", { m: 2, c: 30 }, 230, null),
    num("clockMinutes", { h: 3, n: 6 }, 30, F.clock(3, 30), c),
    num("clockMinutes", { h: 7, n: 2 }, 10, F.clock(7, 10), vr),
    num("mToCm", { m: 1, c: 45 }, 145, null, vr),
  ] },
  // ---------------- E3 ----------------
  { grade: "E3", n: 1, items: [
    num("rightAngles", {}, 4, F.rect(8, 5, "", "", { right: true })),
    num("rightAngles", {}, 1, F.rightTri(3, 4, "", "", "")),
    num("rightAngles", {}, 4, F.square(5, "")),
    mc("angleType", { a: 60, name: "@acute" }, "acute", ["acute", "right", "obtuse"], F.angle(60)),
    mc("angleType", { a: 120, name: "@obtuse" }, "obtuse", ["acute", "right", "obtuse"], F.angle(120), c),
    mc("angleType", { a: 90, name: "@right" }, "right", ["acute", "right", "obtuse"], F.angle(90), vr),
    mc("angleType", { a: 30, name: "@acute" }, "acute", ["acute", "right", "obtuse"], F.angle(30), vr),
  ] },
  { grade: "E3", n: 2, items: [
    num("circleDiameter", { r: 5 }, 10, F.circleR(5)),
    num("circleDiameter", { r: 8 }, 16, F.circleR(8)),
    num("circleRadius", { d: 12 }, 6, F.circleR(6, "12cm", { diameter: true })),
    num("circleRadius", { d: 20 }, 10, F.circleR(10, "20cm", { diameter: true })),
    num("circleDiameter", { r: 15 }, 30, F.circleR(15), c),
    num("circleRadius", { d: 14 }, 7, F.circleR(7, "14cm", { diameter: true }), vr),
    num("circleDiameter", { r: 9 }, 18, F.circleR(9), vr),
  ] },
  // ---------------- E4 ----------------
  { grade: "E4", n: 1, items: [
    num("angleThird", { a: 50, b: 60 }, 70, F.triAngles("50°", "60°", "x")),
    num("angleThird", { a: 90, b: 35 }, 55, F.triAngles("90°", "35°", "x")),
    num("angleQuad", { a: 90, b: 90, c: 70 }, 110, F.quadAngles("90°", "90°", "70°", "x")),
    num("angleThird", { a: 45, b: 45 }, 90, F.triAngles("45°", "45°", "x")),
    num("angleQuad", { a: 80, b: 100, c: 95 }, 85, F.quadAngles("80°", "100°", "95°", "x"), c),
    num("angleThird", { a: 70, b: 70 }, 40, F.triAngles("70°", "70°", "x"), vr),
    num("angleQuad", { a: 120, b: 60, c: 100 }, 80, F.quadAngles("120°", "60°", "100°", "x"), vr),
  ] },
  { grade: "E4", n: 2, items: [
    mc("quadName", { name: "@trap" }, "trap", ["trap", "para", "rhom", "rect"], F.single("trap")),
    mc("quadName", { name: "@para" }, "para", ["trap", "para", "rhom", "rect"], F.single("para")),
    mc("quadName", { name: "@rhom" }, "rhom", ["trap", "para", "rhom", "rect"], F.single("rhom")),
    num("diagonals", {}, 2, F.polygon(4, { diagonals: true, dots: true })),
    num("diagonals", {}, 5, F.polygon(5, { diagonals: true, dots: true }), c),
    mc("quadName", { name: "@rect" }, "rect", ["trap", "para", "rhom", "rect"], F.single("rect"), vr),
    mc("triType", { name: "@iso" }, "iso", ["iso", "equi", "rtri"], F.triSides(5, 5, 6), vr),
  ] },
  // ---------------- E5 ----------------
  { grade: "E5", n: 1, items: [
    num("perimeterRect", { w: 9, h: 4 }, 26, F.rect(9, 4)),
    num("areaRect", { w: 9, h: 4 }, 36, F.rect(9, 4)),
    num("areaTriangle", { b: 10, h: 6 }, 30, F.tri(10, 6)),
    num("areaParallelogram", { b: 8, h: 5 }, 40, F.para(8, 5)),
    num("areaTrapezoid", { a: 4, b: 8, h: 5 }, 30, F.trap(4, 8, 5), c),
    num("areaRhombus", { d1: 8, d2: 6 }, 24, F.rhombus(8, 6), vr),
    num("areaSquare", { s: 7 }, 49, F.square(7), vr),
  ] },
  { grade: "E5", n: 2, items: [
    num("symmetryLines", {}, 4, F.single("square")),
    num("symmetryLines", {}, 1, F.symmetric("heart")),
    num("symmetryLines", {}, 2, F.single("rect")),
    num("congruentSide", {}, 6, F.triPair("5", "5", "6", "x", "4", "4")),
    num("congruentSide", {}, 9, F.triPair("7", "7", "x", "9", "5", "5"), c),
    num("symmetryLines", {}, 6, F.polygon(6), vr),
    num("symmetryLines", {}, 3, F.polygon(3), vr),
  ] },
  // ---------------- E6 ----------------
  { grade: "E6", n: 1, items: [
    num("circumference", { r: 5 }, 31.4, F.circleR(5), { tol: 0.01 }),
    num("circleArea", { r: 5 }, 78.5, F.circleR(5), { tol: 0.01 }),
    num("circumference", { r: 10 }, 62.8, F.circleR(10), { tol: 0.01 }),
    num("circleArea", { r: 10 }, 314, F.circleR(10), { tol: 0.01 }),
    num("circleArea", { r: 6 }, 113.04, F.circleR(6), { tol: 0.01, ...c }),
    num("circumference", { r: 7 }, 43.96, F.circleR(7), { tol: 0.01, ...vr }),
    num("circleArea", { r: 3 }, 28.26, F.circleR(3), { tol: 0.01, ...vr }),
  ] },
  { grade: "E6", n: 2, items: [
    num("cuboidVolume", { l: 6, w: 4, h: 3 }, 72, F.solid("cuboid", "6cm", "4cm", "3cm")),
    num("cuboidSurface", { l: 5, w: 3, h: 2 }, 62, F.solid("cuboid", "5cm", "3cm", "2cm")),
    num("cubeVolume", { e: 4 }, 64, F.solid("cube", "4cm")),
    num("solidCount", { item: "@faces" }, 6, F.solid("cuboid")),
    num("edgeSum", { l: 7, w: 5, h: 4 }, 64, F.solid("cuboid", "7cm", "5cm", "4cm"), c),
    num("prismFaces", { n: 3 }, 5, F.solid("prism"), vr),
    num("solidCount", { item: "@vertices" }, 8, F.solid("cuboid"), vr),
  ] },
  // ---------------- M1 ----------------
  { grade: "M1", n: 1, items: [
    num("adjacentAngle", { a: 65 }, 115, F.cross("65°", "x")),
    num("verticalAngle", { a: 70 }, 70, F.cross("70°", "x")),
    num("parallelAngle", { a: 55 }, 55, F.parallel("55°", "x", true)),
    num("polygonSum", { n: 5, m: 3 }, 540, F.polygon(5)),
    num("regularAngle", { n: 6 }, 120, F.polygon(6), c),
    mc("congruentCond", { cond: "@sss" }, "sss", ["sss", "sas", "asa"], F.triPair("5", "5", "6", "6", "7", "7"), vr),
    num("regularAngle", { n: 4 }, 90, F.polygon(4), vr),
  ] },
  { grade: "M1", n: 2, items: [
    num("arcLength", { r: 6, a: 60 }, 2, F.sector(6, 60)),
    num("sectorArea", { r: 6, a: 60 }, 6, F.sector(6, 60)),
    num("cylinderVolume", { r: 3, h: 5 }, 45, F.solid("cyl", "3cm", "", "5cm")),
    num("coneVolume", { r: 3, h: 4 }, 12, F.solid("cone", "3cm", "", "4cm")),
    num("sphereVolume", { r: 3 }, 36, F.solid("sph", "3cm"), c),
    num("sphereSurface", { r: 5 }, 100, F.solid("sph", "5cm"), vr),
    num("cylinderSurface", { r: 3, h: 5 }, 48, F.solid("cyl", "3cm", "", "5cm"), vr),
  ] },
  // ---------------- M2 ----------------
  { grade: "M2", n: 1, items: [
    num("isoscelesApex", { b: 50 }, 80, F.triAngles("50°", "50°", "x")),
    num("parallelogramAngle", { a: 65 }, 115, F.single("para")),
    num("midSegment", { s: 14 }, 7, F.tri(14, 8, "14cm", "")),
    num("isoscelesApex", { b: 70 }, 40, F.triAngles("70°", "70°", "x")),
    num("midSegment", { s: 18 }, 9, F.tri(18, 10, "18cm", ""), c),
    num("parallelogramAngle", { a: 110 }, 70, F.single("para"), vr),
    num("isoscelesApex", { b: 35 }, 110, F.triAngles("35°", "35°", "x"), vr),
  ] },
  { grade: "M2", n: 2, items: [
    num("pythagHyp", { a: 3, b: 4, c2: 25 }, 5, F.rightTri(3, 4, "3", "4", "x")),
    num("pythagHyp", { a: 6, b: 8, c2: 100 }, 10, F.rightTri(6, 8, "6", "8", "x")),
    num("pythagLeg", { c: 13, a: 5, x2: 144 }, 12, F.rightTri(5, 12, "5", "x", "13")),
    num("similarSide", { p: 2, q: 3 }, 9, F.triPair("4", "6", "5", "x", "3", "4.5")),
    num("similarArea", { p: 2, q: 3, p2: 4, q2: 9, s: 20 }, 45, F.triPair("4", "6", "5", "7.5", "3", "4.5"), c),
    num("pythagHyp", { a: 5, b: 12, c2: 169 }, 13, F.rightTri(5, 12, "5", "12", "x"), vr),
    tf("pythagCheck", { a: 6, b: 8, c: 10, s1: 100, s2: 100, verdict: "@yes" }, true, F.rightTri(6, 8, "6", "8", "10"), vr),
  ] },
  // ---------------- M3 ----------------
  { grade: "M3", n: 1, items: [
    num("trigRatio", { fn: "sin", num: 3, den: 5 }, 0.6, F.trig(3, 4, 5), { tol: 0.001 }),
    num("trigRatio", { fn: "cos", num: 4, den: 5 }, 0.8, F.trig(3, 4, 5), { tol: 0.001 }),
    num("trigRatio", { fn: "tan", num: 3, den: 4 }, 0.75, F.trig(3, 4, 5), { tol: 0.001 }),
    num("specialAngle", { fn: "sin", a: 30 }, 0.5, F.angle(30), { tol: 0.001 }),
    num("trigSide", { t: "0.75", adj: 8 }, 6, F.trig(6, 8, "", "A", "x"), { tol: 0.001, ...c }),
    num("specialAngle", { fn: "tan", a: 45 }, 1, F.angle(45), { tol: 0.001, ...vr }),
    num("specialAngle", { fn: "cos", a: 60 }, 0.5, F.angle(60), { tol: 0.001, ...vr }),
  ] },
  { grade: "M3", n: 2, items: [
    num("inscribedAngle", { c: 100 }, 50, F.inscribed("100°", "x")),
    num("tangentLength", { po: 5, r: 3, pa2: 16 }, 4, F.tangent("5", "3", "x")),
    num("chordHalf", { r: 5, d: 3, half: 4 }, 8, F.chord("5", "3", "x")),
    num("cyclicAngle", { a: 75 }, 105, F.cyclic("75°", "x")),
    num("tangentLength", { po: 13, r: 5, pa2: 144 }, 12, F.tangent("13", "5", "x"), c),
    num("inscribedAngle", { c: 140 }, 70, F.inscribed("140°", "x"), vr),
    num("cyclicAngle", { a: 100 }, 80, F.cyclic("100°", "x"), vr),
  ] },
  // ---------------- H1 ----------------
  { grade: "H1", n: 1, items: [
    num("distance", { x1: 0, y1: 0, x2: 3, y2: 4, dx: 3, dy: 4, s: 25 }, 5, F.plane([["A", 0, 0], ["B", 3, 4]], [[0, 0, 3, 4]])),
    num("midpoint", { x1: 2, y1: 1, x2: 8, y2: 5, axis: "x", u: 2, v: 8 }, 5, F.plane([["A", 2, 1], ["B", 8, 5]], [[2, 1, 8, 5]])),
    num("midpoint", { x1: 2, y1: 1, x2: 8, y2: 5, axis: "y", u: 1, v: 5 }, 3, F.plane([["A", 2, 1], ["B", 8, 5]], [[2, 1, 8, 5]])),
    num("slope", { x1: 1, y1: 2, x2: 4, y2: 8, dx: 3, dy: 6 }, 2, F.plane([["A", 1, 2], ["B", 4, 8]], [[1, 2, 4, 8]])),
    num("distance", { x1: 1, y1: 1, x2: 7, y2: 9, dx: 6, dy: 8, s: 100 }, 10, F.plane([["A", 1, 1], ["B", 7, 9]], [[1, 1, 7, 9]]), c),
    num("slope", { x1: 0, y1: 5, x2: 4, y2: 1, dx: 4, dy: -4 }, -1, F.plane([["A", 0, 5], ["B", 4, 1]], [[0, 5, 4, 1]]), vr),
    num("distance", { x1: -2, y1: 1, x2: 4, y2: 9, dx: 6, dy: 8, s: 100 }, 10, F.plane([["A", -2, 1], ["B", 4, 9]], [[-2, 1, 4, 9]]), vr),
  ] },
  { grade: "H1", n: 2, items: [
    num("circleEqRadius", { a: 2, b: 3, r2: 25 }, 5, F.plane([["O", 2, 3]], [], { circle: [2, 3, 5] })),
    num("circleEqCenter", { a: 4, b: 2, r2: 9 }, 6, F.plane([["O", 4, 2]], [], { circle: [4, 2, 3] })),
    num("circleEqRadius", { a: 0, b: 0, r2: 49 }, 7, F.plane([], [], { circle: [0, 0, 7] })),
    num("pointLineDist", { A: 3, B: 4, C: 10, ab: 5 }, 2, F.lineDist(3, 4, 10)),
    num("pointLineDist", { A: 6, B: 8, C: 30, ab: 10 }, 3, F.lineDist(6, 8, 30), c),
    num("circleEqCenter", { a: 1, b: 5, r2: 16 }, 6, F.plane([["O", 1, 5]], [], { circle: [1, 5, 4] }), vr),
    num("circleEqRadius", { a: 3, b: 3, r2: 36 }, 6, F.plane([["O", 3, 3]], [], { circle: [3, 3, 6] }), vr),
  ] },
  // ---------------- H2 ----------------
  { grade: "H2", n: 1, items: [
    num("lawSinesR", { a: 6, A: 30, sinA: "\\frac12" }, 6, F.triAngles("30°", "B", "C")),
    num("lawCosines", { a: 5, b: 8, C: 60, cosC: "\\frac12", c2: 49 }, 7, F.triAngles("a", "b", "60°")),
    num("areaSin", { a: 6, b: 8, C: 30, sinC: "\\frac12" }, 12, F.triAngles("a", "b", "30°")),
    num("areaSin", { a: 10, b: 4, C: 90, sinC: "1" }, 20, F.triAngles("a", "b", "90°")),
    num("lawCosines", { a: 3, b: 8, C: 60, cosC: "\\frac12", c2: 49 }, 7, F.triAngles("a", "b", "60°"), c),
    num("lawSinesR", { a: 10, A: 30, sinA: "\\frac12" }, 10, F.triAngles("30°", "B", "C"), vr),
    num("areaSin", { a: 12, b: 5, C: 30, sinC: "\\frac12" }, 15, F.triAngles("a", "b", "30°"), vr),
  ] },
  { grade: "H2", n: 2, items: [
    num("radianD", { a: 60 }, 3, F.angle(60)),
    num("radianD", { a: 45 }, 4, F.angle(45)),
    num("radianD", { a: 30 }, 6, F.angle(30)),
    num("arcRad", { r: 6, d: 3 }, 2, F.sector(6, 60, "6", "")),
    num("sectorRad", { r: 6, d: 3 }, 6, F.sector(6, 60, "6", ""), c),
    num("radianD", { a: 90 }, 2, F.angle(90), vr),
    num("arcRad", { r: 8, d: 4 }, 2, F.sector(8, 45, "8", ""), vr),
  ] },
  // ---------------- H3 ----------------
  { grade: "H3", n: 1, items: [
    num("parabolaFocus", { k: 12 }, 3, F.parabola("y²=12x")),
    num("parabolaFocus", { k: 8 }, 2, F.parabola("y²=8x")),
    num("ellipseFocal", { a2: 25, b2: 9, c2: 16 }, 4, F.ellipseFig(80, 48, "5", "3")),
    num("hyperbolaFocal", { a2: 9, b2: 16, c2: 25 }, 5, F.hyperbola(3, 4)),
    num("ellipseFocal", { a2: 169, b2: 144, c2: 25 }, 5, F.ellipseFig(80, 74, "13", "12"), c),
    num("parabolaFocus", { k: 20 }, 5, F.parabola("y²=20x"), vr),
    num("hyperbolaFocal", { a2: 36, b2: 64, c2: 100 }, 10, F.hyperbola(6, 8), vr),
  ] },
  { grade: "H3", n: 2, items: [
    num("vectorMag", { x: 3, y: 4, s: 25 }, 5, F.vectors([["a", 3, 4]])),
    num("dotProduct", { x1: 1, y1: 2, x2: 3, y2: 4 }, 11, F.vectors([["a", 1, 2], ["b", 3, 4]])),
    num("vectorMag", { x: 5, y: 12, s: 169 }, 13, F.vectors([["a", 5, 12]])),
    num("vectorPerp", { x1: 2, x2: 3, y2: -1 }, 6, F.vectors([["a", 2, 6], ["b", 3, -1]])),
    num("dotProduct", { x1: 2, y1: -3, x2: 4, y2: 1 }, 5, F.vectors([["a", 2, -3], ["b", 4, 1]]), c),
    num("vectorMag", { x: 8, y: 6, s: 100 }, 10, F.vectors([["a", 8, 6]]), vr),
    num("vectorPerp", { x1: 4, x2: 1, y2: 2 }, -2, F.vectors([["a", 4, -2], ["b", 1, 2]]), vr),
  ] },
];

// Lesson texts: skill / lesson title, concept and example per (grade, n). ko = canonical, en = reference kit.
export const LESSON_TEXT = {
  E11: { ko: { title: "도형의 이름과 꼭짓점", concept: "**삼각형**은 변이 3개, **사각형**은 변이 4개예요. **원**은 둥글고 꼭짓점이 없어요.", example: "삼각형: 변 3개, 꼭짓점 3개" }, en: { title: "Shape names and corners", concept: "A **triangle** has 3 sides and a **quadrilateral** has 4 sides. A **circle** is round and has no corners.", example: "Triangle: 3 sides, 3 corners" } },
  E12: { ko: { title: "입체도형 알아보기", concept: "상자 모양은 **직육면체**, 둥근 기둥 모양은 **원기둥**, 공 모양은 **구**예요.", example: "직육면체 · 원기둥 · 구" }, en: { title: "Solid shapes", concept: "A box shape is a **cuboid**, a round pillar is a **cylinder**, and a ball is a **sphere**.", example: "cuboid · cylinder · sphere" } },
  E21: { ko: { title: "삼각형과 사각형", concept: "**삼각형**은 곧은 변 3개와 꼭짓점 3개, **사각형**은 곧은 변 4개와 꼭짓점 4개가 있어요. 모양이 달라도 변의 수와 꼭짓점의 수는 같아요.", example: "사각형: 변 4개, 꼭짓점 4개" }, en: { title: "Triangles and quadrilaterals", concept: "A **triangle** has 3 straight sides and 3 corners; a **quadrilateral** has 4 straight sides and 4 corners, whatever its shape. Their number of sides equals their number of corners.", example: "Quadrilateral: 4 sides, 4 corners" } },
  E22: { ko: { title: "길이와 시각", concept: "자의 눈금 0에 맞추면 다른 쪽 끝의 눈금이 길이예요. $1\\text{ m}=100\\text{ cm}$예요. 시계의 긴바늘이 가리키는 숫자에 5를 곱하면 분이에요.", example: "2 m 30 cm = 230 cm" }, en: { title: "Length and time", concept: "Put one end at 0 on the ruler; the mark at the other end is the length. $1\\text{ m}=100\\text{ cm}$. Multiply the number the long hand points to by 5 to get the minutes.", example: "2 m 30 cm = 230 cm" } },
  E31: { ko: { title: "각과 직각", concept: "한 점에서 시작하는 두 반직선이 이루는 도형을 **각**이라고 해요. $90^\\circ$인 각은 **직각**, 더 작으면 **예각**, 더 크면 **둔각**이에요.", example: "$30^\\circ$ 예각 · $90^\\circ$ 직각 · $120^\\circ$ 둔각" }, en: { title: "Angles and right angles", concept: "Two rays from one point form an **angle**. A $90^\\circ$ angle is a **right angle**; smaller is **acute**, larger is **obtuse**.", example: "$30^\\circ$ acute · $90^\\circ$ right · $120^\\circ$ obtuse" } },
  E32: { ko: { title: "원의 반지름과 지름", concept: "원의 중심에서 원 위의 한 점까지의 길이가 **반지름**, 중심을 지나는 선분이 **지름**이에요. 지름은 반지름의 2배예요.", example: "반지름 5 cm → 지름 10 cm" }, en: { title: "Radius and diameter", concept: "The **radius** goes from the centre to the circle; the **diameter** passes through the centre. The diameter is twice the radius.", example: "Radius 5 cm → diameter 10 cm" } },
  E41: { ko: { title: "도형의 각의 크기", concept: "삼각형의 세 각의 합은 $180^\\circ$, 사각형의 네 각의 합은 $360^\\circ$예요.", example: "$50^\\circ+60^\\circ+70^\\circ=180^\\circ$" }, en: { title: "Angle sums", concept: "The three angles of a triangle add up to $180^\\circ$ and the four angles of a quadrilateral add up to $360^\\circ$.", example: "$50^\\circ+60^\\circ+70^\\circ=180^\\circ$" } },
  E42: { ko: { title: "사각형과 다각형", concept: "마주 보는 한 쌍의 변이 평행하면 **사다리꼴**, 두 쌍이 모두 평행하면 **평행사변형**, 네 변이 모두 같으면 **마름모**예요. 이웃하지 않는 꼭짓점을 이은 선분이 **대각선**이에요.", example: "사각형의 대각선: 2개" }, en: { title: "Quadrilaterals and polygons", concept: "One pair of parallel sides makes a **trapezoid**, two pairs a **parallelogram**, and four equal sides a **rhombus**. A **diagonal** joins two vertices that are not neighbours.", example: "A quadrilateral has 2 diagonals" } },
  E51: { ko: { title: "둘레와 넓이", concept: "직사각형: 넓이=가로×세로, 삼각형: 밑변×높이÷2, 평행사변형: 밑변×높이, 사다리꼴: (윗변+아랫변)×높이÷2, 마름모: 대각선×대각선÷2.", example: "삼각형 밑변 10, 높이 6 → 10×6÷2=30" }, en: { title: "Perimeter and area", concept: "Rectangle: width × height. Triangle: base × height ÷ 2. Parallelogram: base × height. Trapezoid: (top + bottom) × height ÷ 2. Rhombus: diagonal × diagonal ÷ 2.", example: "Triangle base 10, height 6 → 10×6÷2 = 30" } },
  E52: { ko: { title: "합동과 대칭", concept: "모양과 크기가 같아 포개어지는 두 도형을 **합동**이라고 해요. 한 직선으로 접었을 때 완전히 겹치는 도형은 **선대칭도형**이고 그 직선이 **대칭축**이에요.", example: "정사각형의 대칭축: 4개" }, en: { title: "Congruence and symmetry", concept: "Two shapes that match exactly are **congruent**. A shape that folds onto itself along a line is **symmetric**; that line is the **line of symmetry**.", example: "A square has 4 lines of symmetry" } },
  E61: { ko: { title: "원주와 원의 넓이", concept: "원주(원의 둘레)=지름×원주율, 원의 넓이=반지름×반지름×원주율이에요. 원주율은 약 $3.14$예요.", example: "반지름 5 cm → 둘레 $10\\times3.14=31.4$ cm" }, en: { title: "Circumference and circle area", concept: "Circumference = diameter × π, area = radius × radius × π, with π ≈ $3.14$.", example: "Radius 5 cm → circumference $10\\times3.14=31.4$ cm" } },
  E62: { ko: { title: "직육면체와 정육면체", concept: "부피=가로×세로×높이, 겉넓이=(세 면의 넓이의 합)×2예요. 직육면체는 면 6개, 모서리 12개, 꼭짓점 8개예요.", example: "$6\\times4\\times3=72$ cm³" }, en: { title: "Cuboids and cubes", concept: "Volume = length × width × height; surface area = (sum of three face areas) × 2. A cuboid has 6 faces, 12 edges and 8 vertices.", example: "$6\\times4\\times3=72$ cm³" } },
  M11: { ko: { title: "각의 성질과 다각형", concept: "맞꼭지각은 같고, 평행선에서 동위각·엇각은 같아요. $n$각형의 내각의 합은 $180^\\circ\\times(n-2)$예요.", example: "오각형: $180^\\circ\\times3=540^\\circ$" }, en: { title: "Angle rules and polygons", concept: "Vertically opposite angles are equal; corresponding and alternate angles on parallel lines are equal. The interior angles of an $n$-sided polygon add up to $180^\\circ\\times(n-2)$.", example: "Pentagon: $180^\\circ\\times3=540^\\circ$" } },
  M12: { ko: { title: "부채꼴과 입체도형의 측정", concept: "호의 길이 $=2\\pi r\\times\\frac{a}{360}$, 부채꼴의 넓이 $=\\pi r^2\\times\\frac{a}{360}$, 구의 부피 $=\\frac43\\pi r^3$, 원뿔의 부피 $=\\frac13\\pi r^2h$예요.", example: "$r=3$인 구: $\\frac43\\pi\\times27=36\\pi$" }, en: { title: "Sectors and solids", concept: "Arc length $=2\\pi r\\times\\frac{a}{360}$, sector area $=\\pi r^2\\times\\frac{a}{360}$, sphere volume $=\\frac43\\pi r^3$, cone volume $=\\frac13\\pi r^2h$.", example: "Sphere $r=3$: $\\frac43\\pi\\times27=36\\pi$" } },
  M21: { ko: { title: "삼각형과 사각형의 성질", concept: "이등변삼각형의 두 밑각은 같아요. 평행사변형에서 이웃한 두 각의 합은 $180^\\circ$이고, 삼각형의 두 변의 중점을 이은 선분은 나머지 변의 $\\frac12$이에요.", example: "밑각 $50^\\circ$ → 꼭지각 $80^\\circ$" }, en: { title: "Triangles and quadrilaterals", concept: "The base angles of an isosceles triangle are equal. Adjacent angles of a parallelogram add up to $180^\\circ$, and the segment joining two midpoints of a triangle is half the third side.", example: "Base angle $50^\\circ$ → apex angle $80^\\circ$" } },
  M22: { ko: { title: "닮음과 피타고라스 정리", concept: "닮은 도형은 대응하는 변의 비가 같고 넓이의 비는 닮음비의 제곱이에요. 직각삼각형에서 $a^2+b^2=c^2$이에요.", example: "$3^2+4^2=5^2$" }, en: { title: "Similarity and the Pythagorean theorem", concept: "Similar figures have equal side ratios and their areas are in the square of that ratio. In a right triangle $a^2+b^2=c^2$.", example: "$3^2+4^2=5^2$" } },
  M31: { ko: { title: "삼각비", concept: "직각삼각형에서 $\\sin A$는 (높이)÷(빗변), $\\cos A$는 (밑변)÷(빗변), $\\tan A$는 (높이)÷(밑변)이에요.", example: "3-4-5 삼각형: $\\sin A=0.6$" }, en: { title: "Trigonometric ratios", concept: "In a right triangle $\\sin A$ = opposite ÷ hypotenuse, $\\cos A$ = adjacent ÷ hypotenuse, $\\tan A$ = opposite ÷ adjacent.", example: "3-4-5 triangle: $\\sin A=0.6$" } },
  M32: { ko: { title: "원의 성질", concept: "한 호에 대한 원주각은 중심각의 $\\frac12$이에요. 접선은 반지름과 수직이고, 원에 내접하는 사각형의 대각의 합은 $180^\\circ$예요.", example: "중심각 $100^\\circ$ → 원주각 $50^\\circ$" }, en: { title: "Properties of circles", concept: "An inscribed angle is half the central angle on the same arc. A tangent is perpendicular to the radius, and opposite angles of a cyclic quadrilateral add up to $180^\\circ$.", example: "Central angle $100^\\circ$ → inscribed angle $50^\\circ$" } },
  H11: { ko: { title: "좌표평면 위의 도형", concept: "두 점 사이의 거리 $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$, 중점은 좌표의 평균, 기울기는 $\\frac{y_2-y_1}{x_2-x_1}$이에요.", example: "A(0,0), B(3,4): 거리 5" }, en: { title: "Figures on the coordinate plane", concept: "Distance $\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$, midpoint = average of coordinates, slope $\\frac{y_2-y_1}{x_2-x_1}$.", example: "A(0,0), B(3,4): distance 5" } },
  H12: { ko: { title: "원의 방정식", concept: "중심이 $(a, b)$이고 반지름이 $r$인 원의 방정식은 $(x-a)^2+(y-b)^2=r^2$이에요. 점 $(x_0,y_0)$과 직선 $ax+by+c=0$ 사이의 거리는 $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$예요.", example: "$(x-2)^2+(y-3)^2=25$: 중심 $(2,3)$, 반지름 5" }, en: { title: "Equation of a circle", concept: "A circle with centre $(a, b)$ and radius $r$ is $(x-a)^2+(y-b)^2=r^2$. The distance from $(x_0,y_0)$ to $ax+by+c=0$ is $\\frac{|ax_0+by_0+c|}{\\sqrt{a^2+b^2}}$.", example: "$(x-2)^2+(y-3)^2=25$: centre $(2,3)$, radius 5" } },
  H21: { ko: { title: "삼각형과 삼각함수", concept: "사인법칙 $\\frac{a}{\\sin A}=2R$, 코사인법칙 $c^2=a^2+b^2-2ab\\cos C$, 삼각형의 넓이 $\\frac12ab\\sin C$예요.", example: "$a=5,b=8,C=60^\\circ$ → $c=7$" }, en: { title: "Triangles and trigonometric functions", concept: "Law of sines $\\frac{a}{\\sin A}=2R$, law of cosines $c^2=a^2+b^2-2ab\\cos C$, triangle area $\\frac12ab\\sin C$.", example: "$a=5,b=8,C=60^\\circ$ → $c=7$" } },
  H22: { ko: { title: "호도법과 부채꼴", concept: "$180^\\circ=\\pi$ 라디안이에요. 반지름 $r$, 중심각 $\\theta$(라디안)인 부채꼴의 호의 길이는 $r\\theta$, 넓이는 $\\frac12r^2\\theta$예요.", example: "$60^\\circ=\\frac{\\pi}{3}$" }, en: { title: "Radians and sectors", concept: "$180^\\circ=\\pi$ radians. A sector with radius $r$ and angle $\\theta$ (radians) has arc length $r\\theta$ and area $\\frac12r^2\\theta$.", example: "$60^\\circ=\\frac{\\pi}{3}$" } },
  H31: { ko: { title: "이차곡선", concept: "포물선 $y^2=4px$의 초점은 $(p,0)$, 타원 $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$에서 $c^2=a^2-b^2$, 쌍곡선에서 $c^2=a^2+b^2$이에요.", example: "$y^2=12x$: 초점 $(3,0)$" }, en: { title: "Conic sections", concept: "The parabola $y^2=4px$ has focus $(p,0)$; for the ellipse $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$, $c^2=a^2-b^2$; for the hyperbola $c^2=a^2+b^2$.", example: "$y^2=12x$: focus $(3,0)$" } },
  H32: { ko: { title: "평면벡터", concept: "벡터 $(x,y)$의 크기는 $\\sqrt{x^2+y^2}$, 내적은 $x_1x_2+y_1y_2$이고 두 벡터가 수직이면 내적이 0이에요.", example: "$(3,4)$의 크기: 5" }, en: { title: "Plane vectors", concept: "The magnitude of $(x,y)$ is $\\sqrt{x^2+y^2}$; the dot product is $x_1x_2+y_1y_2$, and perpendicular vectors have dot product 0.", example: "Magnitude of $(3,4)$: 5" } },
};
