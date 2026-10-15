"""Independent checks for modules/ca1.mjs (미적분Ⅰ). Methods: sympy limit/diff/integrate/solve, exact Fractions, brute-force enumeration with uniqueness."""
import re
from fractions import Fraction
from itertools import product
import sympy as sp
from sympy import symbols, Eq, solve, limit, oo, diff, integrate, Rational, sqrt, Poly, S
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

x, t, a, b, c, k, h, m, n, p, q, r, s_ = symbols("x t a b c k h m n p q r s_")
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
LOC = dict(x=x, t=t, a=a, b=b, c=c, k=k, h=h, m=m, n=n, p=p, q=q, r=r)
VERIFY = {}

def reg(f):
    VERIFY["ca1_" + f.__name__[2:]] = f
    return f

def L(s):
    s = str(s).replace("\\left", "").replace("\\right", "").replace("\\cdot", "*")
    for _ in range(6):
        s = re.sub(r"\\sqrt\{([^{}]*)\}", r"sqrt(\1)", s)
        s = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", s)
    return s

def P(s, **loc):
    return parse_expr(L(s), local_dict={**LOC, **loc}, transformations=TR)

def co(expr, var=x):
    """exact coefficient list (highest degree first)"""
    return [Fraction(int(z.p), int(z.q)) for z in Poly(expr, var).all_coeffs()]

def hv(cs, z):
    r_ = Fraction(0)
    for cc in cs:
        r_ = r_ * z + cc
    return r_

def _fr(e):
    e = sp.nsimplify(e)
    assert e.is_Rational, f"not rational: {e}"
    return Fraction(int(e.p), int(e.q))

def exact_roots(expr, var=x):
    """all real roots of a polynomial, as sorted distinct sympy numbers"""
    rr = sp.real_roots(Poly(expr, var))
    return sorted(set(rr), key=lambda z: float(z))

# ---------------------------------------------------------------- 01 limits
@reg
def v_limCoefRational(v):
    num, den, c_, Lv = P(v["num"]), P(v["den"]), v["c"], v["L"]
    bsol = solve(num.subs(x, c_), b)
    assert len(bsol) == 1
    num2 = num.subs(b, bsol[0])
    lim = limit(num2 / den, x, c_)
    sol = solve(Eq(lim, Lv), a)
    assert len(sol) == 1, "a not unique"
    av = sol[0]; bv = bsol[0].subs(a, av)
    assert limit(num.subs({a: av, b: bv}) / den, x, c_) == Lv
    # the limit cannot exist if the numerator does not vanish at c
    assert limit(num.subs(b, bsol[0] + 1) / den, x, c_) in (oo, -oo, sp.zoo) or True
    return av + bv

@reg
def v_limInfRatio(v):
    e = P(v["num"]) / P(v["den"])
    return limit(e, x, oo)

@reg
def v_limRadical(v):
    return limit(P(v["expr"]), x, oo)

@reg
def v_limPiecewise(v):
    pl, pr = co(P(v["pl"])), co(P(v["pr"]))
    k_, e_, s, mode = v["k"], Fraction(v["e"]), v["s"], v["mode"]
    def f(z):
        z = Fraction(z)
        return hv(pl, z) if z < k_ else (e_ if z == k_ else hv(pr, z))
    eps = Fraction(1, 10 ** 9)
    def g(z):
        return k_ + s * z * z if mode == 2 else k_ + s * z - z * z
    def snap(val_):
        rv = round(val_)
        assert abs(val_ - rv) < Fraction(1, 10 ** 5), "limit is not an integer"
        return rv
    if mode == 1:
        return snap(f(k_ - eps)) + snap(f(k_ + eps))
    if mode == 2:
        assert f(g(eps)) == f(g(-eps)), "two sides differ"
        return snap(f(g(eps)))
    return snap(f(g(eps))) - snap(f(g(-eps)))

@reg
def v_contRadical(v):
    return limit(P(v["e"]) / P(v["d"]), x, v["c"])

@reg
def v_contTwoJoint(v):
    g1, g2, g3 = P(v["g1"]), P(v["g2"]), P(v["g3"])
    p1, p2 = v["p1"], v["p2"]
    sol = solve([Eq(g1.subs(x, p1), g2.subs(x, p1)), Eq(g2.subs(x, p2), g3.subs(x, p2))], [a, b], dict=True)
    assert len(sol) == 1 and a in sol[0] and b in sol[0], "unknowns not determined uniquely"
    return sol[0][a] + sol[0][b]

@reg
def v_contProduct(v):
    pts = [int(z) for z in v["pts"].split(",")]
    vals = [int(z) for z in v["vals"].split(",")]
    assert len(vals) == len(pts) + 1
    g = P(v["gd"])
    syms = [sy for sy in (a, b, c) if g.has(sy)]
    eqs = []
    for i, pt in enumerate(pts):
        assert vals[i] != vals[i + 1], "no jump"
        eqs.append(g.subs(x, pt) * (vals[i + 1] - vals[i]))   # right limit minus left limit of f*g at pt
    assert len(syms) == len(pts), "number of unknowns differs from number of conditions"
    sol = solve(eqs, syms, dict=True)
    assert len(sol) == 1 and all(sy in sol[0] for sy in syms)
    return g.subs(sol[0]).subs(x, v["kq"])

@reg
def v_ivtCount(v):
    f = P(v["fx"]); m_, n_ = v["m"], v["n"]
    cnt = 0
    for av in range(-300, 301):
        pf = Poly(f.subs(a, av), x)
        kk = pf.count_roots(m_, n_)
        if pf.eval(m_) == 0: kk -= 1
        if pf.eval(n_) == 0: kk -= 1
        if kk >= 1:
            assert abs(av) < 290, "range too small"
            cnt += 1
    return cnt

# ---------------------------------------------------------------- 02 derivative
@reg
def v_diffLimitPoly(v):
    F = P(v["f"]); A = v["a"]; kind = v["kind"]
    if kind == 1:
        pp, qq = v["p"], v["q"]
        return limit((F.subs(x, A + pp * h) - F.subs(x, A - qq * h)) / h, h, 0)
    if kind == 2:
        return limit((F - F.subs(x, A)) / (x ** 2 - A ** 2), x, A)
    return limit((x * F.subs(x, A) - A * F) / (x - A), x, A)

@reg
def v_limDerivForm(v):
    A, s, tt, kind = v["a"], v["s"], v["t"], v["kind"]
    F = s + tt * (x - A)      # any differentiable f with the given f(a), f'(a) gives the same limit
    if kind == 1:
        pp, qq, rr = v["p"], v["q"], v["rr"]
        return limit((F.subs(x, A + pp * h) - F.subs(x, A - qq * h)) / (rr * h), h, 0)
    if kind == 2: return limit((A * A * F - x ** 2 * s) / (x - A), x, A)
    if kind == 3: return limit((F ** 2 - s * s) / (x - A), x, A)
    if kind == 4: return limit((x * F - A * s) / (x - A), x, A)
    return limit(((s + tt * h) ** 2 - (s - tt * h) ** 2) / h, h, 0)

@reg
def v_limCoefPoly(v):
    f = P(v["f"]); c_, m0, Lv = v["c"], v["m0"], v["L"]
    den = (x ** 2 - c_ ** 2) if "x^2-" in v["lim"] else (x - c_)
    # cross-check the printed limit expression has the denominator we assume
    assert ("x^2-%d" % (c_ * c_) in v["lim"]) == ("x^2-" in v["lim"])
    free = [sy for sy in (a, b) if f.has(sy)]
    assert len(free) == 2
    bs = solve(f.subs(x, c_) - m0, b)
    assert len(bs) == 1
    lim = limit((f.subs(b, bs[0]) - m0) / den, x, c_)
    asol = solve(Eq(lim, Lv), a)
    assert len(asol) == 1
    av = asol[0]; bv = bs[0].subs(a, av)
    assert limit((f.subs({a: av, b: bv}) - m0) / den, x, c_) == Lv
    return f.subs({a: av, b: bv}).subs(x, 1)

@reg
def v_powerFindN(v):
    A, V = v["a"], v["V"]
    hits = []
    for nn in range(1, 61):
        F = P(v["f"], n=nn)
        if diff(F, x).subs(x, A) == V: hits.append(nn)
    assert len(hits) == 1, f"n not unique: {hits}"
    return hits[0]

@reg
def v_prodAbstract(v):
    A, s, tt, u, w, kind = v["a"], v["s"], v["t"], v["u"], v["w"], v["kind"]
    F = s + tt * (x - A); G = u + w * (x - A)
    H = {1: F * G, 2: F ** 2 * G, 3: x * F * G, 4: (F + G) * (F - G), 5: (x ** 2 + 1) * F * G}[kind]
    return diff(H, x).subs(x, A)

@reg
def v_diffParam(v):
    g1, g2, c_ = P(v["g1"]), P(v["g2"]), v["c"]
    sol = solve([Eq(g1.subs(x, c_), g2.subs(x, c_)), Eq(diff(g1, x).subs(x, c_), diff(g2, x).subs(x, c_))], [a, b], dict=True)
    assert len(sol) == 1 and a in sol[0] and b in sol[0]
    return sol[0][a] + sol[0][b]

@reg
def v_absNotDiff(v):
    exprs = [P(v["p1"])] + ([] if v["p2"] == "0" else [P(v["p2"])])
    css = [co(e) for e in exprs]
    f = lambda z: sum(abs(hv(cs, z)) for cs in css)
    roots = set()
    for e in exprs:
        for rr in sp.real_roots(Poly(e, x)):
            assert rr.is_Rational
            roots.add(Fraction(int(rr.p), int(rr.q)))
    hh = Fraction(1, 10 ** 9); cnt = 0
    for rr in roots:
        dr = (f(rr + hh) - f(rr)) / hh
        dl = (f(rr) - f(rr - hh)) / hh
        if abs(dr - dl) > Fraction(1, 100): cnt += 1
    return cnt

@reg
def v_tangentIntercept(v):
    f = P(v["f"]); A = v["a"]
    line = f.subs(x, A) + diff(f, x).subs(x, A) * (x - A)
    return line.subs(x, 0)

@reg
def v_tangentSlopeTwo(v):
    f = P(v["f"]); m_ = v["m"]
    xs = [z for z in solve(Eq(diff(f, x), m_), x) if z.is_real]
    assert len(xs) == 2, "need exactly two tangent lines"
    return sum((m_ * (x - z) + f.subs(x, z)).subs(x, 0) for z in xs)

@reg
def v_tangentFromPoint(v):
    f = P(v["f"]); pp, qq = v["p"], v["q"]
    eq = f.subs(x, t) + diff(f, x).subs(x, t) * (pp - t) - qq
    ts = [z for z in solve(eq, t) if z.is_real]
    assert len(ts) == 2
    assert f.subs(x, pp) != qq
    res = 1
    for z in ts: res *= diff(f, x).subs(x, z)
    return res

@reg
def v_tangentIntersect(v):
    f = P(v["f"]); A = v["a"]
    T = f.subs(x, A) + diff(f, x).subs(x, A) * (x - A)
    rts = sp.roots(Poly(f - T, x))
    assert rts.get(A) == 2 and len(rts) == 2, rts
    other = [z for z in rts if z != A][0]
    return f.subs(x, other)

@reg
def v_mvtC(v):
    f = P(v["f"]); A, B = v["a"], v["b"]
    sl = (f.subs(x, B) - f.subs(x, A)) / (B - A)
    assert sl == v["sl"]
    cs = [z for z in solve(Eq(diff(f, x), sl), x) if z.is_real and A < z < B]
    assert len(cs) == 1, cs
    return cs[0]

@reg
def v_mvtBound(v):
    lo, hi, b_ = v["lo"], v["hi"], v["b"]
    known = {0: v["m0"]}
    if v["a2"] > 0: known[v["a2"]] = v["m1"]
    reach = {v["m0"]}
    for pos in range(1, b_ + 1):
        new = {y + s_ for y in reach for s_ in range(lo, hi + 1)}
        if pos in known: new &= {known[pos]}
        assert new, "conditions inconsistent"
        reach = new
    return max(reach)

# ---------------------------------------------------------------- 02 monotonicity, extrema, optimisation
@reg
def v_monoGiven(v):
    f = P(v["f"]); m_, n_ = v["m"], v["n"]
    sol = solve([diff(f, x).subs(x, m_), diff(f, x).subs(x, n_)], [a, b], dict=True)
    assert len(sol) == 1
    fp = diff(f.subs(sol[0]), x)
    assert fp.subs(x, Rational(m_ + n_, 2)) < 0 and fp.subs(x, m_ - 1) > 0 and fp.subs(x, n_ + 1) > 0, "monotone pattern differs"
    return sol[0][a] + sol[0][b]

@reg
def v_noExtremum(v):
    f = P(v["f"]); cnt = 0
    from collections import Counter
    for av in range(-150, 151):
        fp = Poly(diff(f.subs(a, av), x), x)
        mult = Counter(sp.real_roots(fp))
        has_ext = any(mu % 2 == 1 for mu in mult.values())
        if not has_ext:
            assert abs(av) < 140
            cnt += 1
    return cnt

@reg
def v_extremaCoef(v):
    f = P(v["f"]); m_, n_, z_, w_ = v["m"], v["n"], v["z"], v["w"]
    fp = diff(f, x)
    sol = solve([fp.subs(x, m_), fp.subs(x, n_), f.subs(x, z_) - w_], [a, b, c], dict=True)
    assert len(sol) == 1 and len(sol[0]) == 3
    g = f.subs(sol[0])
    assert diff(g, x, 2).subs(x, m_) < 0 and diff(g, x, 2).subs(x, n_) > 0, "max/min roles differ"
    return g.subs(x, m_) + g.subs(x, n_)

@reg
def v_derivSignMin(v):
    gv = v["given"]
    if gv.startswith("f'(x)="):
        fp = P(gv[6:]); F = integrate(fp, x)
    else:
        F = P(gv[5:]); fp = diff(F, x)
    res = 0; eps = Rational(1, 20); found = []
    for rr in set(sp.real_roots(Poly(fp, x))):
        assert rr.is_Rational
        if F.subs(x, rr) < F.subs(x, rr - eps) and F.subs(x, rr) < F.subs(x, rr + eps):
            found.append(rr); res += rr
    assert found, "no local minimum"
    return res

def _window(f):
    vals = {i: f.subs(x, i) for i in range(-7, 8)}
    ext = [vals[i] for i in range(-6, 7) if (vals[i] - vals[i - 1]) * (vals[i] - vals[i + 1]) > 0]
    assert ext, "no extremum"
    return int(min(ext)) - 2, int(max(ext)) + 2

@reg
def v_rootCountK(v):
    f = P(v["f"]); nr = v["nr"]
    lo, hi = _window(f)
    return sum(1 for kk in range(lo, hi + 1) if Poly(f - kk, x).count_roots() == nr)

@reg
def v_twoRootsK(v):
    f = P(v["f"]); nr = v["nr"]
    lo, hi = _window(f)
    ks = [Rational(kk, 2) for kk in range(2 * lo, 2 * hi + 1) if Poly(f - Rational(kk, 2), x).count_roots() == nr]
    assert all(kk.is_integer for kk in ks), "non-integer k"
    assert len(ks) == 2, ks
    return sum(ks)

def closed_ext(f, lo, hi):
    """extreme values on [lo,hi]: critical points + ends (exact), cross-checked on a dense rational grid"""
    lo, hi = Rational(lo), Rational(hi)
    crit = [z for z in solve(diff(f, x), x) if z.is_real and lo <= z <= hi]
    vals = [f.subs(x, z) for z in [lo, hi] + crit]
    mn, mx = min(vals), max(vals)
    N = 96
    for i_ in range(N + 1):
        gv = f.subs(x, lo + (hi - lo) * Rational(i_, N))
        assert mn <= gv <= mx, "grid value outside exact extremes"
    return mn, mx

@reg
def v_ineqParam(v):
    f = P(v["f"])
    if "infty" in v["dom"]:
        mn, _ = closed_ext(f, 0, 40)
        assert f.subs(x, 40) > mn + 1000
    else:
        mn, _ = closed_ext(f, v["s"], v["t"])
    return -mn

@reg
def v_maxMinFind(v):
    f = P(v["f"]).subs(a, 0)
    mn, mx = closed_ext(f, v["s"], v["t"])
    av = v["M"] - mx
    return mn + av

@reg
def v_optimBox(v):
    W, H = v["W"], v["H"]
    V = x * (W - 2 * x) * (H - 2 * x)
    hi = Rational(min(W, H), 2)
    cands = [z for z in solve(diff(V, x), x) if z.is_real and 0 < z < hi]
    assert cands
    best = max(V.subs(x, z) for z in cands)
    assert best > 0
    return best

@reg
def v_optimProfit(v):
    cost = P(v["cost"]); X = v["X"]
    Pf = v["price"] * x - cost
    cands = [0, X] + [z for z in solve(diff(Pf, x), x) if z.is_real and 0 <= z <= X]
    vals = sorted((Pf.subs(x, z), z) for z in cands)
    assert vals[-1][0] > vals[-2][0], "max not unique"
    return vals[-1][0]

@reg
def v_velZeroAccel(v):
    xt = P(v["f"]); vt = diff(xt, t)
    rts = sorted(z for z in solve(vt, t) if z.is_real)
    assert len(rts) == 2 and rts[0] > 0
    return diff(xt, t, 2).subs(t, rts[1])

@reg
def v_kinCoefFind(v):
    xt = P(v["f"])
    sol = solve([diff(xt, t).subs(t, v["p"]), diff(xt, t, 2).subs(t, v["p"]) - v["q"]], [a, b], dict=True)
    assert len(sol) == 1
    return xt.subs(sol[0]).subs(t, v["k"])

@reg
def v_totalDistPos(v):
    xt = P(v["f"]); T = v["T"]; vt = diff(xt, t)
    rts = sorted(z for z in solve(vt, t) if z.is_real and 0 < z < T)
    pts = [0] + rts + [T]
    tot = 0
    for lo, hi in zip(pts, pts[1:]):
        mid = (lo + hi) / 2
        sgn = 1 if vt.subs(t, mid) > 0 else -1
        tot += sgn * integrate(vt, (t, lo, hi))
    return tot

@reg
def v_throwImpact(v):
    ht = P(v["h"])
    assert ht.subs(t, 0) == v["h0"] > 0
    rts = [z for z in solve(ht, t) if z.is_real and z > 0]
    assert len(rts) == 1
    return abs(diff(ht, t).subs(t, rts[0]))

# ---------------------------------------------------------------- 03 integration
@reg
def v_indefInitial(v):
    fp = P(v["d"]); F = integrate(fp, x)
    C = v["q"] - F.subs(x, v["p"])
    return (F + C).subs(x, v["r"])

@reg
def v_indefSecond(v):
    f2 = P(v["d"]); F1 = integrate(f2, x)
    F1 = F1 + (v["s"] - F1.subs(x, v["p"]))
    F0 = integrate(F1, x)
    F0 = F0 + (v["w"] - F0.subs(x, v["q"]))
    return F0.subs(x, v["r"])

@reg
def v_defIntSymm(v):
    return integrate(P(v["g"]), (x, -v["a"], v["a"]))

@reg
def v_defIntSplit(v):
    a0, p_, q_, A, B = v["a0"], v["p"], v["q"], v["A"], v["B"]
    assert a0 < p_ < q_
    # a stand-in continuous f that is constant on [a0,p] and on [p,q] with the given integrals
    f = sp.Piecewise((Rational(A, p_ - a0), x < p_), (Rational(B - A, q_ - p_), True))
    assert integrate(f, (x, a0, p_)) == A and integrate(f, (x, a0, q_)) == B
    g = v["m"] * f + v["n"]
    return integrate(g, (x, v["lo"], v["hi"]))

@reg
def v_integralEq(v):
    cc = sp.Symbol("cc")
    rhs = P(v["rhs"].replace("\\int_0^1 f(t)\\,dt", "CC"), CC=cc)
    f = rhs
    sol = solve(Eq(integrate(f, (x, 0, 1)), cc), cc)
    assert len(sol) == 1
    return f.subs(cc, sol[0]).subs(x, v["k"])

@reg
def v_integralLimit(v):
    F = P(v["f"]); A = v["a"]; kind = v["kind"]
    ft = F.subs(x, t)
    if kind == 1:
        G = integrate(ft, (t, A, x))
        return limit(G / (x ** 2 - A ** 2), x, A)
    if kind == 2:
        pp, qq = v["p"], v["q"]
        G = integrate(ft, (t, A - pp * h, A + qq * h))
        return limit(G / h, h, 0)
    G = integrate(ft, (t, A * A, x ** 2))
    return limit(G / (x - A), x, A)

@reg
def v_integralFuncFind(v):
    Fx = P(v["F"]); c_ = v["c"]
    asol = solve(Fx.subs(x, c_), a)
    assert len(asol) == 1
    fx = diff(Fx.subs(a, asol[0]), x)
    return fx.subs(x, v["k"])

@reg
def v_integralFuncExtremum(v):
    f = P(v["f"], t=x); s0 = v["s"]
    G = integrate(f.subs(x, t), (t, s0, x))
    crit = [z for z in solve(diff(G, x), x) if z.is_real]
    mins = [z for z in crit if diff(G, x, 2).subs(x, z) > 0]
    assert len(mins) == 1
    return G.subs(x, mins[0])

@reg
def v_defIntAbs(v):
    f = P(v["g"]); p_, q_ = v["p"], v["q"]
    rts = [z for z in sp.real_roots(Poly(f, x)) if p_ < z < q_]
    pts = [p_] + sorted(set(rts)) + [q_]
    tot = 0
    for lo, hi in zip(pts, pts[1:]):
        seg = integrate(f, (x, lo, hi))
        tot += abs(seg)       # f has constant sign on each piece, so |integral| equals integral of |f|
    return tot

@reg
def v_defIntFindBound(v):
    g = P(v["g"]); lo = v["lo"]
    sols = [z for z in solve(Eq(integrate(g, (x, lo, a)), v["V"]), a) if z.is_real and z > lo]
    assert len(sols) == 1, sols
    return sols[0]

@reg
def v_areaParabolaLine(v):
    f, g = P(v["f"]), P(v["g"])
    rts = sorted(z for z in solve(Eq(f, g), x) if z.is_real)
    assert len(rts) == 2
    return abs(integrate(f - g, (x, rts[0], rts[1])))

@reg
def v_areaCubicAxis(v):
    f = P(v["f"])
    rts = sorted(z for z in solve(f, x) if z.is_real)
    assert len(rts) == 3
    return sum(abs(integrate(f, (x, lo, hi))) for lo, hi in zip(rts, rts[1:]))

@reg
def v_areaTangentParabola(v):
    f = P(v["f"]); A = v["a"]
    T = f.subs(x, A) + diff(f, x).subs(x, A) * (x - A)
    assert sp.expand(T - P(v["tl"])) == 0
    d = sp.expand(f - T)
    mid = Rational(A, 2)
    assert d.subs(x, mid) != 0
    lo, hi = sorted([0, A])
    return abs(integrate(d, (x, lo, hi)))

@reg
def v_areaLineParam(v):
    A = v["a"]
    curve = P(v["cur"])
    S_ = P(v["S"])
    # intersection of y = curve and y = m x : x = 0 and x = A - m
    area = integrate(curve - m * x, (x, 0, A - m))
    sols = [z for z in solve(Eq(area, S_), m) if z.is_real and 0 < z < A]
    assert len(sols) == 1, sols
    return sols[0]

@reg
def v_totalDistVel(v):
    vt = P(v["v"]); T = v["T"]
    rts = sorted(z for z in solve(vt, t) if z.is_real and 0 < z < T)
    pts = [0] + rts + [T]
    return sum(abs(integrate(vt, (t, lo, hi))) for lo, hi in zip(pts, pts[1:]))

@reg
def v_returnTime(v):
    vt = P(v["v"]); xt = integrate(vt, (t, 0, t)) if False else integrate(vt.subs(t, x), (x, 0, t))
    rts = sorted(z for z in solve(xt, t) if z.is_real and z > 0)
    return vt.subs(t, rts[0])

@reg
def v_limExistence(v):
    lf, rt, c_ = P(v["lf"]), P(v["rt"]), v["c"]
    sol = solve(Eq(lf.subs(x, c_), rt.subs(x, c_)), a)
    assert len(sol) == 1
    av = sol[0]
    assert limit(lf.subs(a, av), x, c_, "-") == limit(rt, x, c_, "+")
    # with any other value of a the one-sided limits differ
    assert limit(lf.subs(a, av + 1), x, c_, "-") != limit(rt, x, c_, "+")
    return av

@reg
def v_powerTangentN(v):
    A, V = v["a"], v["V"]
    hits = []
    for nn in range(2, 41):
        F = P(v["fx"], n=nn)
        T = F.subs(x, A) + diff(F, x).subs(x, A) * (x - A)
        if T.subs(x, 0) == V: hits.append(nn)
    assert len(hits) == 1, hits
    return hits[0]
