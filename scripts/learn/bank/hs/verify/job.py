"""Independent checks for modules/job.mjs (exact Fractions, brute-force enumeration, sympy)."""
from fractions import Fraction
from itertools import combinations, product

import sympy as sp


def flow_units(v):
    # simulate minute by minute
    ml = sum(v["r"] for _ in range(v["h"] * 60 + v["m"]))
    assert ml == v["ml"]
    return Fraction(ml, 1000)


def boxes_ceil(v):
    # brute force: smallest count whose capacity covers the demand
    boxes = next(b for b in range(1, 10**6) if b * v["k"] >= v["n"])
    assert boxes == v["bx"]
    return next(p for p in range(1, 10**6) if p * v["m"] >= boxes)


def ratio_chain(v):
    # search the integer outputs satisfying both ratios and the total
    T = v["T"]
    sols = []
    for c_out in range(1, T):
        # B : C = c : d -> B = C*c/d must be an integer, A : B = a : b -> A = B*a/b
        B = Fraction(c_out * v["c"], v["d"])
        A = B * Fraction(v["a"], v["b"])
        if B.denominator == 1 and A.denominator == 1 and A + B + c_out == T:
            sols.append(c_out)
    assert len(sols) == 1, sols
    return sols[0]


def markup_profit(v):
    c = Fraction(v["c"])
    listp = c * (100 + v["u"]) / 100
    sell = listp * (100 - v["d"]) / 100
    assert listp.denominator == 1 and sell.denominator == 1 and sell > c
    assert listp == v["lp"] and sell == v["sp"]
    return (sell - c) * v["n"]


def table_rule(v):
    p = sp.symbols("x")
    # fit a line through the first two points, require the third to lie on it, evaluate at N
    pts = [(v["x1"], v["y1"]), (v["x2"], v["y2"]), (v["x3"], v["y3"])]
    assert len({x for x, _ in pts}) == 3
    line = sp.interpolate(pts[:2], p)
    assert sp.degree(line, p) == 1 and line.subs(p, pts[2][0]) == pts[2][1], "table not linear"
    return line.subs(p, v["N"])


def plan_compare(v):
    x = 1
    first = None
    for x in range(1, 100000):
        a = v["f1"] + v["p1"] * x
        b = v["f2"] + v["p2"] * x
        if b < a:
            first = x
            break
    assert first is not None
    # from then on B stays cheaper (cost difference is monotone)
    assert all(v["f2"] + v["p2"] * y < v["f1"] + v["p1"] * y for y in range(first, first + 50))
    assert all(v["f2"] + v["p2"] * y >= v["f1"] + v["p1"] * y for y in range(1, first))
    return first


def work_together(v):
    t = sp.symbols("t")
    sol = sp.solve(sp.Eq(v["a"] * t + v["b"] * (t - v["h"]), v["N"]), t)
    assert len(sol) == 1 and sol[0] > v["h"], "B must already have joined"
    assert sol[0] == int(sol[0])
    return sol[0]


def floor_plan(v):
    # trace the boundary of the union of the room and the alcove on a coordinate grid
    a, b, d, c = v["a"], v["b"], v["d"], v["c"]
    assert 0 < d < a and c > 0
    x0 = Fraction(a - d, 2)
    # corners walked counter-clockwise
    pts = [(0, 0), (a, 0), (a, b), (x0 + d, b), (x0 + d, b + c), (x0, b + c), (x0, b), (0, b)]
    per = Fraction(0)
    for (p, q), (r, s) in zip(pts, pts[1:] + pts[:1]):
        per += abs(Fraction(r) - Fraction(p)) + abs(Fraction(s) - Fraction(q))
    assert per == v["per"]
    assert Fraction(str(v["w"])) < min(a, b)
    return per - Fraction(str(v["w"]))


def box_tunnel(v):
    a, b, c, p, q = v["a"], v["b"], v["c"], v["p"], v["q"]
    assert 0 < p < a and 0 < q < b
    # work on a half-unit lattice so the centred hole falls on whole cells; count exposed cell faces, each is 1/4 cm^2
    A, B, Cc, P, Q = 2 * a, 2 * b, 2 * c, 2 * p, 2 * q
    lo_i, lo_j = (A - P) // 2, (B - Q) // 2
    def hole(i, j):
        return lo_i <= i < lo_i + P and lo_j <= j < lo_j + Q
    def solid(i, j, k):
        return 0 <= i < A and 0 <= j < B and 0 <= k < Cc and not hole(i, j)
    faces = 0
    for i, j, k in product(range(A), range(B), range(Cc)):
        if solid(i, j, k):
            for di, dj, dk in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
                if not solid(i + di, j + dj, k + dk):
                    faces += 1
    return Fraction(faces, 4)


def scale_drawing(v):
    real_w = Fraction(v["w"] * v["k"], 100)   # metres
    real_h = Fraction(v["h"] * v["k"], 100)
    assert real_w == Fraction(str(v["rwm"])) and real_h == Fraction(str(v["rhm"]))
    assert real_w <= 20 and real_h <= 20 and v["k"] in (50, 100, 200), "a room, not a hall or field"
    return real_w * real_h


def outfit_count(v):
    pairs = [(t, b) for t in range(v["s"]) for b in range(v["p"])]
    assert 1 <= v["f"] < len(pairs)
    allowed = len(pairs) - v["f"]
    hats = [None] + list(range(v["h"]))
    return sum(1 for _ in product(range(allowed), hats))


def chance_draw(v):
    parts = list(range(v["n"]))              # first d are defective
    good = 0
    total = 0
    for pair in combinations(parts, 2):
        total += 1
        if any(x < v["d"] for x in pair):
            good += 1
    assert total == v["tot"]
    return Fraction(good, total)


VERIFY = {
    "job_flowUnits": flow_units,
    "job_boxesCeil": boxes_ceil,
    "job_ratioChain": ratio_chain,
    "job_markupProfit": markup_profit,
    "job_tableRule": table_rule,
    "job_planCompare": plan_compare,
    "job_workTogether": work_together,
    "job_floorPlan": floor_plan,
    "job_boxTunnel": box_tunnel,
    "job_scaleDrawing": scale_drawing,
    "job_outfitCount": outfit_count,
    "job_chanceDraw": chance_draw,
}


def _check_dollars(mod):
    """Static check of the rendered text: every prompt / hint / explanation string (ko and en) has balanced math delimiters."""
    import os, re as _re
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modules", mod + ".mjs"), encoding="utf8").read()
    for line in src.splitlines():
        if _re.match(r"\s+(ko|en): \[", line):
            for s in _re.findall(r'"((?:[^"\\]|\\.)*)"', line):
                assert s.count("$") % 2 == 0, f"{mod}: odd number of $ in: {s[:80]}"


_check_dollars("job")
