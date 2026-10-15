"""Independent checks for modules/cm2.mjs (공통수학2). Every answer is re-derived from the printed strings / parameters by a different route
(sympy solve / limit / intervals, exact Fractions, brute-force enumeration with uniqueness assertions)."""
import itertools, math, re
from fractions import Fraction
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

X, Y, K = sp.symbols("x y k", real=True)
T = standard_transformations + (implicit_multiplication_application, convert_xor)


def tex(s):
    s = s.replace("\\left", "").replace("\\right", "").replace("\\cdot", "*").replace("\\times", "*").replace("\\ ", " ")
    for _ in range(6):
        s = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", s)
    s = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", s)
    return s


def ex(s, **loc):
    return parse_expr(tex(s), transformations=T, local_dict={"x": X, "y": Y, "k": K, **loc})


def rat(e):
    e = sp.nsimplify(sp.simplify(e))
    assert e.is_Rational, f"not rational: {e}"
    return Fraction(int(e.p), int(e.q))


def sides(eq):
    l, r = eq.split("=")
    return ex(l) - ex(r)


def circle_of(eq):
    """center (cx, cy) and r^2 of a circle given by any equation in x, y (via the gradient / value at the critical point)"""
    f = sides(eq)
    P = sp.Poly(f, X, Y)
    k = P.coeff_monomial(X ** 2)
    assert k != 0 and P.coeff_monomial(Y ** 2) == k and P.coeff_monomial(X * Y) == 0, "not a circle"
    sol = sp.solve([sp.diff(f, X), sp.diff(f, Y)], [X, Y], dict=True)[0]
    cx, cy = sol[X], sol[Y]
    r2 = -f.subs({X: cx, Y: cy}) / k
    assert r2 > 0
    return cx, cy, r2


def coeffs_line(eq):
    f = sp.Poly(sides(eq), X, Y)
    return f.coeff_monomial(X), f.coeff_monomial(Y), f.coeff_monomial(1)


def val(s):
    """Fraction from a printed number: 3, -2, \\frac{1}{4}, -\\frac{1}{4}"""
    s = str(s).strip()
    m = re.fullmatch(r"(-?)\\frac\{(\d+)\}\{(\d+)\}", s)
    if m:
        return (-1 if m.group(1) else 1) * Fraction(int(m.group(2)), int(m.group(3)))
    return Fraction(s)


def same_poly(a, b, *syms):
    return sp.expand(ex(a) - ex(b)) == 0


def nums(s):
    return [int(t) for t in re.findall(r"-?\d+", s)]


# ---------------------------------------------------------------- geometry
def divPoint(v):
    A = (Fraction(v["x1"]), Fraction(v["y1"])); B = (Fraction(v["x2"]), Fraction(v["y2"])); m, n = v["m"], v["n"]
    assert A != B and m > 0 and n > 0
    P = tuple(a + Fraction(m, m + n) * (b - a) for a, b in zip(A, B))
    d1 = sum((p - a) ** 2 for p, a in zip(P, A)); d2 = sum((b - p) ** 2 for p, b in zip(P, B))
    assert d1 * n * n == d2 * m * m, "ratio of lengths"
    assert all(c.denominator == 1 for c in P)
    assert (P[0], P[1]) == (v["px"], v["py"])
    return P[0] + P[1]


def divRatioFind(v):
    A = (v["x1"], v["y1"]); B = (v["x2"], v["y2"]); P = (v["px"], v["py"])
    assert A != B
    # P on segment AB: parametrise P = A + t (B - A), solve for t from each coordinate that differs
    ts = set()
    for i in (0, 1):
        if B[i] != A[i]:
            ts.add(Fraction(P[i] - A[i], B[i] - A[i]))
        else:
            assert P[i] == A[i]
    assert len(ts) == 1, "P not on line AB"
    t = ts.pop()
    assert 0 < t < 1, "P not strictly inside the segment"
    ratio = t / (1 - t)  # AP : PB
    m, n = ratio.numerator, ratio.denominator
    assert (m, n) == (v["m"], v["n"])
    # printed working: |px-x1| = u, |x2-px| = w are the x-differences and u:w reduces to m:n
    assert (abs(P[0] - A[0]), abs(B[0] - P[0])) == (v["u"], v["w"]) and Fraction(v["u"], v["w"]) == ratio
    return m + n


def lineThroughPerp(v):
    a, b, c = coeffs_line(v["line"])
    px, py = v["px"], v["py"]
    assert a != 0 and b != 0
    # direction of l is (b, -a); the new line has direction (a, b)  (dot product 0); find y at x = 0 by the parameter
    assert b * a + (-a) * b == 0
    # printed slopes: slope of l = -a/b, perpendicular slope = b/a
    assert val(v["ms"]) == Fraction(-a, b) and val(v["mp"]) == Fraction(b, a), "printed slopes"
    assert val(v["ms"]) * val(v["mp"]) == -1
    s = sp.Rational(-px, a)  # px + s*a = 0
    y = py + s * b
    return rat(y)


def perpParam(v):
    f1 = sp.Poly(sides(v["l1"]), X, Y); f2 = sp.Poly(sides(v["l2"]), X, Y)
    a1, b1, c1 = [f1.coeff_monomial(t) for t in (X, Y, 1)]
    a2, b2, c2 = [f2.coeff_monomial(t) for t in (X, Y, 1)]
    par = sp.solve(sp.expand(a1 * b2 - a2 * b1), K)
    per = sp.solve(sp.expand(a1 * a2 + b1 * b2), K)
    vals = set()
    for k in par:
        assert k.is_real
        # exclude coincident lines
        A1, B1, C1, A2, B2, C2 = [t.subs(K, k) for t in (a1, b1, c1, a2, b2, c2)]
        assert (A1, B1) != (0, 0) and (A2, B2) != (0, 0)
        if A1 * C2 - A2 * C1 == 0 and B1 * C2 - B2 * C1 == 0:
            continue
        vals.add(k)
    for k in per:
        assert k.is_real
        A1, B1, A2, B2 = [t.subs(K, k) for t in (a1, b1, a2, b2)]
        assert (A1, B1) != (0, 0) and (A2, B2) != (0, 0)
        vals.add(k)
    assert len(vals) == 3
    assert {v["k1"], v["k2"], v["k3"]} == {int(t) for t in vals}
    # printed working: parallel equation, coefficient list, signs
    assert sp.expand(ex(v["eqPar"]) + sp.expand(a1 * b2 - a2 * b1)) == 0, "printed parallel equation (k^2 + q k - p r = -(a1 b2 - a2 b1))"
    assert sp.solve(ex(v["eqPar"]), K) and {int(t) for t in sp.solve(ex(v["eqPar"]), K)} == {v["k1"], v["k2"]}
    assert a1 == v["p"] and b2 == v["rr"] and sp.expand(a2 - (K + int(v["qs"]))) == 0 and a1 * b2 - a2 * b1 != 0
    return rat(sum(vals))


def pointLineDist(v):
    a, b, c = coeffs_line(v["line"])
    # foot of the perpendicular found by minimising the squared distance along the line
    t = sp.symbols("t")
    # line points: choose parametrisation (x, y) = p0 + t*(b, -a)
    if a != 0:
        p0 = (sp.Rational(-c, a), 0)
    else:
        p0 = (0, sp.Rational(-c, b))
    px, py = p0[0] + t * b, p0[1] - t * a
    D2 = (px - v["x0"]) ** 2 + (py - v["y0"]) ** 2
    tt = sp.solve(sp.diff(D2, t), t)[0]
    assert abs(a * v["x0"] + b * v["y0"] + c) == v["N"] and sp.sqrt(a * a + b * b) == v["h"], "printed numerator / root"
    assert (v["a"], v["b"], v["c"]) == (a, b, c)
    return rat(sp.sqrt(D2.subs(t, tt)))


def circleGeneral(v):
    cx, cy, r2 = circle_of(v["eq"])
    r = sp.sqrt(r2)
    assert r.is_Integer and cx.is_Integer and cy.is_Integer
    assert (cx, cy, r) == (v["cx"], v["cy"], v["rad"])
    # printed completed-square form describes the same circle, and kk is the x^2 coefficient
    assert sp.expand(sides(v["std"]) * v["kk"] - sides(v["eq"])) == 0, "printed standard form"
    assert sp.Poly(sides(v["eq"]), X, Y).coeff_monomial(X ** 2) == v["kk"]
    return rat(cx + cy + r)


def circleTangentAxes(v):
    r = sp.symbols("r", positive=True)
    sols = sp.solve(sp.Eq((v["p"] - r) ** 2 + (v["q"] - r) ** 2, r ** 2), r)
    assert len(sols) == 2 and all(s.is_positive for s in sols), sols
    # each solution: centre (s, s) really is tangent to both axes and passes through the point
    for s in sols:
        assert sp.simplify((v["p"] - s) ** 2 + (v["q"] - s) ** 2 - s ** 2) == 0
    # printed working: r^2 - u r + t = 0 and its roots rs, rl
    qd = sp.expand((v["p"] - r) ** 2 + (v["q"] - r) ** 2 - r ** 2 - (r ** 2 - v["u"] * r + v["t"]))
    assert qd == 0, "printed quadratic"
    assert sorted(sols) == sorted([v["rs"], v["rl"]]), "printed roots"
    return rat(max(sols))


def lineCircleCount(v):
    cx, cy, r2 = circle_of(v["circ"])
    lhs, rhs = v["line"].split("=")
    assert rhs == "k"
    u = sp.Poly(ex(lhs), X, Y)
    uu, ww = u.coeff_monomial(X), u.coeff_monomial(Y)
    assert uu != 0 and ww != 0
    # substitute y from the line into the circle: quadratic in x with discriminant D(k)
    yk = (K - uu * X) / ww
    quad = sp.Poly(sp.expand((X - cx) ** 2 + (yk - cy) ** 2 - r2), X)
    a2, a1, a0 = quad.all_coeffs()
    Dk = sp.expand(a1 ** 2 - 4 * a2 * a0)
    f = sp.lambdify(K, Dk, "sympy")
    cnt = sum(1 for k in range(1, 400) if f(sp.Integer(k)) > 0)
    # all positive k beyond 400 must fail: the leading coefficient of D(k) is negative
    assert sp.Poly(Dk, K).LC() < 0
    # printed working: distance condition |K0 - k|^2 < R2 and the integer window lo..hi
    assert uu * cx + ww * cy == v["K0"] and (uu * uu + ww * ww) * r2 == v["R2"], "printed K0 / R2"
    win = [k for k in range(-400, 400) if f(sp.Integer(k)) > 0]
    assert win and win[0] == v["lo"] and win[-1] == v["hi"] and win == list(range(win[0], win[-1] + 1)), "printed window"
    assert cnt == len([k for k in win if k >= 1]) >= 1
    return cnt


def chordLength(v):
    cx, cy, r2 = circle_of(v["circ"])
    a, b, c = coeffs_line(v["line"])
    sols = sp.solve([sp.Eq(a * X + b * Y + c, 0), sp.Eq((X - cx) ** 2 + (Y - cy) ** 2, r2)], [X, Y], dict=True)
    assert len(sols) == 2, "line must cut the circle in two points"
    p, q = [sp.Point(s[X], s[Y]) for s in sols]
    L = p.distance(q)
    d = sp.Abs(a * cx + b * cy + c) / sp.sqrt(a * a + b * b)
    assert d == sp.Rational(v["d"]) and sp.Abs(a * cx + b * cy + c) == v["dh"] and sp.sqrt(a * a + b * b) == v["h"], "printed distance"
    assert sp.sqrt(r2) == v["rad"] and L == 2 * v["half"] and sp.sqrt(r2 - d * d) == v["half"], "printed half chord"
    return rat(L)


def tangentAtPoint(v):
    cx, cy, r2 = circle_of(v["circ"])
    circ = sp.Circle(sp.Point(cx, cy), sp.sqrt(r2))
    pt = sp.Point(v["x1"], v["y1"])
    assert circ.encloses_point(pt) is False and pt.distance(circ.center) == circ.radius, "point must lie on the circle"
    lines = circ.tangent_lines(pt)
    assert len(lines) == 1
    a, b, c = lines[0].coefficients
    assert b != 0
    ta, tb, tc = coeffs_line(v["tang"])
    assert (ta * b - a * tb, ta * c - a * tc, tb * c - b * tc) == (0, 0, 0), "printed tangent equation is the tangent line"
    return rat(-(a * v["t"] + c) / b)


def translateCurve(v):
    f = ex(v["orig"]); g = ex(v["img"])
    m, n = sp.symbols("m n")
    diff = sp.Poly(sp.expand(f.subs(X, X - m) + n - g), X)
    sol = sp.solve(diff.all_coeffs(), [m, n], dict=True)
    assert len(sol) == 1
    assert (sol[0][m], sol[0][n]) == (v["m"], v["n"]), "printed m, n"
    assert sp.expand(ex(v["shift"].replace("(x-m)", "(x-(%d))" % v["m"])) + v["n"] - g) == 0, "printed shifted form"
    assert sp.Poly(g, X).all_coeffs()[1] == v["b2"] and sp.Poly(f, X).all_coeffs()[1] == v["b"] and 2 * sp.Poly(f, X).all_coeffs()[0] == v["tw"]
    return rat(sol[0][m] + sol[0][n])


def reflectPointChain(v):
    m, n, sx, sy = v["m"], v["n"], v["sx"], v["sy"]
    swap = lambda p: (p[1], p[0]); flipx = lambda p: (-p[0], p[1]); shift = lambda p: (p[0] + m, p[1] + n)
    hits = [(a, b) for a in range(-80, 81) for b in range(-80, 81) if shift(flipx(swap((a, b)))) == (sx, sy)]
    assert len(hits) == 1
    return hits[0][0] + hits[0][1]


def reflectChainOrder(v):
    m, n, sx, sy = v["m"], v["n"], v["sx"], v["sy"]
    shift = lambda p: (p[0] + m, p[1] + n); origin = lambda p: (-p[0], -p[1]); flipy = lambda p: (p[0], -p[1])
    hits = [(a, b) for a in range(-80, 81) for b in range(-80, 81) if flipy(origin(shift((a, b)))) == (sx, sy)]
    assert len(hits) == 1
    assert (v["pa"], v["pb"]) == hits[0], "printed a, b"
    return hits[0][0] + hits[0][1]


def reflectCurve(v):
    f = ex(v["orig"])
    m, n = v["m"], v["n"]
    g = lambda t: -f.subs(X, -t)  # image under (x,y)->(-x,-y)
    h = sp.expand(g(X - m) + n)   # then translate
    xs = sp.solve(sp.diff(h, X), X)
    assert len(xs) == 1
    f0 = sp.expand(f)
    x0 = sp.solve(sp.diff(f0, X), X)[0]
    assert (x0, f0.subs(X, x0)) == (v["h"], v["k"]) and (-v["h"], -v["k"]) == (v["nh"], v["nk"]), "printed vertices"
    assert sp.expand(ex(v["orig2"]) + g(X)) == 0, "orig2 is f(-x), the reflected curve is y = -f(-x)"
    assert (xs[0], h.subs(X, xs[0])) == (v["s"], v["t"]), "printed final vertex"
    return rat(xs[0] + h.subs(X, xs[0]))


def reflectShortest(v):
    a1, a2, b1, b2 = v["a1"], v["a2"], v["b1"], v["b2"]
    assert a2 * b2 > 0
    F = lambda t: math.hypot(t - a1, a2) + math.hypot(t - b1, b2)
    lo, hi = -100.0, 100.0
    for _ in range(300):  # ternary search of a convex function
        m1, m2 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if F(m1) < F(m2): hi = m2
        else: lo = m1
    val = F((lo + hi) / 2)
    assert abs(val - round(val)) < 1e-6, val
    assert v["nb2"] == -b2 and abs(b1 - a1) == v["dx"] and abs(a2 - v["nb2"]) == v["ss"] and v["dx"] ** 2 + v["ss"] ** 2 == round(val) ** 2, "printed legs"
    assert a2 * v["nb2"] < 0, "A and B' on opposite sides, so the segment meets the axis"
    return Fraction(round(val))


# ---------------------------------------------------------------- sets and propositions
def setSumCount(v):
    A = nums(v["sa"]); B = nums(v["sb"])
    assert len(set(A)) == len(A) and len(set(B)) == len(B)
    C = {x + y for x in A for y in B}
    assert sorted(C) == nums(v["sc"])
    return sum(C)


class S(frozenset):
    U = frozenset()
    def __or__(s, o): return S(frozenset.__or__(s, o))
    def __and__(s, o): return S(frozenset.__and__(s, o))
    def __sub__(s, o): return S(frozenset.__sub__(s, o))
    @property
    def c(s): return S(S.U - s)


def setOpSum(v):
    N = v["N"]
    S.U = frozenset(range(1, N + 1))
    A = S(x for x in S.U if v["da"] % x == 0); B = S(x for x in S.U if x % v["mb"] == 0)
    e = v["ex"].replace("\\cup", "|").replace("\\cap", "&").replace("^c", ".c")
    R = eval(e, {"A": A, "B": B})
    assert sorted(A) == nums(v["As"]) and sorted(B) == nums(v["Bs"]) and sorted(R) == nums(v["Rs"])
    assert len(R) > 0
    return sum(R)


def vennReverse(v):
    nu, na, nb, nc = v["nu"], v["na"], v["nb"], v["nc"]
    ab = na + nb - (nu - nc)
    assert 0 <= ab <= min(na, nb)
    U = set(range(nu))
    inter = set(range(ab)); onlyA = set(range(ab, na)); onlyB = set(range(na, na + nb - ab))
    A = inter | onlyA; B = inter | onlyB
    assert len(A) == na and len(B) == nb and len(U - (A | B)) == nc
    return len((U - A) | B)


def interval_of(cond):
    c = cond.replace("\\le", "<=").replace(" ", "")
    if "|" in c:
        inner, rest = re.match(r"\|(.*)\|<=(\d+)", c).groups()
        return sp.solveset(sp.Abs(ex(inner)) <= int(rest), X, sp.S.Reals)
    if c.count("<=") == 2:
        lo, mid, hi = c.split("<=")
        return sp.Interval(sp.Rational(lo), sp.Rational(hi))
    lhs, rhs = c.split("<=")
    return sp.solveset(ex(lhs) <= sp.Rational(rhs), X, sp.S.Reals)


def inclusionParam(v):
    A = interval_of(v["Ac"]); Cc = interval_of(v["Cc"])
    assert isinstance(A, sp.Interval) and isinstance(Cc, sp.Interval) and A.is_subset(Cc)
    assert (A.start, A.end, Cc.start, Cc.end) == (v["al"], v["ar"], v["cl"], v["cr"]), "printed intervals"
    assert (v["na"], v["nb"]) == (v["al"] - v["cl"] + 1, v["cr"] - v["ar"] + 1)
    lo, hi = int(Cc.start) - 4, int(Cc.end) + 4
    cnt = 0
    for a in range(lo, hi + 1):
        for b in range(a, hi + 1):
            B = sp.Interval(a, b)
            if A.is_subset(B) and B.is_subset(Cc):   # the prompt says the symbol allows equality: B = A and B = C are counted
                cnt += 1
    assert sp.Interval(v["al"], v["ar"]).is_subset(sp.Interval(v["al"], v["ar"]))  # equality case exists
    return cnt


def existsInterval(v):
    p, q = v["p"], v["q"]
    f = ex(v["form"].replace("<0", ""))  # x^2 - b x + k
    ks = [k for k in range(-200, 200) if any(f.subs({X: x, K: k}) < 0 for x in range(p, q + 1))]
    assert ks == list(range(ks[0], ks[-1] + 1)) and ks[0] == -200 and ks[-1] < 199
    g = ex(v["gx"])
    gm = max(g.subs(X, x) for x in range(p, q + 1))
    assert gm == v["gm"] and g.subs(X, v["xm"]) == gm and p <= v["xm"] <= q, "printed maximum"
    assert sp.expand(ex(v["form"].replace("<0", "")) + g - K) == 0, "form is x^2 - bx + k, i.e. k + (x^2 - bx)"
    return ks[-1]


def truthRange(v):
    m, n, c = v["m"], v["n"], v["c"]
    assert sp.Poly(ex(v["quad"]), X).all_coeffs() == [1, -(m + n), m * n]
    cxp = sp.Poly(ex(v["cx"]), X)
    k = int(cxp.all_coeffs()[0])
    assert k in (1, 2) and cxp.all_coeffs() == [k, -c], "printed |kx-c|"
    assert m < n and k * m < c < k * n
    grid = [Fraction(i, 4) for i in range(-440, 441)]
    p = lambda x: x * x - (m + n) * x + m * n <= 0
    q = lambda a: (lambda x: abs(k * x - c) <= a)
    good_contra = [a for a in range(1, 120) if all(((not q(a)(x)) <= (not p(x))) for x in grid)]   # not q -> not p  (contrapositive of p -> q)
    good_conv = [a for a in range(1, 120) if all((not q(a)(x)) or p(x) for x in grid)]               # q -> p (converse)
    assert good_contra == list(range(good_contra[0], 120)), "contrapositive holds for all large a"
    assert good_conv == list(range(1, len(good_conv) + 1)) and len(good_conv) >= 1, "converse holds for an initial run of a"
    al, be = good_contra[0], good_conv[-1]
    assert (al, be) == (v["al"], v["be"]) and v["d1"] == -v["u"] and v["d2"] == v["w"]
    assert (k * m - c, k * n - c) == (v["u"], v["w"]) and (v["km"], v["kn"]) == (k * m, k * n)
    assert v["kx"] == ("x" if k == 1 else "2x")
    # the same contrapositive, tested directly on sympy intervals (independent of the grid)
    P = sp.Interval(m, n)
    for a in (al - 1, al):
        Q = sp.Interval(sp.Rational(c - a, k), sp.Rational(c + a, k))
        assert P.is_subset(Q) == (a >= al)
    for a in (be, be + 1):
        Q = sp.Interval(sp.Rational(c - a, k), sp.Rational(c + a, k))
        assert Q.is_subset(P) == (a <= be)
    return al * be


def necessaryDiv(v):
    n = v["n"]
    assert v["nd"] == len([d for d in range(1, n + 1) if n % d == 0])
    cnt = 0
    for m in range(1, 2 * n + 1):          # a multiple of m, m*j, is a multiple of n for all j iff it is for j = 1..n (period n)
        p_to_q = all((m * j) % n == 0 for j in range(1, n + 1))
        q_to_p = all((n * j) % m == 0 for j in range(1, m + 1))
        if q_to_p and not p_to_q:
            cnt += 1
    for m in range(2 * n + 1, 3 * n + 1):  # no m beyond n can have q => p
        assert any((n * j) % m != 0 for j in range(1, m + 1))
    return cnt


def sufficientQuad(v):
    Q = sp.solveset(ex(v["quad"]) > 0, X, sp.S.Reals)
    good = [a for a in range(-40, 41) if sp.Interval.open(a, sp.oo).is_subset(Q)]
    assert good == list(range(good[0], 41))
    rts = sorted(sp.solve(ex(v["quad"]), X))
    assert [val(v["Rs"]), val(v["Rl"])] == [Fraction(int(t.p), int(t.q)) for t in rts], "printed roots"
    return good[0]


def amgmMin(v):
    f = ex(v["ex"])
    bound = sp.Rational(v["dom"].split(">")[1])
    cs = [c for c in sp.solve(sp.diff(f, X), X) if c.is_real and c > bound]
    assert len(cs) == 1
    c = cs[0]
    assert sp.diff(f, X, 2).subs(X, c) > 0
    # the value is the global minimum on the domain: compare with a fine rational grid
    val = f.subs(X, c)
    assert all(f.subs(X, bound + sp.Rational(i, 8)) >= val for i in range(1, 160))
    assert Fraction(re.sub(r'\\frac\{(-?\d+)\}\{(\d+)\}', r'\1/\2', v['xe'])) == rat(c), 'equality point'
    # the displayed chain "... = value": its last number is the minimum and the displayed rewriting equals f
    last = Fraction(re.findall(r"=(-?\d+)$", v["work"])[0])
    assert last == rat(val), "printed minimum"
    assert v["work"].startswith(v["ex"]) and v["dom"].startswith("x>")
    return rat(val)


# ---------------------------------------------------------------- functions
def funcInjective(v):
    m, n, t, u = v["m"], v["n"], v["t"], v["u"]
    return sum(1 for f in itertools.permutations(range(1, n + 1), m) if f[0] <= t and f[1] >= u)


def funcMonotone(v):
    m, n, u, w = v["m"], v["n"], v["u"], v["w"]
    assert w == n and v["k"] == n - u + 1 and len(nums(v["xset"].replace("\\dots", ""))) >= 1
    return sum(1 for f in itertools.product(range(1, n + 1), repeat=m) if all(f[i] < f[i + 1] for i in range(m - 1)) and f[0] >= u)


def compFindG(v):
    f = ex(v["f"]); comp = ex(v["comp"])
    G = sp.symbols("G")
    sol = sp.solve(sp.Eq(f.subs(X, G), comp), G)
    assert len(sol) == 1
    assert sp.expand(sol[0] - ex(v["gs"])) == 0
    assert sp.expand(ex(v["fg"]) - comp) == 0, "printed f(g(x))"
    return rat(sol[0].subs(X, v["t"]))


def parse_table(s):
    return {int(a): int(b) for a, b in re.findall(r"(\d+)\\to\s*(\d+)", s)}


def compTable(v):
    f = parse_table(v["ft"]); g = parse_table(v["gt"])
    n = v["n"]
    assert set(f) == set(g) == set(range(1, n + 1))
    rows = re.findall(r"x=(\d+):\\ (\d+),\\ (\d+)", v["work"])
    assert len(rows) == n
    for x, a, b in rows:
        assert (f[g[int(x)]], g[f[int(x)]]) == (int(a), int(b)), "printed f(g(x)), g(f(x))"
    cnt = sum(1 for x in range(1, n + 1) if f[g[x]] == g[f[x]])
    assert 1 <= cnt <= n - 1
    return cnt


def inverseQuadDom(v):
    f = ex(v["fx"]); t = v["t"]
    sols = sp.solve(sp.Eq(f, t), X)
    mode, p = re.match(r"x\\(ge|le) (-?\d+)", v["dom"]).groups()
    p = int(p)
    ok = [s for s in sols if (s >= p if mode == "ge" else s <= p)]
    assert len(ok) == 1, (sols, ok)
    assert sp.expand(ex(v["vf"]) - f) == 0 and sp.expand(ex(v["sq"]).subs(X, X) - ex(v["xp"]) ** 2) == 0, "printed vertex form"
    assert v["s2"] == v["s"] ** 2 and v["rt"] == (v["s"] if mode == "ge" else -v["s"]) and ok[0] == p + v["rt"], "printed root choice"
    return rat(ok[0])


def inverseRational(v):
    f = ex(v["num"]) / ex(v["den"])
    sols = sp.solve(sp.Eq(f, v["k"]), X)
    sols = [s for s in sols if ex(v["den"]).subs(X, s) != 0]
    assert len(sols) == 1
    num, den = sp.Poly(ex(v["num"]), X), sp.Poly(ex(v["den"]), X)
    # num = k*den  <=>  (a - c k) x = d k - b
    a_, b_ = num.all_coeffs(); c_, d_ = den.all_coeffs()
    assert (a_ - c_ * v["k"], d_ * v["k"] - b_) == (v["coef"], v["rhs"]) and v["coef"] != 0, "printed linear equation"
    assert sp.Rational(v["rhs"], v["coef"]) == sols[0]
    return rat(sols[0])


def rationalAsym(v):
    f = ex(v["num"]) / ex(v["den"])
    q = sp.limit(f, X, sp.oo)
    assert sp.limit(f, X, -sp.oo) == q
    dens = sp.solve(ex(v["den"]), X)
    assert len(dens) == 1
    p = dens[0]
    assert sp.limit(f, X, p, "+") in (sp.oo, -sp.oo)  # genuine vertical asymptote
    assert (val(v["px"]), val(v["qy"])) == (p, q), "printed asymptotes"
    assert sp.Rational(v["a"], v["c"]) == q
    return rat(p + q)


def rationalParam(v):
    k = sp.symbols("k0")
    p, q = v["p"], v["q"]
    g = lambda kk: kk / (X - p) + q      # y = k/x translated: replace x by x-p, add q
    kk = sp.solve(sp.Eq(g(k).subs(X, v["x0"]), v["y0"]), k)
    assert len(kk) == 1 and kk[0] != 0 and kk[0] == v["kk"]
    assert v["y0"] != 0 and p != 0 and v["x0"] != p, "P must not lie on the x-axis; the translation must be a real one"
    xs = sp.solve(sp.Eq(g(kk[0]), 0), X)
    assert len(xs) == 1
    return rat(xs[0])


def rationalIntersectCount(v):
    f = ex(v["fr"])
    N = v["N"]
    mm = re.match(r"y=(-?\d*)x\+n", v["line"]).group(1)
    m = {"": 1, "-": -1}.get(mm, None) if mm in ("", "-") else int(mm)
    cnt = 0
    for n in range(-N, N + 1):
        sol = sp.solveset(sp.Eq(f, m * X + n), X, sp.S.Reals)
        pts = [s for s in sol if ex(v["den"]).subs(X, s) != 0]
        if len(pts) == 2:
            cnt += 1
    assert v["tot"] == 2 * N + 1 and v["bad"] == v["tot"] - cnt, "printed counts"
    # printed discriminant D = (n + ee)^2 + 4 m k  gives the same count (and no root hits the pole)
    ee = 0 if v["nstr"] == "n" else int(v["nstr"][1:])
    k = int(v["k"])
    d4 = int(v["ds"])
    assert d4 == 4 * m * k
    assert sum(1 for n_ in range(-N, N + 1) if (n_ + ee) ** 2 + d4 > 0) == cnt, "printed discriminant"
    return cnt


def irrationalPass(v):
    a = sp.symbols("a")
    p, q = v["p"], v["q"]
    expr_ = sp.sqrt(a * (v["x0"] - p)) + q - v["y0"]
    cand = sp.solve(expr_, a)
    cand = [c for c in cand if c != 0 and sp.simplify(c * (v["x0"] - p)) >= 0 and sp.simplify(expr_.subs(a, c)) == 0]
    assert len(cand) == 1
    assert v["d"] == v["x0"] - p and v["s"] == v["y0"] - q and v["s"] > 0 and v["s2"] == v["s"] ** 2 and p != 0 and q != 0
    assert cand[0] * v["d"] == v["s2"], "printed squared equation"
    return rat(cand[0])


def irrationalMinMax(v):
    f = ex(v["fx"])
    rng = sp.calculus.util.function_range(f, X, sp.Interval(v["lo"], v["hi"]))
    assert isinstance(rng, sp.Interval)
    lo, hi = v["lo"], v["hi"]
    assert (f.subs(X, lo), f.subs(X, hi)) == (v["flo"], v["fhi"]) and sp.sqrt(v["rl"]) + v["c"] == v["flo"] and sp.sqrt(v["rh"]) + v["c"] == v["fhi"], "printed endpoint values"
    assert rat(rng.end) == max(v["flo"], v["fhi"])
    return rat(rng.end)


def irrLineCount(v):
    a, b = [int(t) for t in re.match(r"(\d+)x([+-]\d+)?", v["fr"]).groups(default="0")]
    assert (a, b) == (v["a"], v["b"])
    cnt = 0
    ks = []
    for k in range(-300, 301):
        # sqrt(a x + b) = x + k  <=>  a x + b = (x+k)^2 with x + k >= 0
        disc = (2 * k - a) ** 2 - 4 * (k * k - b)
        if disc <= 0:
            continue
        roots = [(-(2 * k - a) + s * sp.sqrt(disc)) / 2 for s in (1, -1)]
        if all(r + k >= 0 for r in roots):
            cnt += 1
            ks.append(k)
    assert ks == list(range(ks[0], ks[-1] + 1)) and (ks[0], ks[-1]) == (v["lo"], v["hi"]), "printed window"
    assert val(v["lt"]) <= ks[0] and ks[0] - 1 < val(v["lt"]) and ks[-1] < val(v["ht"]) <= ks[-1] + 1, "printed bounds"
    return cnt


VERIFY = {
    "cm2_divPoint": divPoint, "cm2_divRatioFind": divRatioFind, "cm2_lineThroughPerp": lineThroughPerp, "cm2_perpParam": perpParam,
    "cm2_pointLineDist": pointLineDist, "cm2_circleGeneral": circleGeneral, "cm2_circleTangentAxes": circleTangentAxes,
    "cm2_lineCircleCount": lineCircleCount, "cm2_chordLength": chordLength, "cm2_tangentAtPoint": tangentAtPoint,
    "cm2_translateCurve": translateCurve, "cm2_reflectPointChain": reflectPointChain, "cm2_reflectCurve": reflectCurve,
    "cm2_reflectShortest": reflectShortest, "cm2_setSumCount": setSumCount, "cm2_setOpSum": setOpSum, "cm2_vennReverse": vennReverse,
    "cm2_inclusionParam": inclusionParam, "cm2_existsInterval": existsInterval,
    "cm2_truthRange": truthRange, "cm2_necessaryDiv": necessaryDiv, "cm2_reflectChainOrder": reflectChainOrder,
    "cm2_sufficientQuad": sufficientQuad, "cm2_amgmMin": amgmMin, "cm2_funcInjective": funcInjective, "cm2_funcMonotone": funcMonotone,
    "cm2_compFindG": compFindG, "cm2_compTable": compTable, "cm2_inverseQuadDom": inverseQuadDom, "cm2_inverseRational": inverseRational,
    "cm2_rationalAsym": rationalAsym, "cm2_rationalParam": rationalParam, "cm2_rationalIntersectCount": rationalIntersectCount,
    "cm2_irrationalPass": irrationalPass, "cm2_irrationalMinMax": irrationalMinMax, "cm2_irrLineCount": irrLineCount,
}
