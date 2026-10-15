"""Independent checks for modules/geo.mjs (기하).

The generators use closed formulas (c^2 = a^2 - b^2, k = c/(4m), ...).  Here every answer is re-derived differently: sympy solving of the
defining equations (focal distances, discriminants, intersections), explicit coordinates for the figures, brute-force enumeration with
uniqueness assertions, and numeric scans for extremum problems.  Variables arrive as the strings / numbers stored in the row.
"""
import math, re
from fractions import Fraction
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

x, y, z, k, t, m, s = sp.symbols("x y z k t m s")
LD = {"x": x, "y": y, "z": z, "k": k, "t": t, "m": m, "s": s}
TR = standard_transformations + (implicit_multiplication_application, convert_xor)


def tex(st):
    st = st.replace("\\ ", " ").replace("\\left", "").replace("\\right", "").replace("\\cdot", "*").replace("\\times", "*")
    for _ in range(12):
        n = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", st)
        n = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", n)
        n = re.sub(r"\^\{([^{}]*)\}", r"^(\1)", n)
        if n == st:
            break
        st = n
    return st


def S(st, **loc):
    return parse_expr(tex(st), transformations=TR, local_dict={**LD, **loc})


def eqF(st, **loc):
    l, r = st.split("=")
    return sp.expand(S(l, **loc) - S(r, **loc))


def nums(st):
    return [int(u) for u in re.findall(r"-?\d+", st)]


def R(val):
    """exact rational when possible"""
    val = sp.nsimplify(sp.simplify(val))
    if val.is_Rational:
        return Fraction(int(val.p), int(val.q))
    return float(val)


def only(vals, msg="answer not unique"):
    vals = list({sp.nsimplify(sp.simplify(u)) for u in vals})
    assert len(vals) == 1, f"{msg}: {vals}"
    return vals[0]


def ell_params(F):
    """(Dx, Dy) denominators of x^2 and y^2 for an equation a x^2 + b y^2 = N written as polynomial F = 0"""
    P = sp.Poly(F, x, y)
    a, b, c0 = P.coeff_monomial(x**2), P.coeff_monomial(y**2), P.coeff_monomial(1)
    assert P.coeff_monomial(x) == 0 and P.coeff_monomial(y) == 0 and P.coeff_monomial(x * y) == 0
    return a, b, c0


# ---------------------------------------------------------------- 1
def parFocusDir(v):
    fx, fy = v["fx"], v["fy"]
    md = re.fullmatch(r"([xy])=(-?\d+)", v["dirEq"]); mc = re.fullmatch(r"([xy])=(-?\d+)", v["cond"])
    line = (x - int(md.group(2))) if md.group(1) == "x" else (y - int(md.group(2)))
    assert line.subs({x: fx, y: fy}) != 0, "focus on directrix"
    expr = ((x - fx) ** 2 + (y - fy) ** 2 - line ** 2).subs(sp.Symbol(mc.group(1)), int(mc.group(2)))
    sols = [u for u in sp.solve(expr, sp.Symbol(v["un"])) if u.is_real]
    assert sols
    return max(sols)


# ---------------------------------------------------------------- 2
def parFocalChord(v):
    mm = re.fullmatch(r"([xy])\^2=(\d+)([xy])", v["eq"])
    c = sp.Integer(int(mm.group(2)))
    if mm.group(1) == "y":
        F, foc, par = (0, 0), (c / 4, 0), y**2 - c * x
    else:
        F, foc, par = (0, 0), (0, c / 4), x**2 - c * y
    slope = S(v["m"])
    assert slope != 0
    sol = sp.solve([par, y - (slope * (x - foc[0]) + foc[1])], [x, y], dict=True)
    assert len(sol) == 2
    d = sp.sqrt((sol[0][x] - sol[1][x]) ** 2 + (sol[0][y] - sol[1][y]) ** 2)
    return R(d)


# ---------------------------------------------------------------- 3 / 4 helpers
def focal_system(F, foci, conds, ask, hyper=False):
    px, py, u, w = sp.symbols("px py u w", real=True)
    (f1x, f1y), (f2x, f2y) = foci
    eqs = [F.subs({x: px, y: py}), u**2 - ((px - f1x) ** 2 + (py - f1y) ** 2), w**2 - ((px - f2x) ** 2 + (py - f2y) ** 2)] + [cnd(px, py, u, w) for cnd in conds]
    sols = sp.solve(eqs, [px, py, u, w], dict=True)
    vals = []
    for so in sols:
        if not all(so[q].is_real for q in (px, py, u, w)):
            continue
        if so[u] <= 0 or so[w] <= 0:
            continue
        vals.append(ask(so[px], so[py], so[u], so[w]))
    assert vals, "no point P exists"
    return only(vals)


def ellipse_foci(F):
    a, b, c0 = ell_params(F)
    assert a * b > 0 and c0 / a < 0
    Dx, Dy = -c0 / a, -c0 / b
    assert Dx != Dy
    c = sp.sqrt(abs(Dx - Dy))
    return ((c, 0), (-c, 0)) if Dx > Dy else ((0, c), (0, -c)), c


def ellipseFocal(v):
    F = eqF(v["eq"])
    foci, c = ellipse_foci(F)
    cond = v["cond"]
    if m1 := re.fullmatch(r"PF=(\d+)", cond):
        conds = [lambda px, py, u, w: u - int(m1.group(1))]
    elif m2 := re.fullmatch(r"PF:PF'=(\d+):(\d+)", cond):
        conds = [lambda px, py, u, w: int(m2.group(2)) * u - int(m2.group(1)) * w]
    elif m3 := re.fullmatch(r"PF-PF'=(-?\d+)", cond):
        conds = [lambda px, py, u, w: u - w - int(m3.group(1))]
    else:
        raise AssertionError("cond")
    ask = (lambda px, py, u, w: u + w + 2 * c) if v["ask"] == "PF+PF'+FF'" else (lambda px, py, u, w: u)
    assert v["ask"] in ("PF+PF'+FF'", "PF")
    return R(focal_system(F, foci, conds, ask))


def hyperFocal(v):
    F = eqF(v["eq"])
    a, b, c0 = ell_params(F)
    assert a * b < 0
    # the transverse axis lies along the variable with the positive coefficient
    c = sp.sqrt(abs(c0 / a) + abs(c0 / b))
    foci = ((c, 0), (-c, 0)) if a > 0 else ((0, c), (0, -c))
    cond = v["cond"]
    if m1 := re.fullmatch(r"PF=(\d+)", cond):
        conds = [lambda px, py, u, w: u - int(m1.group(1))]
    elif m2 := re.fullmatch(r"PF:PF'=(\d+):(\d+)", cond):
        conds = [lambda px, py, u, w: int(m2.group(2)) * u - int(m2.group(1)) * w]
    elif cond == "\\angle FPF'=90^\\circ":
        conds = [lambda px, py, u, w: (foci[0][0] - px) * (foci[1][0] - px) + (foci[0][1] - py) * (foci[1][1] - py)]
    else:
        raise AssertionError("cond")
    asks = {"PF'": lambda px, py, u, w: w, "PF+PF'+FF'": lambda px, py, u, w: u + w + 2 * c, "PF\\times PF'": lambda px, py, u, w: u * w}
    return R(focal_system(F, foci, conds, asks[v["ask"]]))


# ---------------------------------------------------------------- 5
def ellipseFromEq(v):
    F = eqF(v["eq"])
    foci, c = ellipse_foci(F)
    return R(2 * c)


# ---------------------------------------------------------------- 6
def hyperAsym(v):
    F = eqF(v["eq"])
    a, b, c0 = ell_params(F)
    assert a * b < 0 and c0 != 0
    # asymptotes: the quadratic part equal to zero
    sl = sp.solve(a * x**2 + b * y**2, y)
    pos = [q for q in sl if q.subs(x, 1) > 0]
    assert len(pos) == 1
    return R(sp.diff(pos[0], x))


# ---------------------------------------------------------------- 7
def eccentric(v):
    mm = re.fullmatch(r"\\frac\{x\^2\}\{(\w+)\}([+-])\\frac\{y\^2\}\{(\w+)\}=1", v["eq"])
    d1, sign, d2 = mm.group(1), mm.group(2), mm.group(3)
    ev = S(v["e"]) ** 2
    cond = v["cond"]
    hits = []
    for kk in range(1, 3000):
        D1 = kk if d1 == "k" else int(d1); D2 = kk if d2 == "k" else int(d2)
        ok = False
        if mm := re.fullmatch(r"0<k<(\d+)", cond): ok = 0 < kk < int(mm.group(1))
        elif mm := re.fullmatch(r"k>(\d+)", cond): ok = kk > int(mm.group(1))
        else: raise AssertionError("cond")
        if not ok:
            continue
        if sign == "+":
            if D1 == D2:
                continue
            a2 = max(D1, D2); c2 = a2 - min(D1, D2)
        else:
            a2 = D1; c2 = D1 + D2
        if sp.Rational(c2, a2) == ev:
            hits.append(kk)
    assert len(hits) == 1, f"candidates {hits}"
    return hits[0]


# ---------------------------------------------------------------- 8
def conicTangentLine(v):
    F = eqF(v["eq"])
    mm = re.fullmatch(r"y=(.*)", v["ln"])
    line = S(mm.group(1))
    P = sp.Poly(sp.expand(F.subs(y, line)), x)
    assert P.degree() == 2, "line meets the curve in a degree<2 equation"
    sols = sp.solve(sp.discriminant(P.as_expr(), x), k)
    pos = [q for q in sols if q.is_real and q > 0]
    assert len(pos) == 1, f"positive k not unique: {sols}"
    return R(pos[0])


# ---------------------------------------------------------------- 9
def tangentAt(v):
    F = eqF(v["eq"])
    x0, y0 = v["x0"], v["y0"]
    assert F.subs({x: x0, y: y0}) == 0, "P not on the curve"
    fx, fy = sp.diff(F, x).subs({x: x0, y: y0}), sp.diff(F, y).subs({x: x0, y: y0})
    assert fy != 0
    L = fx * (x - x0) + fy * (y - y0)
    xi = sp.solve(L.subs(y, 0), x); yi = sp.solve(L.subs(x, 0), y)
    assert len(xi) == 1 and len(yi) == 1 and xi[0] != 0 and yi[0] != 0
    return R(abs(xi[0] * yi[0]) / 2)


# ---------------------------------------------------------------- 10
def tangentsFromPoint(v):
    F = eqF(v["eq"])
    x1, y1 = v["x1"], v["y1"]
    # no vertical tangent through the point
    dv = sp.discriminant(sp.expand(F.subs(x, x1)), y) if sp.Poly(F.subs(x, x1), y).degree() == 2 else 1
    assert dv != 0, "vertical tangent"
    assert F.subs({x: x1, y: y1}) != 0
    P = sp.expand(F.subs(y, m * x + (y1 - m * x1)))
    Px = sp.Poly(P, x)
    disc = sp.expand(sp.discriminant(P, x)) if Px.degree() == 2 else None
    assert disc is not None
    ms = sp.solve(disc, m)
    ms = [q for q in ms if q.is_real]
    assert len(ms) == 2 and ms[0] != ms[1], f"slopes: {ms}"
    for q in ms:
        lead = sp.Poly(P.subs(m, q), x).coeff_monomial(x**2)
        assert sp.simplify(lead) != 0, "line parallel to an axis/asymptote is not a tangent"
    return R(ms[0] * ms[1])


# ---------------------------------------------------------------- 11
def chordMidpoint(v):
    F = eqF(v["eq"])
    x0, y0 = v["x0"], v["y0"]
    assert y0 != 0
    P = sp.Poly(sp.expand(F.subs(y, y0 + m * (x - x0))), x)
    assert P.degree() == 2
    a2, b2, c2 = P.all_coeffs()
    cand = [q for q in sp.solve(sp.expand(b2 + 2 * x0 * a2), m) if q.is_real]
    assert len(cand) == 1, f"slope not unique: {cand}"
    q = cand[0]
    Pq = sp.Poly(sp.expand(P.as_expr().subs(m, q)), x)
    assert Pq.degree() == 2 and sp.discriminant(Pq.as_expr(), x) > 0, "chord does not exist"
    rts = sp.solve(Pq.as_expr(), x)
    assert sp.simplify((rts[0] + rts[1]) / 2 - x0) == 0
    return R(q)


# ---------------------------------------------------------------- 12
def ellipseRightTri(v):
    F = eqF(v["eq"])
    foci, c = ellipse_foci(F)
    px, py = sp.symbols("px py", real=True)
    (f1x, f1y), (f2x, f2y) = foci
    sol = sp.solve([F.subs({x: px, y: py}), (f1x - px) * (f2x - px) + (f1y - py) * (f2y - py)], [px, py], dict=True)
    sol = [q for q in sol if q[px].is_real and q[py].is_real]
    assert len(sol) == 4, f"expected 4 points with a right angle at P, got {len(sol)}"
    ar = {sp.simplify(abs((f1x - f2x) * (q[py] - f2y) - (f1y - f2y) * (q[px] - f2x)) / 2) for q in sol}
    return R(only(ar))


# ---------------------------------------------------------------- 13
def conicLattice(v):
    eq = v["eq"]
    bound = None
    if "\\ (" in eq:
        eq, rest = eq.split("\\ (")
        mb = re.fullmatch(r"0<x\\le (\d+)\)", rest)
        bound = int(mb.group(1))
    F = sp.lambdify((x, y), eqF(eq), "math")
    n = 0
    for xx in range(-110, 111):
        if bound is not None and not (0 < xx <= bound):
            continue
        for yy in range(-110, 111):
            if F(xx, yy) == 0:
                n += 1
    # the listed points must be exactly the counted ones
    pts = re.findall(r"\((-?\d+),\\ (-?\d+)\)", v["sols"])
    assert len(pts) == n, "listed points differ from the enumeration"
    return n


# ---------------------------------------------------------------- 14
def conicGeneral(v):
    F = eqF(v["eq"])
    P = sp.Poly(F, x, y)
    A, C = P.coeff_monomial(x**2), P.coeff_monomial(y**2)
    D, E, F0 = P.coeff_monomial(x), P.coeff_monomial(y), P.coeff_monomial(1)
    assert P.coeff_monomial(x * y) == 0
    if A != 0 and C != 0:
        h, kk = -D / (2 * A), -E / (2 * C)
        K = F.subs({x: h, y: kk})
        Dx, Dy = -K / A, -K / C
        if A * C > 0:
            assert Dx > 0 and Dy > 0 and Dx > Dy, "ellipse must have its major axis along x"
            c = sp.sqrt(Dx - Dy)
        else:
            assert Dx > 0 and Dy < 0, "hyperbola must open along x"
            c = sp.sqrt(Dx - Dy)
        return R(h + c + kk)
    if C != 0:   # (y-k)^2 = 4p (x-h)
        kk = -E / (2 * C); xv = sp.solve(F.subs(y, kk), x)[0]
        # 4p: coefficient of x in  C (y-k)^2 = -D x - ...  => (y-k)^2 = (-D/C)(x - xv)
        four_p = -D / C
        return R(xv + four_p / 4 + kk)
    h = -D / (2 * A); yv = sp.solve(F.subs(x, h), y)[0]
    four_p = -E / A
    return R(h + yv + four_p / 4)


# ---------------------------------------------------------------- 15
def parMinSum(v):
    mm = re.fullmatch(r"([xy])\^2=(\d+)([xy])", v["eq"])
    c = int(mm.group(2)); horiz = mm.group(1) == "y"
    xa, ya = v["xa"], v["ya"]
    assert (ya * ya < c * xa) if horiz else (xa * xa < c * ya), "A is not inside the parabola"
    def f(tt):
        if horiz:
            px_, py_ = tt * tt / c, tt; fx_, fy_ = c / 4, 0
        else:
            px_, py_ = tt, tt * tt / c; fx_, fy_ = 0, c / 4
        return math.hypot(px_ - xa, py_ - ya) + math.hypot(px_ - fx_, py_ - fy_)
    best = min((f(i / 100), i / 100) for i in range(-8000, 8001))
    lo, hi = best[1] - 0.02, best[1] + 0.02
    for _ in range(200):   # ternary refinement around the best grid point
        a_, b_ = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if f(a_) < f(b_): hi = b_
        else: lo = a_
    mn = f((lo + hi) / 2)
    assert abs(mn - round(mn * 2) / 2) < 1e-6, f"minimum {mn}"
    return Fraction(round(mn * 2), 2)


# ---------------------------------------------------------------- 16
def ellipseExtSum(v):
    F = eqF(v["eq"])
    a_, b_, c0 = ell_params(F)
    Dx, Dy = -c0 / a_, -c0 / b_
    ax, by = math.sqrt(Dx), math.sqrt(Dy)
    fx, fy, xa, ya = v["fx"], v["fy"], v["xa"], v["ya"]
    assert xa * xa / Dx + ya * ya / Dy < 1, "A not inside"
    assert abs((fx * fx + fy * fy) - abs(Dx - Dy)) < 1e-9, "F is not a focus"
    N = 400000
    vals = []
    for i in range(N):
        th = 2 * math.pi * i / N
        px, py = ax * math.cos(th), by * math.sin(th)
        vals.append(math.hypot(px - xa, py - ya) + math.hypot(px - fx, py - fy))
    mx, mn = max(vals), min(vals)
    pr = mx * mn
    assert abs(pr - round(pr)) < 1e-3, f"product {pr}"
    return Fraction(round(pr))


# ---------------------------------------------------------------- space
def spaceDist(v):
    A = sp.Point3D(*nums(v["pa"])); B = sp.Point3D(*nums(v["pb"]))
    return R(A.distance(B))


def divPoint(v):
    A, B = nums(v["pa"]), nums(v["pb"])
    lam = sp.symbols("lam", real=True)
    P = [a + lam * (b - a) for a, b in zip(A, B)]
    dAP = sp.sqrt(sum((p - a) ** 2 for p, a in zip(P, A))); dPB = sp.sqrt(sum((p - b) ** 2 for p, b in zip(P, B)))
    m_, n_ = v["m"], v["n"]
    sol = [q for q in sp.solve(sp.expand(n_**2 * sum((p - a) ** 2 for p, a in zip(P, A)) - m_**2 * sum((p - b) ** 2 for p, b in zip(P, B))), lam) if q.is_real and 0 < q < 1]
    assert len(sol) == 1
    pt = [p.subs(lam, sol[0]) for p in P]
    assert pt == nums(v["pp"]), "stated point differs"
    return R(sum(pt))


def divRatioPlane(v):
    A, B = nums(v["pa"]), nums(v["pb"])
    idx = "xyz".index(v["pl"][0])
    assert v["pl"][1:] == "=0"
    lam = sp.symbols("lam")
    q = sp.solve(A[idx] + lam * (B[idx] - A[idx]), lam)[0]
    assert 0 < q < 1, "segment does not cross the plane"
    q = Fraction(int(q.p), int(q.q))   # AP:PB = q : (1-q) = p : (den-p) in lowest terms
    mm, nn = q.numerator, q.denominator - q.numerator
    assert math.gcd(mm, nn) == 1
    assert (mm, nn) == (v["m"], v["n"])
    return mm + nn


def sphereExpand(v):
    F = eqF(v["eq"])
    C = sp.solve([sp.diff(F, q) for q in (x, y, z)], [x, y, z], dict=True)[0]
    r2 = sp.expand(-F.subs(C))   # F = |X - C|^2 - r^2
    sol = sp.solve(sp.Eq(r2, v["rad"] ** 2), s)
    assert len(sol) == 1
    return R(sol[0])


def sphereSection(v):
    F = eqF(v["eq"])
    ax, val = v["pl"].split("=")
    rest = [q for q in (x, y, z) if q.name != ax]
    G = F.subs(sp.Symbol(ax), int(val))
    C = sp.solve([sp.diff(G, q) for q in rest], rest, dict=True)[0]
    r2 = -G.subs(C)
    assert r2 > 0
    assert sp.Rational(r2).q == 1
    return R(r2)


def sphereTangentPlane(v):
    C = sp.Point3D(*nums(v["cc"]))
    mm = re.fullmatch(r"(.*)=k", v["pl"])
    L = S(mm.group(1))
    a, b, c = (sp.diff(L, q) for q in (x, y, z))
    kr = sp.Symbol("kr", real=True)
    pl = sp.Plane(sp.Point3D(0, 0, kr / c), normal_vector=(a, b, c))
    sols = sp.solve(sp.Eq(pl.distance(C), v["rad"]), kr)
    assert len(sols) == 2
    return R(max(sols))


def _lc(ex, a, b):
    A_, B_ = sp.symbols("A_ B_")
    e = S(ex.replace("\\vec a", "A_").replace("\\vec b", "B_"), A_=A_, B_=B_)
    ca, cb = e.coeff(A_), e.coeff(B_)
    return [ca * p + cb * q for p, q in zip(a, b)]


def vecLinComb(v):
    a, b = nums(v["va"]), nums(v["vb"])
    w = _lc(v["ex"], a, b)
    assert w == nums(v["wv"])
    return R(sp.sqrt(sum(q**2 for q in w)))


def vecDecompose(v):
    a, b, c = nums(v["va"]), nums(v["vb"]), nums(v["vc"])
    sol = sp.solve([m * p + s * q - r for p, q, r in zip(a, b, c)], [m, s], dict=True)
    assert len(sol) == 1 and sp.Matrix([a, b]).rank() == 2
    n = sp.Symbol("n")
    ask = S(v["ask"], n=n)
    return R(ask.subs({m: sol[0][m], n: sol[0][s]}))


def dotNormExpand(v):
    na, nb, dt = v["na"], v["nb"], v["dt"]
    # explicit coordinates: a = (na, 0), b = (dt/na, e)
    e = sp.sqrt(sp.Integer(nb) ** 2 - sp.Rational(dt, na) ** 2)
    assert sp.simplify(e**2) > 0, "|a.b| must be smaller than |a||b|"
    a, b = sp.Matrix([na, 0]), sp.Matrix([sp.Rational(dt, na), e])
    w = sp.Matrix(_lc(v["ex"], a, b))
    return R(w.dot(w))


def dotFromNorms(v):
    na, nb, uu = v["na"], v["nb"], v["uu"]
    d, e = sp.symbols("d e", real=True)
    sg = 1 if v["ex"] == "\\vec a+\\vec b" else -1
    sol = sp.solve([d**2 + e**2 - nb**2, (na + sg * d) ** 2 + (sg * e) ** 2 - uu**2], [d, e], dict=True)
    sol = [q for q in sol if q[d].is_real and q[e].is_real]
    assert sol, "no such vectors"
    return R(only([na * q[d] for q in sol]))


def dotAngle(v):
    a, b = nums(v["va"]), nums(v["vb"])
    dt = sum(p * q for p, q in zip(a, b))
    assert dt == v["dt"]
    ang = math.degrees(math.acos(dt / (math.sqrt(sum(p * p for p in a)) * math.sqrt(sum(q * q for q in b)))))
    assert abs(ang - round(ang)) < 1e-7, ang
    return round(ang)


def _vec_t(st):
    inner = st.strip()[1:-1]
    return [S(c) for c in inner.split(",\\ ")]


def vecOrthoParam(v):
    a, b = _vec_t(v["va"]), _vec_t(v["vb"])
    f = sp.expand(sum(p * q for p, q in zip(a, b)) - v["dd"])
    sol = [q for q in sp.solve(f, t) if q.is_real]
    assert sol
    return R(max(sol))


def vecCircleEq(v):
    A, B = nums(v["pa"]), nums(v["pb"])
    X = sp.symbols("X0:3")[: len(A)]
    F = sp.expand(sum((q - a) * (q - b) for q, a, b in zip(X, A, B)))
    C = sp.solve([sp.diff(F, q) for q in X], X, dict=True)[0]
    r2 = -F.subs(C)
    assert r2 > 0
    return R(sp.sqrt(r2))


def _sym_line(st):
    parts = st.split("=")
    out = []
    for p in parts:
        mm = re.fullmatch(r"\\frac\{(.*)\}\{(.*)\}", p)
        out.append((S(mm.group(1)), S(mm.group(2))))
    return out


def lineIntersectParam(v):
    L1, L2 = _sym_line(v["l1"]), _sym_line(v["l2"])
    s_, t_ = sp.symbols("s_ t_")
    X = [x, y, z]
    pt1 = [sp.solve(sp.Eq(num / den, s_), var)[0] for (num, den), var in zip(L1, X)]
    # second line: (num)/(den) = t_  with den possibly containing k; points are  var = var0 + den*t_
    pt2 = []
    for (num, den), var in zip(L2, X):
        pt2.append(sp.solve(sp.Eq(num, den * t_), var)[0])
    sol = sp.solve([p - q for p, q in zip(pt1, pt2)], [s_, t_, k], dict=True)
    sol = [q for q in sol if q[k] != 0]
    assert len(sol) == 1, f"k not unique: {sol}"
    return R(sol[0][k])


def lineSpacePoint(v):
    L = _sym_line(v["ln"])
    s_ = sp.Symbol("s_")
    pt = [sp.solve(sp.Eq(num / den, s_), var)[0] for (num, den), var in zip(L, [x, y, z])]
    mm = re.fullmatch(r"([xyz])=(-?\d+)", v["cond"])
    idx = "xyz".index(mm.group(1))
    sol = sp.solve(sp.Eq(pt[idx], int(mm.group(2))), s_)
    assert len(sol) == 1
    P = [q.subs(s_, sol[0]) for q in pt]
    assert [int(q) for q in P] == nums(v["pt"]), "stated point differs"
    return R(sum(P) - P[idx])


def lineVec2D(v):
    x1, y1, u1, u2 = v["x1"], v["y1"], v["u1"], v["u2"]
    # the line through A with direction u:  u2 (x - x1) - u1 (y - y1) = 0
    L2 = eqF(v["ln"])
    sol = sp.solve([u2 * (x - x1) - u1 * (y - y1), L2], [x, y], dict=True)
    assert len(sol) == 1
    assert [sol[0][x], sol[0][y]] == nums(v["pt"])
    return R(sol[0][x] + sol[0][y])


def planeNormal(v):
    A, n = nums(v["pa"]), nums(v["vn"])
    pl = sp.Plane(sp.Point3D(*A), normal_vector=n)
    d = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[v["ax"]]
    inter = pl.intersection(sp.Line3D(sp.Point3D(0, 0, 0), sp.Point3D(*d)))
    assert len(inter) == 1 and isinstance(inter[0], sp.Point3D), "plane parallel to the axis"
    return R(inter[0].coordinates["xyz".index(v["ax"])])


def projPlaneArea(v):
    mm = re.fullmatch(r"(.*)=(-?\d+)", v["pl"])
    L = S(mm.group(1)); n = [sp.diff(L, q) for q in (x, y, z)]
    u = sp.Matrix(n).cross(sp.Matrix([1, 0, 0]))
    if u == sp.zeros(3, 1):
        u = sp.Matrix(n).cross(sp.Matrix([0, 1, 0]))
    w = sp.Matrix(n).cross(u)                   # u, w span the plane
    assert sp.Matrix(n).dot(u) == 0 and sp.Matrix(n).dot(w) == 0
    nrm = u.cross(w)
    idx = {"xy": 2, "yz": 0, "zx": 1}[v["cp"]]
    return R(v["ar"] * abs(nrm[idx]) / nrm.norm())


def projEllipse(v):
    cs = S(v["cs"]); sn = sp.sqrt(1 - cs**2)
    n_al = sp.Matrix([0, sn, cs])                # unit normal of alpha; beta = xy-plane has normal (0,0,1): cos(angle) = cs
    basis = n_al.T.nullspace()
    b1 = basis[0]; b2 = basis[1]
    b2 = b2 - b1 * (b1.dot(b2) / b1.dot(b1))
    b1, b2 = b1 / b1.norm(), b2 / b2.norm()
    M = v["rr"] * sp.Matrix([[b1[0], b2[0]], [b1[1], b2[1]]])   # projection of the circle r(cos t b1 + sin t b2) to the xy-plane
    ev = sorted((M * M.T).eigenvals().keys(), key=lambda q: float(q))
    a2, b2_ = ev[1], ev[0]
    assert abs(sp.simplify(sp.sqrt(b2_)) - v["bb"]) == 0
    return R(2 * sp.sqrt(a2 - b2_))


def threePerp(v):
    h, d, e = sp.symbols("h d e", positive=True)
    P = sp.Point3D(0, d, h); H = sp.Point3D(0, d, 0); K = sp.Point3D(0, 0, 0); A = sp.Point3D(e, 0, 0)
    assert (P - K).dot(sp.Point3D(1, 0, 0)) == 0   # PK is perpendicular to l (three perpendiculars theorem)
    dist = {"PH": P.distance(H), "HK": H.distance(K), "PK": P.distance(K), "PA": P.distance(A), "AK": A.distance(K)}
    eqs = [dist[nm] ** 2 - int(val) ** 2 for nm, val in re.findall(r"([A-Z]{2})=(\d+)", v["giv"])]
    target = dist[v["ask"]]
    unknown = sorted(set().union(*[q.free_symbols for q in eqs]) | target.free_symbols, key=str)
    sol = sp.solve(eqs, unknown, dict=True)
    assert sol, "no configuration exists"
    vals = [sp.simplify(target.subs(q)) for q in sol]
    assert all(not q.free_symbols for q in vals), f"the asked length is not determined by the givens: {vals}"
    return R(only(vals))


VERIFY = {
    "geo_parFocusDir": parFocusDir, "geo_parFocalChord": parFocalChord, "geo_ellipseFocal": ellipseFocal, "geo_hyperFocal": hyperFocal,
    "geo_ellipseFromEq": ellipseFromEq, "geo_hyperAsym": hyperAsym, "geo_eccentric": eccentric, "geo_conicTangentLine": conicTangentLine,
    "geo_tangentAt": tangentAt, "geo_tangentsFromPoint": tangentsFromPoint, "geo_chordMidpoint": chordMidpoint, "geo_ellipseRightTri": ellipseRightTri,
    "geo_conicLattice": conicLattice, "geo_conicGeneral": conicGeneral, "geo_parMinSum": parMinSum, "geo_ellipseExtSum": ellipseExtSum,
    "geo_spaceDist": spaceDist, "geo_divPoint": divPoint, "geo_divRatioPlane": divRatioPlane, "geo_sphereExpand": sphereExpand,
    "geo_sphereSection": sphereSection, "geo_sphereTangentPlane": sphereTangentPlane, "geo_vecLinComb": vecLinComb, "geo_vecDecompose": vecDecompose,
    "geo_dotNormExpand": dotNormExpand, "geo_dotFromNorms": dotFromNorms, "geo_dotAngle": dotAngle, "geo_vecOrthoParam": vecOrthoParam,
    "geo_vecCircleEq": vecCircleEq, "geo_lineIntersectParam": lineIntersectParam, "geo_lineSpacePoint": lineSpacePoint, "geo_lineVec2D": lineVec2D,
    "geo_planeNormal": planeNormal, "geo_projPlaneArea": projPlaneArea, "geo_projEllipse": projEllipse, "geo_threePerp": threePerp,
}
