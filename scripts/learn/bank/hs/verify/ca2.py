"""Independent checks for modules/ca2.mjs (미적분Ⅱ).

Every function re-derives the answer from the row's LaTeX strings with sympy (limit / diff / integrate / summation / series / solve),
exact Fractions, brute-force enumeration or numerical root counting; none of it shares code with the JS generators."""
import math
import re
from fractions import Fraction

import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (convert_xor, implicit_multiplication_application, parse_expr,
                                         standard_transformations)

TR = standard_transformations + (implicit_multiplication_application, convert_xor)
X = sp.Symbol("x", real=True)
Y = sp.Symbol("y", real=True)
T = sp.Symbol("t", real=True)
N = sp.Symbol("n", positive=True, integer=True)
K = sp.Symbol("k", positive=True, integer=True)
A = sp.Symbol("a", real=True)
B = sp.Symbol("b", real=True)
R_ = sp.Symbol("r", real=True)
LL = sp.Symbol("L", real=True)
VV = sp.Symbol("V", real=True)
SS = sp.Symbol("S", real=True)
II = sp.Symbol("I", real=True)
LD = {"x": X, "y": Y, "t": T, "n": N, "k": K, "a": A, "b": B, "r": R_, "L": LL, "V": VV, "S": SS, "I": II}


def grp(s, i):
    d = 0
    for j in range(i, len(s)):
        if s[j] == "{":
            d += 1
        elif s[j] == "}":
            d -= 1
            if d == 0:
                return s[i + 1:j], j + 1
    raise ValueError("unbalanced braces: " + s)


def pgrp(s, i):
    d = 0
    for j in range(i, len(s)):
        if s[j] == "(":
            d += 1
        elif s[j] == ")":
            d -= 1
            if d == 0:
                return s[i + 1:j], j + 1
    raise ValueError("unbalanced parentheses: " + s)


FN = {"sin": "sin", "cos": "cos", "tan": "tan", "sec": "sec", "csc": "csc", "cot": "cot", "ln": "log"}


def tex(s):
    s = s.replace("\\left", "").replace("\\right", "").replace("\\ ", " ").replace("\\,", "*").replace("\\!", "")
    out = ""
    i = 0

    def push(tok, atom=False):
        nonlocal out
        if atom and out and (out[-1].isalnum() or out[-1] in ")."):
            out += "*"
        out += tok

    while i < len(s):
        c = s[i]
        if s.startswith("\\frac", i):
            a, j = grp(s, i + 5)
            b, j = grp(s, j)
            push("((" + tex(a) + ")/(" + tex(b) + "))", True)
            i = j
        elif s.startswith("\\sqrt", i):
            a, j = grp(s, i + 5)
            push("sqrt(" + tex(a) + ")", True)
            i = j
        elif s.startswith("\\sum_{k=1}^{n}", i):
            body = s[i + len("\\sum_{k=1}^{n}"):]
            push("Sum(" + tex(body) + ",(k,1,n)).doit()", True)
            i = len(s)
        elif c == "\\":
            m = re.match(r"\\(sin|cos|tan|sec|csc|cot|ln)(?:\^\{(\d+)\}|\^(\d))?\s*", s[i:])
            if m:
                j = i + m.end()
                pw = m.group(2) or m.group(3)
                if j < len(s) and s[j] == "(":
                    arg, j = pgrp(s, j)
                elif j < len(s) and s[j] == "{":
                    arg, j = grp(s, j)
                elif s.startswith("\\frac", j):
                    a1, j1 = grp(s, j + 5)
                    b1, j2 = grp(s, j1)
                    arg = s[j:j2]
                    j = j2
                else:
                    m2 = re.match(r"\d+(?:\.\d+)?[a-z]{0,2}|[a-z]{1,2}|\\pi", s[j:])
                    arg = m2.group(0)
                    j += m2.end()
                tok = FN[m.group(1)] + "(" + tex(arg) + ")"
                if pw:
                    tok = "(" + tok + ")**" + pw
                push(tok, True)
                i = j
                continue
            m = re.match(r"\\(pi|cdot|times|infty)", s[i:])
            if m:
                name = m.group(1)
                if name == "pi":
                    push("pi", True)
                elif name in ("cdot", "times"):
                    out += "*"
                else:
                    push("oo", True)
                i += m.end()
                continue
            raise ValueError("unknown command in " + s[i:i + 12])
        elif c == "^":
            if i + 1 < len(s) and s[i + 1] == "{":
                a, j = grp(s, i + 1)
                out += "**(" + tex(a) + ")"
                i = j
            else:
                out += "**"
                i += 1
        elif c == "e":
            push("E", True)
            i += 1
        elif c in "{}":
            i += 1
        else:
            out += c
            i += 1
    return out


def P(s, extra=None):
    d = dict(LD)
    if extra:
        d.update(extra)
    return parse_expr(tex(s), local_dict=d, transformations=TR)


def rat(v, what="value"):
    v = sp.nsimplify(sp.simplify(v)) if not isinstance(v, sp.Rational) else v
    assert isinstance(v, sp.Rational), f"{what} is not rational: {v}"
    return v


def finite(v, what="value"):
    assert v.is_finite and v.is_real is not False, f"{what} not finite: {v}"
    return v


def lim_target(s):
    s = s.strip()
    return sp.oo if s.endswith("\\infty") else P(s)


def split_lim(to):
    var, tgt = to.split("\\to", 1)
    return {"x": X, "n": N, "t": T}[var.strip()], lim_target(tgt)


def defined_for(expr, var, rng):
    for i in rng:
        v = expr.subs(var, i)
        assert v.is_finite and v is not sp.nan, f"undefined at {var}={i}"


# ---------------------------------------------------------------- sequences and series
def seq_limit(v):
    e = P(v["ex"])
    defined_for(e, N, range(1, 40))
    return rat(sp.limit(e, N, sp.oo), "limit")


def seq_geo_limit(v):
    e = P(v["ex"])
    defined_for(e, N, range(1, 41))
    v500, v501 = e.subs(N, 500), e.subs(N, 501)
    assert abs(float(v500 - v501)) < 1e-12, "sequence not converging"
    return Fraction(int(v501.p), int(v501.q)).limit_denominator(5000)


def geo_conv_count(v):
    rt = P(v["rt"])
    cnt = 0
    for xv in range(-300, 301):
        r = float(rt.subs(X, xv))
        try:
            a, b = r ** 1000, r ** 1001
            ok = abs(a - b) < 1e-9
        except OverflowError:
            ok = False
        if ok:
            cnt += 1
            assert abs(xv) < 250, "convergent integers are not bounded"
    return cnt


def seq_sum_limit(v):
    e = P(v["ex"])
    return rat(sp.limit(e, N, sp.oo), "limit")


def partial_sum_series(v):
    S = P(v["sa"]) / P(v["sb"])
    ask = v["ask"]
    Sf = lambda m: S.subs(N, m)
    if ask == "\\sum_{n=1}^{\\infty}a_{n}":
        return rat(sp.limit(S, N, sp.oo))
    if ask == "a_{1}":
        return rat(Sf(1))
    m = re.fullmatch(r"a_\{(\d+)\}", ask)
    if m:
        kk = int(m.group(1))
        assert kk >= 2
        return rat(Sf(kk) - Sf(kk - 1))
    assert ask == "\\lim_{n\\to\\infty}n^{2}a_{n}", ask
    return rat(sp.limit(N ** 2 * (S - S.subs(N, N - 1)), N, sp.oo))


def telescope(v):
    term = P(v["term"])
    defined_for(term, N, range(1, 30))
    s = sp.summation(term, (N, 1, sp.oo))
    return rat(s, "sum")


def geo_series_param(v):
    term = P(v["term"])
    S = float(P(v["S"]))
    ratio = sp.simplify(term.subs(N, N + 1) / term)
    ratio_f = sp.lambdify(R_, ratio, "numpy")
    # sum of the first 4000 terms, numerically, on a grid of r
    nn = np.arange(1, 4001, dtype=float)
    tf = sp.lambdify((R_, N), term, "numpy")
    rs = np.arange(-8, 8, 0.001)
    vals = []
    good = []
    for rv in rs:
        rr = ratio_f(rv)
        if abs(rr) < 0.97:
            good.append(rv)
    good = np.array(good)
    f = np.array([np.sum(tf(rv, nn)) for rv in good]) - S
    roots = []
    for i in range(len(good) - 1):
        if abs(good[i + 1] - good[i] - 0.001) < 1e-9 and f[i] * f[i + 1] < 0:
            lo, hi = good[i], good[i + 1]
            for _ in range(60):
                mid = (lo + hi) / 2
                fm = np.sum(tf(mid, nn)) - S
                if (np.sum(tf(lo, nn)) - S) * fm <= 0:
                    hi = mid
                else:
                    lo = mid
            roots.append((lo + hi) / 2)
    assert len(roots) == 1, f"expected one ratio, found {roots}"
    cand = Fraction(roots[0]).limit_denominator(1000)
    # exact confirmation with Fractions: partial sums
    cr = sp.Rational(cand.numerator, cand.denominator)
    tt = term.subs(R_, cr)
    acc = sum(tt.subs(N, i) for i in range(1, 400))
    assert abs(float(acc) - S) < 1e-9, "candidate does not reproduce the sum"
    return cand


def ball_distance(v):
    rs = v["ratio"]
    if re.fullmatch(r"0\.\d+", rs):
        r = Fraction(rs)
    else:
        e = P(rs)
        r = Fraction(int(e.p), int(e.q))
    assert 0 < r < 1
    h = Fraction(v["h"])
    total = h
    cur = h
    for _ in range(900):
        cur *= r
        total += 2 * cur
    return total.limit_denominator(10000)


# ---------------------------------------------------------------- limits / derivatives of exp, log, trig
def exp_log_limit(v):
    var, tgt = split_lim(v["to"])
    e = P(v["ex"])
    return rat(sp.limit(e, var, tgt))


def e_exponent(v):
    var, tgt = split_lim(v["to"])
    e = P(v["ex"])
    base, ex = e.as_base_exp()
    assert ex != 1, "not a power"
    Lm = sp.limit(ex * sp.log(base), var, tgt)
    return rat(Lm)


def deriv_at(v, fkey="fx", xkey="x0"):
    f = P(v[fkey])
    x0 = P(v[xkey])
    finite(sp.N(f.subs(X, x0)), "f(x0)")
    d = sp.diff(f, X).subs(X, x0)
    return rat(sp.simplify(d), "f'(x0)")


def trig_limit(v):
    var, tgt = split_lim(v["to"])
    return rat(sp.limit(P(v["ex"]), var, tgt))


def trig_limit_unknown(v):
    eq = v["eq"]
    m = re.fullmatch(r"\\lim_\{x\\to0\}(.*)=(.*)", eq)
    lhs, val = m.group(1), m.group(2)
    ap = sp.Symbol("a", positive=True)
    e = parse_expr(tex(lhs), local_dict={**LD, "a": ap}, transformations=TR)
    L = sp.limit(e, X, 0)
    target = P(val)
    sols = sp.solve(sp.Eq(L, target), ap)
    sols = [s for s in sols if s.is_positive]
    assert len(sols) == 1, f"solutions {sols}"
    assert sols[0].is_integer, f"a not an integer: {sols[0]}"
    # brute-force confirmation
    hit = [aa for aa in range(1, 60) if sp.simplify(L.subs(ap, aa) - target) == 0]
    assert hit == [int(sols[0])], f"brute force {hit}"
    return sols[0]


def top_frac(s):
    assert s.startswith("\\frac")
    a, j = grp(s, 5)
    b, j = grp(s, j)
    return a, b


def limit_pair(v):
    m = re.fullmatch(r"\\lim_\{x\\to0\}(.*)=(.*)", v["eq"])
    lhs, val = m.group(1), P(m.group(2))
    nu, de = top_frac(lhs)
    num_e, den_e = P(nu), P(de)
    p = sp.degree(den_e, X)
    assert sp.Poly(den_e, X).monoms() == [(p,)], "denominator must be a monomial"
    lead = sp.Poly(den_e, X).coeffs()[0]
    ser = sp.series(num_e, X, 0, p + 1).removeO()
    poly = sp.Poly(sp.expand(ser), X)
    cs = [poly.coeff_monomial(X ** i) for i in range(p + 1)]
    eqs = [c for c in cs[:p]] + [sp.Eq(cs[p] / lead, val)]
    sols = sp.solve(eqs, [A, B], dict=True)
    assert sols, "no solution"
    prods = {sp.simplify(s[A] * s[B]) for s in sols}
    assert len(prods) == 1, f"ab not unique: {prods}"
    return rat(prods.pop())


def trig_deriv(v):
    return deriv_at(v)


def quotient_deriv(v):
    return deriv_at(v)


def deriv_exp_log(v):
    return deriv_at(v)


# ---------------------------------------------------------------- addition formulas
QUAD_OF = {
    "0<\\alpha<\\frac{\\pi}{2}": 1, "\\frac{\\pi}{2}<\\alpha<\\pi": 2, "\\pi<\\alpha<\\frac{3\\pi}{2}": 3, "\\frac{3\\pi}{2}<\\alpha<2\\pi": 4,
    "0<\\beta<\\frac{\\pi}{2}": 1, "\\frac{\\pi}{2}<\\beta<\\pi": 2, "\\pi<\\beta<\\frac{3\\pi}{2}": 3, "\\frac{3\\pi}{2}<\\beta<2\\pi": 4,
}
SGN_C = {1: 1, 2: -1, 3: -1, 4: 1}
SGN_S = {1: 1, 2: 1, 3: -1, 4: -1}


def angle_from(given, quad):
    m = re.fullmatch(r"\\(sin|cos|tan)\\(?:alpha|beta)=(.*)", given)
    fn, val = m.group(1), P(m.group(2))
    assert isinstance(val, sp.Rational)
    if fn == "sin":
        c2 = 1 - val ** 2
        assert c2 >= 0
        c = SGN_C[quad] * sp.sqrt(c2)
        s = val
    elif fn == "cos":
        s2 = 1 - val ** 2
        assert s2 >= 0
        s = SGN_S[quad] * sp.sqrt(s2)
        c = val
    else:
        c = SGN_C[quad] / sp.sqrt(1 + val ** 2)
        s = val * c
        assert sp.sign(s) == SGN_S[quad], "tangent sign inconsistent with the quadrant"
    assert isinstance(c, sp.Rational) and isinstance(s, sp.Rational), (c, s)
    ang = math.atan2(float(s), float(c)) % (2 * math.pi)
    assert (quad - 1) * math.pi / 2 < ang < quad * math.pi / 2, "angle outside the stated quadrant"
    return c, s, ang


def add_theorem(v):
    qa, qb = QUAD_OF[v["ra"]], QUAD_OF[v["rb"]]
    ca, sa, ang_a = angle_from(v["ga"], qa)
    cb, sb, ang_b = angle_from(v["gb"], qb)
    m = re.fullmatch(r"\\(sin|cos|tan)\(\\alpha([+-])\\beta\)", v["ask"])
    fn, sg = m.group(1), m.group(2)
    za = complex(float(ca), float(sa))
    zb = complex(float(cb), float(sb)) if sg == "+" else complex(float(cb), -float(sb))
    # exact via Gaussian rationals
    ra = sp.Rational(1) * ca + sp.I * sa
    rb = cb + sp.I * (sb if sg == "+" else -sb)
    prod = sp.expand(ra * rb)
    re_, im_ = sp.re(prod), sp.im(prod)
    ang = ang_a + (ang_b if sg == "+" else -ang_b)
    if fn == "sin":
        res, chk = im_, math.sin(ang)
    elif fn == "cos":
        res, chk = re_, math.cos(ang)
    else:
        assert re_ != 0, "tangent undefined"
        res, chk = im_ / re_, math.tan(ang)
    assert abs(float(res) - chk) < 1e-9, "numeric angle check failed"
    return rat(res)


def line_angle(v):
    def slope(s):
        lhs, rhs = s.split("=")
        if lhs == "y":
            return sp.diff(P(rhs), X)
        sol = sp.solve(P(lhs) - P(rhs), Y)
        assert len(sol) == 1
        return sp.diff(sol[0], X)

    m1, m2 = slope(v["l1"]), slope(v["l2"])
    assert m1 != m2
    # direction vectors (1, m): tan(theta) = |cross| / |dot|
    cross = m2 - m1
    dot = 1 + m1 * m2
    assert dot != 0, "perpendicular lines: tan undefined"
    th = abs(math.atan(float(m1)) - math.atan(float(m2)))
    th = min(th, math.pi - th)
    assert abs(math.tan(th) - abs(float(cross / dot))) < 1e-9
    return rat(abs(cross / dot))


def double_angle(v):
    cd = v["cd"]
    ask = v["ask"]
    rng = None
    if "\\ \\left(" in cd:
        cd, rng = cd.split("\\ \\left(", 1)
    y, z = sp.symbols("y z", real=True)
    sols = None
    m = re.fullmatch(r"\\sin\\alpha([+-])\\cos\\alpha=(.*)", cd)
    if m:
        sg = 1 if m.group(1) == "+" else -1
        sols = sp.solve([y + sg * z - P(m.group(2)), y ** 2 + z ** 2 - 1], [y, z], dict=True)
    m = re.fullmatch(r"\\sin\\alpha=(.*)", cd)
    if m and sols is None:
        sols = sp.solve([y - P(m.group(1)), y ** 2 + z ** 2 - 1], [y, z], dict=True)
    m = re.fullmatch(r"\\cos\\alpha=(.*)", cd)
    if m and sols is None:
        sols = sp.solve([z - P(m.group(1)), y ** 2 + z ** 2 - 1], [y, z], dict=True)
    m = re.fullmatch(r"\\tan\\alpha=(.*)", cd)
    if m and sols is None:
        sols = sp.solve([y - P(m.group(1)) * z, y ** 2 + z ** 2 - 1], [y, z], dict=True)
    m = re.fullmatch(r"\\tan\\frac\{\\alpha\}\{2\}=(.*)", cd)
    if m and sols is None:
        tv = P(m.group(1))
        al = 2 * sp.atan(tv)
        sols = [{y: sp.simplify(sp.sin(al)), z: sp.simplify(sp.cos(al))}]
    assert sols, "condition not recognised or no real angle: " + cd
    if rng is not None:
        assert rng.startswith("0<\\alpha<\\frac{\\pi}{2}")
        sols = [s_ for s_ in sols if s_[y] > 0 and s_[z] > 0]
        assert len(sols) == 1
    table = {
        "\\sin2\\alpha": lambda Y_, Z_: 2 * Y_ * Z_,
        "\\cos2\\alpha": lambda Y_, Z_: Z_ ** 2 - Y_ ** 2,
        "\\sin^{3}\\alpha+\\cos^{3}\\alpha": lambda Y_, Z_: Y_ ** 3 + Z_ ** 3,
        "\\sin\\alpha\\cos\\alpha": lambda Y_, Z_: Y_ * Z_,
        "\\sin\\alpha": lambda Y_, Z_: Y_,
        "\\cos\\alpha": lambda Y_, Z_: Z_,
        "\\tan2\\alpha": lambda Y_, Z_: (2 * Y_ / Z_) / (1 - (Y_ / Z_) ** 2),
        "\\sin2\\alpha+\\cos2\\alpha": lambda Y_, Z_: 2 * Y_ * Z_ + Z_ ** 2 - Y_ ** 2,
    }
    vals = {sp.simplify(table[ask](s_[y], s_[z])) for s_ in sols}
    assert len(vals) == 1, f"value depends on the choice of angle: {vals}"
    return rat(vals.pop())


# ---------------------------------------------------------------- table of derivatives
def hermite(constraints):
    """constraints: list of (point, order(0|1), value) -> polynomial through them"""
    m = len(constraints)
    cs = sp.symbols(f"c0:{m}")
    poly = sum(cs[i] * X ** i for i in range(m))
    eqs = []
    for pt, order, val in constraints:
        eqs.append((sp.diff(poly, X, order) if order else poly).subs(X, pt) - val)
    sol = sp.solve(eqs, cs, dict=True)
    assert len(sol) == 1, "interpolation not unique"
    return sp.expand(poly.subs(sol[0]))


def chain_table(v):
    items = re.findall(r"([fg])('?)\((-?\d+)\)=(-?\d+)", v["tbl"].replace("\\ ", ""))
    cons = {"f": [], "g": []}
    for fn, pr_, pt, val in items:
        cons[fn].append((int(pt), 1 if pr_ else 0, int(val)))
    funcs = {}
    for fn in "fg":
        funcs[fn] = hermite(cons[fn]) if cons[fn] else sp.Integer(0)
    fl = sp.Lambda(X, funcs["f"])
    gl = sp.Lambda(X, funcs["g"])
    h = parse_expr(tex(v["hx"]), local_dict={**LD, "f": fl, "g": gl}, transformations=TR)
    d = sp.diff(h, X).subs(X, int(v["a"]))
    return rat(d)


# ---------------------------------------------------------------- parametric / implicit / inverse
def param_deriv(v):
    xt, yt = P(v["xt"]), P(v["yt"])
    t0 = P(v["t0"])
    what = v["what"].replace(" ", "")
    dydx = sp.diff(yt, T) / sp.diff(xt, T)
    if what == "\\frac{dy}{dx}":
        e = dydx
    else:
        assert what == "\\frac{d^{2}y}{dx^{2}}", what
        e = sp.diff(dydx, T) / sp.diff(xt, T)
    assert sp.simplify(sp.diff(xt, T).subs(T, t0)) != 0, "dx/dt = 0"
    return rat(sp.simplify(e.subs(T, t0)))


def parse_point(pt):
    pt = pt.replace("\\left", "").replace("\\right", "").replace("\\ ", "")
    assert pt.startswith("(") and pt.endswith(")")
    a, b = pt[1:-1].split(",")
    return P(a), P(b)


def implicit_F(eq):
    lhs, rhs = eq.split("=")
    return P(lhs) - P(rhs)


def implicit_deriv(v):
    import mpmath as mp
    F = implicit_F(v["eq"])
    x0, y0 = parse_point(v["pt"])
    assert sp.simplify(F.subs({X: x0, Y: y0})) == 0, "point not on the curve"
    what = v["what"].replace(" ", "")
    order = 1 if what == "\\frac{dy}{dx}" else 2
    d = sp.idiff(F, Y, X, order).subs({X: x0, Y: y0})
    d = rat(sp.simplify(d))
    # numerical confirmation by solving F(x, y) = 0 near the point
    mp.mp.dps = 50
    Ff = sp.lambdify((X, Y), F, "mpmath")
    y1 = float(sp.diff(F, X).subs({X: x0, Y: y0}) / sp.diff(F, Y).subs({X: x0, Y: y0})) * -1
    def ysol(xv):
        return mp.findroot(lambda yy: Ff(xv, yy), mp.mpf(float(y0)) + y1 * (xv - mp.mpf(float(x0))))
    h = mp.mpf("1e-6")
    if order == 1:
        num_d = (ysol(mp.mpf(float(x0)) + h) - ysol(mp.mpf(float(x0)) - h)) / (2 * h)
    else:
        h = mp.mpf("1e-4")
        num_d = (ysol(mp.mpf(float(x0)) + h) - 2 * ysol(mp.mpf(float(x0))) + ysol(mp.mpf(float(x0)) - h)) / h ** 2
    assert abs(float(num_d) - float(d)) < 1e-4, f"numeric check {num_d} vs {d}"
    return d


def inverse_deriv(v):
    f = P(v["fx"])
    b = float(P(v["b"]))
    ff = sp.lambdify(X, f, "math")
    fd = sp.lambdify(X, sp.diff(f, X), "math")
    xs = np.linspace(-40, 40, 80001)
    ders = np.array([fd(xx) for xx in xs])
    assert np.all(ders >= -1e-12) and np.any(ders > 0), "f is not increasing"
    lo, hi = -40.0, 40.0
    assert ff(lo) < b < ff(hi), "b outside the range"
    for _ in range(200):
        mid = (lo + hi) / 2
        if ff(mid) < b:
            lo = mid
        else:
            hi = mid
    a = (lo + hi) / 2
    assert abs(ff(a) - b) < 1e-8
    return Fraction(1 / fd(a)).limit_denominator(2000)


# ---------------------------------------------------------------- tangent lines
def curve_parts(cv):
    lhs, rhs = cv.split("=", 1)
    if lhs == "y":
        f = P(rhs)
        return f - Y, lambda: sp.diff(f, X)
    F = P(lhs) - P(rhs)
    return F, None


def slope_at(cv, x0, y0):
    lhs, rhs = cv.split("=", 1)
    if lhs == "y":
        f = P(rhs)
        assert sp.simplify(f.subs(X, x0) - y0) == 0, "point not on the curve"
        return sp.simplify(sp.diff(f, X).subs(X, x0))
    F = P(lhs) - P(rhs)
    assert sp.simplify(F.subs({X: x0, Y: y0})) == 0, "point not on the curve"
    return sp.simplify(sp.idiff(F, Y, X).subs({X: x0, Y: y0}))


def tangent_line(v):
    x0, y0 = parse_point(v["pt"])
    m = slope_at(v["cv"], x0, y0)
    line = m * (X - x0) + y0
    return rat(line.subs(X, 0))


def tangent_triangle(v):
    x0, y0 = parse_point(v["pt"])
    m = slope_at(v["cv"], x0, y0)
    assert m != 0
    line = m * (X - x0) + y0
    yi = sp.simplify(line.subs(X, 0))
    xs = sp.solve(sp.Eq(line, 0), X)
    assert len(xs) == 1
    xi = xs[0]
    assert yi != 0 and xi != 0, "degenerate triangle"
    return rat(sp.Abs(xi * yi) / 2)


def common_tangent(v):
    f, g = P(v["f"]), P(v["g"])
    eqs = [f.subs(X, 1) - g.subs(X, 1), sp.diff(f, X).subs(X, 1) - sp.diff(g, X).subs(X, 1)]
    sol = sp.solve(eqs, [A, B], dict=True)
    assert len(sol) == 1, sol
    prod = sol[0][A] * sol[0][B]
    assert sol[0][A] != 0 and sol[0][B] != 0
    return rat(prod)


# ---------------------------------------------------------------- graphs
def extrema_pair(v):
    f = P(v["fx"])
    fp = sp.diff(f, X)
    crit = sp.solve(fp, X)
    crit = [c for c in crit if c.is_real]
    assert len(crit) == 2, f"critical points {crit}"
    f2 = sp.diff(f, X, 2)
    mx = [c for c in crit if f2.subs(X, c) < 0]
    mn = [c for c in crit if f2.subs(X, c) > 0]
    assert len(mx) == 1 and len(mn) == 1, "need one maximum and one minimum"
    return rat(mx[0] - mn[0])


def root_count(v):
    eq = v["eq"]
    dom = None
    if "\\ (" in eq:
        eq, dom = eq.split("\\ (", 1)
    lhs, ks = eq.split("=")
    k = float(ks)
    f = sp.lambdify(X, P(lhs), "numpy")
    pos_only = dom is not None and dom.startswith("x>0")
    pole0 = dom is not None and dom.startswith("x\\ne0")
    right = np.logspace(-9, math.log10(60), 90001)
    left = -right[::-1]
    comps = []
    if pos_only:
        comps.append(right)
    elif pole0:
        comps.append(left)
        comps.append(right)
    else:
        comps.append(np.concatenate([left, [0.0], right]))
    cnt = 0
    with np.errstate(all="ignore"):
        for xs in comps:
            g = f(xs) - k
            assert np.all(np.isfinite(g)), "non-finite values on the scan"
            s = np.sign(g)
            zero_hits = np.sum(s == 0)
            cnt += int(zero_hits)
            nz = s[s != 0]
            cnt += int(np.sum(nz[1:] * nz[:-1] < 0))
    return cnt


def monotone_param(v):
    f = P(v["fx"])
    fd = sp.lambdify((X, A), sp.diff(f, X), "numpy")
    xs = np.arange(-80, 80, 0.01)
    good = []
    for av in range(-60, 61):
        vals = fd(xs, float(av)) * np.ones_like(xs)
        if np.min(vals) >= -1e-9:
            good.append(av)
    assert good and min(good) == -max(good), f"asymmetric solution set {good}"
    assert max(good) < 55
    assert good == list(range(min(good), max(good) + 1)), "not an interval of integers"
    return len(good)


def motion_reverse(v):
    xt = P(v["xt"])
    vel = sp.diff(xt, T)
    acc = sp.diff(vel, T)
    roots = sp.solveset(vel, T, domain=sp.Interval.open(0, 60))
    assert roots.is_FiniteSet and len(roots) >= 1, f"roots {roots}"
    t0 = min(roots, key=lambda r_: float(r_))
    assert float(t0) > 0
    return rat(sp.simplify(acc.subs(T, t0)))


# ---------------------------------------------------------------- integration
def riemann(v):
    pre = P(v["pre"]) if v["pre"] else sp.Integer(1)
    body = P(v["body"])
    pf = sp.lambdify(N, pre, "numpy")
    bf = sp.lambdify((N, K), body, "numpy")

    def S(nn):
        ks = np.arange(1, nn + 1, dtype=float)
        return float(pf(float(nn))) * float(np.sum(bf(float(nn), ks)))

    n0 = 2000
    r1a = 2 * S(2 * n0) - S(n0)
    r1b = 2 * S(4 * n0) - S(2 * n0)
    L = (4 * r1b - r1a) / 3
    val = float(parse_expr(tex(v["ask"]), local_dict={**LD, "L": sp.Float(L, 30)}, transformations=TR))
    fr = Fraction(val).limit_denominator(2000)
    assert abs(val - float(fr)) < 1e-6, f"not a simple rational: {val}"
    return fr


def bound_expr(s):
    return P(s)


def sample_sign(expr, a, b, want_nonneg=True):
    fl = sp.lambdify(X, expr, "numpy")
    xs = np.linspace(float(a), float(b), 2001)
    vals = fl(xs) * np.ones_like(xs)
    return bool(np.all(vals >= -1e-9))


def area_curves(v):
    f, g = P(v["f"]), P(v["g"])
    a, b = P(v["a"]), P(v["b"])
    assert sample_sign(f - g, sp.N(a), sp.N(b)), "f is not above g on the interval"
    Sv = sp.integrate(f - g, (X, a, b))
    ask = parse_expr(tex(v["ask"]), local_dict={**LD, "S": Sv}, transformations=TR)
    return rat(sp.simplify(ask))


def volume_rotate(v):
    f, g = P(v["f"]), P(v["g"])
    a, b = P(v["a"]), P(v["b"])
    assert sample_sign(f - g, sp.N(a), sp.N(b)) and sample_sign(g, sp.N(a), sp.N(b)), "need f >= g >= 0"
    Vv = sp.integrate(sp.pi * (f ** 2 - g ** 2), (X, a, b))
    ask = parse_expr(tex(v["ask"]), local_dict={**LD, "V": Vv}, transformations=TR)
    return rat(sp.simplify(ask))


def definite(v):
    f = P(v["fx"])
    lo, hi = P(v["lo"]), P(v["hi"])
    Iv = sp.integrate(f, (X, lo, hi))
    ask = parse_expr(tex(v["ask"]) if "ask" in v else "I", local_dict={**LD, "I": Iv}, transformations=TR)
    return rat(sp.simplify(ask))


def substitution(v):
    f = P(v["fx"])
    Iv = sp.integrate(f, (X, P(v["lo"]), P(v["hi"])))
    # numerical cross-check with quadrature
    fl = sp.lambdify(X, f, "mpmath")
    import mpmath as mp
    q = mp.quad(fl, [float(sp.N(P(v["lo"]))), float(sp.N(P(v["hi"])))])
    assert abs(float(q) - float(sp.N(Iv))) < 1e-8, "symbolic and numeric integrals differ"
    return rat(sp.simplify(Iv))


def parse_integral(s):
    assert s.startswith("\\int_")
    lo, j = grp(s, 4)
    assert s[j] == "^"
    hi, j = grp(s, j + 1)
    rest = s[j:]
    return lo, hi, rest


def strip_dx(rest):
    assert rest.endswith("\\,dx"), rest
    return rest[:-4]


def subs_transform(v):
    glo, ghi, grest = parse_integral(v["gv"].split("=")[0])
    c = P(v["gv"].split("=")[1])
    glo, ghi = P(glo), P(ghi)
    assert strip_dx(grest) == "f(x)"
    tlo, thi, trest = parse_integral(v["tg"])
    body = strip_dx(trest)
    mid = (glo + ghi) / 2
    h = ghi - glo
    outs = []
    for lam in (0, 3):
        fexpr = c / h + lam * (X - mid)
        assert sp.integrate(fexpr, (X, glo, ghi)) == c
        fl = sp.Lambda(X, fexpr)
        e = parse_expr(tex(body), local_dict={**LD, "f": fl}, transformations=TR)
        outs.append(sp.simplify(sp.integrate(e, (X, P(tlo), P(thi)))))
    assert outs[0] == outs[1], f"target depends on f: {outs}"
    return rat(outs[0])


def parts_formula(v):
    items = [s_ for s_ in re.split(r",\\ ", v["given"]) if s_]
    unknowns = []
    cons_vals = []
    ints = []
    for it in items:
        if it.startswith("f("):
            m = re.fullmatch(r"f\((-?\d+)\)=(-?\d+)", it)
            cons_vals.append((int(m.group(1)), int(m.group(2))))
        else:
            lhs, rhs = it.split("=")
            lo, hi, rest = parse_integral(lhs)
            ints.append((P(lo), P(hi), strip_dx(rest), P(rhs)))
    m_ = len(cons_vals) + len(ints)
    outs = []
    for extra in (0, 1):
        cs = sp.symbols(f"c0:{m_ + 1}")
        poly = sum(cs[i] * X ** i for i in range(m_ + 1))
        eqs = [poly.subs(X, p) - val for p, val in cons_vals]
        for lo, hi, body, val in ints:
            integrand = parse_expr(tex(body), local_dict={**LD, "f": sp.Lambda(X, poly)}, transformations=TR)
            eqs.append(sp.integrate(integrand, (X, lo, hi)) - val)
        eqs.append(cs[m_] - extra)
        sol = sp.solve(eqs, cs, dict=True)
        assert len(sol) == 1
        fp = poly.subs(sol[0])
        tlo, thi, trest = parse_integral(v["tg"])
        body = strip_dx(trest).replace("f'(x)", "fp(x)")
        e = parse_expr(tex(body), local_dict={**LD, "fp": sp.Lambda(X, sp.diff(fp, X))}, transformations=TR)
        outs.append(sp.simplify(sp.integrate(e, (X, P(tlo), P(thi)))))
    assert outs[0] == outs[1], f"target not determined by the data: {outs}"
    return rat(outs[0])


def velocity_integral(v):
    vel = P(v["vt"])
    x0 = P(str(v["x0"]))
    ask = v["ask"]
    m = re.fullmatch(r"x\\left\((.*)\\right\)", ask)
    if m:
        Tt = P(m.group(1))
        return rat(sp.simplify(x0 + sp.integrate(vel, (T, 0, Tt))))
    m = re.fullmatch(r"\\int_\{0\}\^\{(.*)\}\|v\(t\)\|\\,dt", ask)
    assert m, ask
    Tt = P(m.group(1))
    pts = sp.solveset(vel, T, sp.Interval(0, Tt))
    assert pts.is_FiniteSet
    cut = sorted([sp.Integer(0), Tt] + [p for p in pts if p not in (0, Tt)], key=lambda z: float(z))
    tot = 0
    for lo, hi in zip(cut[:-1], cut[1:]):
        mid = (lo + hi) / 2
        sgn = 1 if float(vel.subs(T, mid)) >= 0 else -1
        tot += sgn * sp.integrate(vel, (T, lo, hi))
    return rat(sp.simplify(tot))


VERIFY = {
    "ca2_seqLimit": seq_limit,
    "ca2_seqGeoLimit": seq_geo_limit,
    "ca2_geoConvCount": geo_conv_count,
    "ca2_seqSumLimit": seq_sum_limit,
    "ca2_partialSumSeries": partial_sum_series,
    "ca2_telescope": telescope,
    "ca2_geoSeriesParam": geo_series_param,
    "ca2_ballDistance": ball_distance,
    "ca2_expLogLimit": exp_log_limit,
    "ca2_eExponent": e_exponent,
    "ca2_derivExpLog": deriv_exp_log,
    "ca2_quotientDeriv": quotient_deriv,
    "ca2_trigLimit": trig_limit,
    "ca2_trigLimitUnknown": trig_limit_unknown,
    "ca2_limitPair": limit_pair,
    "ca2_trigDeriv": trig_deriv,
    "ca2_addTheorem": add_theorem,
    "ca2_lineAngle": line_angle,
    "ca2_doubleAngle": double_angle,
    "ca2_chainTable": chain_table,
    "ca2_paramDeriv": param_deriv,
    "ca2_implicitDeriv": implicit_deriv,
    "ca2_inverseDeriv": inverse_deriv,
    "ca2_tangentLine": tangent_line,
    "ca2_tangentTriangle": tangent_triangle,
    "ca2_commonTangent": common_tangent,
    "ca2_extremaPair": extrema_pair,
    "ca2_rootCount": root_count,
    "ca2_monotoneParam": monotone_param,
    "ca2_motionReverse": motion_reverse,
    "ca2_riemann": riemann,
    "ca2_areaCurves": area_curves,
    "ca2_volumeRotate": volume_rotate,
    "ca2_integralBasic": definite,
    "ca2_substitution": substitution,
    "ca2_subsTransform": subs_transform,
    "ca2_partsFormula": parts_formula,
    "ca2_partsEval": definite,
    "ca2_velocityIntegral": velocity_integral,
}
