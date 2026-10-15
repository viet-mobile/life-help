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


def chain(st):
    """Check a purely numeric displayed working such as '(-2)^2=4<8\\times 2=16': every '=' holds and every '<' holds, evaluated with sympy
    (so a notation error like '-2^2=4' is caught: sympy reads it as -4).  Returns the value of the last operand."""
    parts = re.split(r"([=<])", tex(st))
    vals = [sp.nsimplify(S(q)) if q.strip() else None for q in parts[0::2]]
    ops = parts[1::2]
    for (u, w, op) in zip(vals, vals[1:], ops):
        assert u is not None and w is not None and not (u.free_symbols or w.free_symbols), f"working not numeric: {st}"
        assert (u == w) if op == "=" else (u < w), f"displayed working is wrong: {st}"
    return vals[-1]


def last_is(st, expected):
    """the last '='-operand of a displayed working (when numeric) equals the answer"""
    q = S(tex(st).split("=")[-1].split(",")[-1])
    if not q.free_symbols:
        assert sp.nsimplify(q) == sp.nsimplify(expected), f"working ends with {q}, answer {expected}: {st}"


def proportional(f1, f2, msg):
    """f1 = const * f2 (both polynomials in x, y, ...), const != 0"""
    q = sp.cancel(sp.expand(f1) / sp.expand(f2))
    assert q.is_number and q != 0, f"{msg}: not proportional ({q})"


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
    # the displayed parabola equation is the focus-directrix equation itself
    assert sp.expand(eqF(v["eqn"]) - sp.expand((x - fx) ** 2 + (y - fy) ** 2 - line ** 2)) == 0, "displayed equation differs from the focus/directrix equation"
    return max(sols)



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
    asks = {"PF": lambda px, py, u, w: u, "PF'": lambda px, py, u, w: w, "PF'+FF'": lambda px, py, u, w: w + 2 * c}
    ans = R(focal_system(F, foci, conds, asks[v["ask"]]))
    assert v["a"] * 2 == v["tw"] and v["c"] * 2 == v["tc"] and 2 * c == v["tc"], "a, c, 2a, 2c shown in the working differ from the curve"
    last_is(v["work"], ans)
    return ans


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
    ans = R(focal_system(F, foci, conds, asks[v["ask"]]))
    assert 2 * c == v["tc"] and v["tw"] == 2 * v["a"] and v["ca"] == c - v["a"], "a, c shown in the working differ from the curve"
    if "work2" in v:   # level 1: PF < c+a, so PF' = PF + 2a; PF' = PF - 2a would be shorter than c-a
        d1 = int(re.fullmatch(r"PF=(\d+)", cond).group(1))
        assert d1 < c + v["a"], "PF >= c+a"
        chain(v["alt"])
        assert d1 - v["tw"] < c - v["a"], "the excluded branch is not excluded"
        assert S(v["work2"].split("=")[-1]) == ans
    else:
        last_is(v["work"], ans)
    return ans


# ---------------------------------------------------------------- 7
def conicParam(v):
    mm = re.fullmatch(r"\\frac\{x\^2\}\{(\w+)\}([+-])\\frac\{y\^2\}\{(\w+)\}=1", v["eq"])
    cond = v["cond"]
    fd = v["fd"]
    F = eqF(v["eq"])                                    # still contains the symbol k
    Pk = sp.Poly(sp.expand(F), x, y)
    ca, cb, c0k = Pk.coeff_monomial(x**2), Pk.coeff_monomial(y**2), Pk.coeff_monomial(1)
    fDx = sp.lambdify(k, -c0k / ca, "math"); fDy = sp.lambdify(k, -c0k / cb, "math")
    hits = []
    for kk in range(1, 6000):
        if m1 := re.fullmatch(r"0<k<(\d+)", cond): ok = 0 < kk < int(m1.group(1))
        elif m1 := re.fullmatch(r"k>(\d+)", cond): ok = kk > int(m1.group(1))
        else: raise AssertionError("cond")
        if not ok:
            continue
        Dx, Dy = fDx(Fraction(kk)), fDy(Fraction(kk))
        if mm.group(2) == "+":
            if Dx == Dy or Dx <= 0 or Dy <= 0:
                continue
            c2 = abs(Dx - Dy)
        else:
            assert Dx * Dy < 0
            c2 = abs(Dx) + abs(Dy)
        if 4 * c2 == fd**2:
            hits.append(kk)
    assert len(hits) == 1, f"candidates {hits}"
    assert v["c"] * 2 == fd and v["c2"] == v["c"] ** 2
    pieces = [S(q) for q in tex(v["work"]).split("=")]   # c^2 = (expression in k) = number
    assert all(sp.nsimplify(q.subs(k, hits[0])) == v["c2"] for q in pieces[1:]), "displayed working differs"
    return hits[0]


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
    ans = R(sp.diff(pos[0], x))
    # the displayed asymptotes y = +-(n/d) x are in lowest terms and agree
    mm = re.fullmatch(r"y=\\pm ?(.*)x", v["asy"])
    shown = S(mm.group(1) or "1")
    assert sp.nsimplify(shown) == sp.nsimplify(pos[0].subs(x, 1)), "displayed asymptote differs"
    fr = re.fullmatch(r"\\frac\{(\d+)\}\{(\d+)\}", mm.group(1))
    if fr:
        assert math.gcd(int(fr.group(1)), int(fr.group(2))) == 1, "asymptote slope not in lowest terms"
    # the displayed standard form has the same graph as the given equation
    proportional(eqF(v["std"]), F, "std form")
    return ans


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
    ans = R(pos[0])
    # displayed quadratic in x is the substituted equation (up to a constant factor)
    q = sp.expand(eqF(v["quad"]))
    proportional(q, P.as_expr(), "displayed quadratic")
    # displayed discriminant working
    w = v["work"]
    if w.startswith("D="):          # parabola: D=(2mk-c)^2-4m^2k^2=c^2-4mck=0
        parts = w.split("=")
        D = sp.discriminant(P.as_expr(), x)
        assert sp.expand(S(parts[1]) - D) == 0 and sp.expand(S(parts[2]) - D) == 0, "displayed D differs from the discriminant"
        assert parts[3] == "0"
    else:                           # D/4 = AB(...) = 0  =>  k^2 = ...
        left, right = w.split("\\Rightarrow")
        d4 = S(left.split("=")[1])
        assert sp.expand(d4 - sp.discriminant(sp.expand(eqF(v["quad"])), x) / 4) == 0, "displayed D/4 differs from the discriminant of the displayed quadratic"
        chain(right.split("=", 1)[1])
        assert S(right.split("=")[-1]) == pos[0] ** 2
    return ans


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
    # displayed tangent line and intercepts
    proportional(eqF(v["tan"]), L, "displayed tangent line")
    assert sp.nsimplify(S(v["xi"])) == xi[0] and sp.nsimplify(S(v["yi"])) == yi[0], "displayed intercepts differ"
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
    ans = R(ms[0] * ms[1])
    # displayed quadratic in m is the discriminant condition, displayed product agrees
    proportional(sp.expand(S(v["quad"])), disc, "displayed quadratic in m")
    assert sp.nsimplify(S(v["prod"])) == sp.nsimplify(ms[0] * ms[1]), "displayed product differs"
    proportional(eqF(v["lnp"]), y - y1 - m * (x - x1), "displayed line")
    return ans


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
    ans = R(only(ar))
    a_, b_, c0 = ell_params(F)
    Dx, Dy = -c0 / a_, -c0 / b_
    A2, B2 = max(Dx, Dy), min(Dx, Dy)
    assert (v["a2"], v["b2"], v["c2"]) == (A2, B2, A2 - B2) and v["tw"] == 2 * sp.sqrt(A2) and v["tc"] == 2 * c and v["tc2"] == 4 * c**2, "numbers of the working differ"
    assert 2 * v["pr"] == v["tw"] ** 2 - v["tc2"] and sp.Rational(v["pr"], 2) == ans, "PF.PF' in the working differs"
    return ans


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
        ans = R(h + c + kk)
    elif C != 0:   # (y-k)^2 = 4p (x-h)
        kk = -E / (2 * C); xv = sp.solve(F.subs(y, kk), x)[0]
        # 4p: coefficient of x in  C (y-k)^2 = -D x - ...  => (y-k)^2 = (-D/C)(x - xv)
        four_p = -D / C
        ans = R(xv + four_p / 4 + kk)
    else:
        h = -D / (2 * A); yv = sp.solve(F.subs(x, h), y)[0]
        four_p = -E / A
        ans = R(h + yv + four_p / 4)
    # the displayed standard form is the same curve, the displayed focus is the one asked for
    proportional(eqF(v["std"]), F, "standard form")
    assert sum(nums(v["foc"])) == ans, "displayed focus differs"
    return ans


# ---------------------------------------------------------------- 15
def parMinSum(v):
    mm = re.fullmatch(r"([xy])\^2=(\d+)([xy])", v["eq"])
    c = int(mm.group(2)); horiz = mm.group(1) == "y"
    xa, ya = v["xa"], v["ya"]
    assert (ya * ya < c * xa) if horiz else (xa * xa < c * ya), "A is not inside the parabola"
    chain(v["chk"])      # the displayed inside-check re-evaluates (negative coordinates bracketed)
    w = ya if horiz else xa
    assert S(v["chk"].split("^2")[0]) == w and chain(v["chk"]) == c * (xa if horiz else ya), "displayed check differs from A and the parabola"
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
    assert abs(mn - round(mn * 2) / 2) < 1e-9, f"minimum {mn}"
    # the directrix shown is the focus-directrix line of the parabola
    dd = re.fullmatch(r"([xy])=-(\d+)", v["dir"]); assert int(dd.group(2)) * 4 == c
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
    def g(th):
        px, py = ax * math.cos(th), by * math.sin(th)
        return math.hypot(px - xa, py - ya) + math.hypot(px - fx, py - fy)
    N = 200000
    vals = [g(2 * math.pi * i / N) for i in range(N)]
    def refine(i, sign):
        lo, hi = 2 * math.pi * (i - 1) / N, 2 * math.pi * (i + 1) / N
        for _ in range(200):
            a1, b1 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
            if sign * g(a1) < sign * g(b1): hi = b1
            else: lo = a1
        return g((lo + hi) / 2)
    mx = refine(max(range(N), key=vals.__getitem__), -1)
    mn = refine(min(range(N), key=vals.__getitem__), 1)
    pr = mx * mn
    assert abs(pr - round(pr)) < 1e-6, f"product {pr}"
    # the numbers of the working: a, AF', max and min
    a = max(ax, by)
    assert abs(a - v["a"]) < 1e-9 and abs(mx - v["mx"]) < 1e-6 and abs(mn - v["mn"]) < 1e-6, "working numbers differ"
    assert abs(math.hypot(xa + fx, ya + fy) - v["dd"]) < 1e-9, "AF' differs"
    return Fraction(round(pr))


# ---------------------------------------------------------------- space
def spaceDist(v):
    A = sp.Point3D(*nums(v["pa"])); B = sp.Point3D(*nums(v["pb"]))
    assert [v["dx"], v["dy"], v["dz"]] == [b - a for a, b in zip(A, B)] and v["sq"] == v["dx"] ** 2 + v["dy"] ** 2 + v["dz"] ** 2, "working differs"
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
    # displayed completed squares: sum of squares equals s4 - s, i.e. the same sphere
    std = eqF(v["std"])
    assert sp.expand(std - F) == 0, "displayed completed-square form differs from the equation"
    assert v["rad2"] == v["rad"] ** 2 and v["s4"] == sum(c**2 for c in C.values())
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
    # center, R^2 and distance shown in the working
    C3 = sp.solve([sp.diff(sp.expand(F), q) for q in (x, y, z)], [x, y, z], dict=True)[0]
    assert [C3[x], C3[y], C3[z]] == nums(v["cc"]) and v["rr2"] == -sp.expand(F).subs(C3)
    assert v["dd"] == abs(C3[sp.Symbol(ax)] - int(val)), "distance centre-plane differs"
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
    # numbers in the working: |n|, n.C, R|n|
    assert nums(v["nv"]) == [a, b, c] and v["nn"] ** 2 == a * a + b * b + c * c and v["dc"] == a * C[0] + b * C[1] + c * C[2] and v["rl"] == v["rad"] * v["nn"]
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
    # displayed m, n and two displayed component equations
    assert sp.nsimplify(S(v["mt"])) == sol[0][m] and sp.nsimplify(S(v["nt"])) == sol[0][s], "displayed m, n differ"
    for e1 in v["eqs"].split(",\\ "):
        lhs = eqF(e1, n=n)
        assert sp.expand(lhs.subs({m: sol[0][m], n: sol[0][s]})) == 0, "displayed component equation is not satisfied"
    return R(ask.subs({m: sol[0][m], n: sol[0][s]}))


def dotNormExpand(v):
    na, nb, dt = v["na"], v["nb"], v["dt"]
    # explicit coordinates: a = (na, 0), b = (dt/na, e)
    e = sp.sqrt(sp.Integer(nb) ** 2 - sp.Rational(dt, na) ** 2)
    assert sp.simplify(e**2) > 0, "|a.b| must be smaller than |a||b|"
    a, b = sp.Matrix([na, 0]), sp.Matrix([sp.Rational(dt, na), e])
    w = sp.Matrix(_lc(v["ex"], a, b))
    ans = R(w.dot(w))
    assert chain(v["calc"]) == sp.nsimplify(w.dot(w)), "displayed expansion differs"
    return ans


def dotAngle(v):
    a, b = nums(v["va"]), nums(v["vb"])
    dt = sum(p * q for p, q in zip(a, b))
    assert dt == v["dt"] and sum(p * p for p in a) == v["na2"] and sum(q * q for q in b) == v["nb2"] and v["pr"] == v["na2"] * v["nb2"]
    cosv = dt / (math.sqrt(sum(p * p for p in a)) * math.sqrt(sum(q * q for q in b)))
    a3, b3 = a + [0] * (3 - len(a)), b + [0] * (3 - len(b))
    cr = [a3[1] * b3[2] - a3[2] * b3[1], a3[2] * b3[0] - a3[0] * b3[2], a3[0] * b3[1] - a3[1] * b3[0]]
    ang = math.degrees(math.atan2(math.sqrt(sum(q * q for q in cr)), dt))      # exact-ish also for 0 and 180 degrees
    assert abs(ang - round(ang)) < 1e-7, ang
    # displayed simplified root and cosine
    rt = S(v["rt"]); assert sp.simplify(rt**2 - v["pr"]) == 0 and rt > 0, "displayed sqrt differs"
    assert abs(float(S(v["cs"])) - cosv) < 1e-12 and sp.simplify(sp.Rational(dt) / rt - S(v["cs"])) == 0, "displayed cosine differs"
    return round(ang)


def _vec_t(st):
    inner = st.strip()[1:-1]
    return [S(c) for c in inner.split(",\\ ")]


def vecOrthoParam(v):
    a, b = _vec_t(v["va"]), _vec_t(v["vb"])
    f = sp.expand(sum(p * q for p, q in zip(a, b)) - v["dd"])
    sol = [q for q in sp.solve(f, t) if q.is_real]
    assert sol
    # displayed dot product expression and solution list
    assert sp.expand(S(v["dexp"]) - sum(p * q for p, q in zip(a, b))) == 0, "displayed a.b differs"
    shown = sorted(S(u.split("=")[-1]) if "=" in u else S(u) for u in v["sol"].replace("t=", "").split(",\\ "))
    assert sorted(sol) == shown, "displayed solutions differ"
    return R(max(sol))


def vecCircleEq(v):
    A, B = nums(v["pa"]), nums(v["pb"])
    X = sp.symbols("X0:3")[: len(A)]
    F = sp.expand(sum((q - a) * (q - b) for q, a, b in zip(X, A, B)))
    C = sp.solve([sp.diff(F, q) for q in X], X, dict=True)[0]
    r2 = -F.subs(C)
    assert r2 > 0
    assert v["ab"] ** 2 == sum((a - b) ** 2 for a, b in zip(A, B)), "displayed AB differs"
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
    assert sol[0][s_] == v["ss"] and sol[0][t_] == v["tt"], "displayed s, t differ"
    # displayed coordinate equations are satisfied by the solution
    sub_ = {s_.name: sol[0][s_], t_.name: sol[0][t_], "k": sol[0][k]}
    for e1 in (v["xy"].split(",\\ ") + [v["eq3"]]):
        lhs = eqF(e1, s=s_, t=t_)
        assert lhs.subs({s_: sol[0][s_], t_: sol[0][t_], k: sol[0][k]}) == 0, f"displayed equation not satisfied: {e1}"
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


def planeNormal(v):
    A, n = nums(v["pa"]), nums(v["vn"])
    pl = sp.Plane(sp.Point3D(*A), normal_vector=n)
    d = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[v["ax"]]
    inter = pl.intersection(sp.Line3D(sp.Point3D(0, 0, 0), sp.Point3D(*d)))
    assert len(inter) == 1 and isinstance(inter[0], sp.Point3D), "plane parallel to the axis"
    proportional(eqF(v["plane"]), sum(c * (q - a) for c, q, a in zip(n, (x, y, z), A)), "displayed plane")
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
    # working: normal, length, the signed coefficient and the absolute value used for cos(theta)
    assert nums(v["nv"]) == n and v["nn"] ** 2 == sum(q * q for q in n)
    assert v["ns"] == n[idx] and v["ni"] == abs(n[idx]) and nums(v["cn"]) == [int(i == idx) for i in range(3)], "signed/absolute coefficient differs"
    assert v["ar"] % 1 == 0
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
    assert sp.simplify(sp.sqrt(a2) - v["rr"]) == 0 and sp.simplify(sp.sqrt(a2 - b2_) - v["cc"]) == 0, "displayed a or c differ"
    return R(2 * sp.sqrt(a2 - b2_))


def threePerp(v):
    """The geometry is built WITHOUT using the three-perpendiculars theorem: alpha is the plane z=0, l the x-axis, H a point of alpha, K the
    foot of the perpendicular from H to l (computed by sympy), P lies above H (PH perpendicular to alpha).  PK is then a computed segment, and
    d is the distance from P to the line l computed by sympy, so PK = d is checked rather than assumed."""
    h, dd, e = sp.symbols("h dd e", positive=True)
    ell = sp.Line3D(sp.Point3D(0, 0, 0), sp.Point3D(1, 0, 0))
    H = sp.Point3D(3, dd, 0)                    # a generic point of alpha: z = 0
    P = sp.Point3D(3, dd, h)                    # PH perpendicular to alpha
    K = ell.projection(H)                       # foot of the perpendicular from H to l
    A = sp.Point3D(3 + e, 0, 0)                 # a point of l other than K
    assert K == sp.Point3D(3, 0, 0) and ell.contains(A)
    dist2 = {"PH": P.distance(H) ** 2, "HK": H.distance(K) ** 2, "PK": P.distance(K) ** 2, "PA": P.distance(A) ** 2, "AK": A.distance(K) ** 2,
             "d": sp.simplify(ell.distance(P) ** 2)}
    assert sp.simplify(dist2["d"] - dist2["PK"]) == 0, "distance from P to l is not PK (three perpendiculars theorem fails?)"
    gv = re.findall(r"\b(PH|HK|PK|PA|AK|d)=(\d+)", v["giv"])
    assert gv
    eqs = [sp.simplify(dist2[nm]) - int(val) ** 2 for nm, val in gv]
    target = sp.simplify(dist2[v["ask"]])
    unknown = sorted(set().union(*[q.free_symbols for q in eqs]) | target.free_symbols, key=str)
    sol = sp.solve(eqs, unknown, dict=True)
    assert sol, "no configuration exists"
    vals = [sp.sqrt(sp.simplify(target.subs(q))) for q in sol]
    assert all(not q.free_symbols for q in vals), f"the asked length is not determined by the givens: {vals}"
    ans = R(only(vals))
    # the displayed working: its last equal sign gives the squared length
    last_sq = S(tex(v["work"]).split("=")[-1])
    assert last_sq == ans**2 if isinstance(ans, int) else sp.nsimplify(last_sq) == sp.nsimplify(ans) ** 2, "displayed square differs"
    return ans


VERIFY = {
    "geo_parFocusDir": parFocusDir, "geo_ellipseFocal": ellipseFocal, "geo_hyperFocal": hyperFocal, "geo_hyperFocalRel": hyperFocal,
    "geo_ellipseFromEq": ellipseFromEq, "geo_hyperAsym": hyperAsym, "geo_conicParam": conicParam, "geo_conicTangentLine": conicTangentLine,
    "geo_tangentAt": tangentAt, "geo_tangentsFromPoint": tangentsFromPoint, "geo_ellipseRightTri": ellipseRightTri,
    "geo_conicGeneral": conicGeneral, "geo_parMinSum": parMinSum, "geo_ellipseExtSum": ellipseExtSum,
    "geo_spaceDist": spaceDist, "geo_divPoint": divPoint, "geo_divRatioPlane": divRatioPlane, "geo_sphereExpand": sphereExpand,
    "geo_sphereSection": sphereSection, "geo_sphereTangentPlane": sphereTangentPlane, "geo_vecLinComb": vecLinComb, "geo_vecDecompose": vecDecompose,
    "geo_dotNormExpand": dotNormExpand, "geo_dotAngle": dotAngle, "geo_vecOrthoParam": vecOrthoParam, "geo_vecDotParam": vecOrthoParam,
    "geo_vecCircleEq": vecCircleEq, "geo_vecSphereEq": vecCircleEq, "geo_lineIntersectParam": lineIntersectParam, "geo_lineSpacePoint": lineSpacePoint,
    "geo_planeNormal": planeNormal, "geo_projPlaneArea": projPlaneArea, "geo_projEllipse": projEllipse, "geo_threePerp": threePerp,
}
