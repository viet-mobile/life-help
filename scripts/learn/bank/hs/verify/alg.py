"""Independent checks for modules/alg.mjs (대수).  Every function re-derives the answer with sympy / mpmath / Fraction / brute force and asserts the preconditions."""
import math, re
from fractions import Fraction
from itertools import product

import mpmath as mp
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, implicit_multiplication, split_symbols, convert_xor

mp.mp.dps = 60
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
x_ = sp.Symbol("x", real=True)
n_ = sp.Symbol("n", integer=True)


def tex2frac(s):
    """'3', '-5', '\\frac{3}{4}', '-\\frac{3}{4}' -> Fraction"""
    s = str(s).strip()
    m = re.fullmatch(r"(-?)\\frac\{(\d+)\}\{(\d+)\}", s)
    if m:
        f = Fraction(int(m.group(2)), int(m.group(3)))
        return -f if m.group(1) else f
    return Fraction(s)


def ptex(s):
    """parse a simple LaTeX expression in x / n / k into sympy"""
    s = s.replace("\\cdot", "*").replace("\\times", "*").replace("^{", "**(").replace("}", ")")
    s = re.sub(r"\\frac\(([^)]*)\)\(([^)]*)\)", r"((\1)/(\2))", s)
    return parse_expr(s, transformations=TR, local_dict={"x": x_})


def rat_of(mpv, maxden=10**6, tol=mp.mpf(10) ** -30):
    f = Fraction(str(mp.nstr(mpv, 50))).limit_denominator(maxden)
    assert abs(mp.mpf(f.numerator) / f.denominator - mpv) < tol, f"not rational: {mpv}"
    return f


def texnum(s):
    """simple LaTeX number / fraction"""
    return tex2frac(s)


def clean_frac(s):
    s = re.sub(r"\\left\(\\frac\{(\d+)\}\{(\d+)\}\\right\)", r"(\1/\2)", s)
    return s


S_, C_, T_ = sp.symbols("s c t")


def trig_tex(tex):
    """expression in sin/cos/tan of theta -> sympy expression in s, c, t"""
    m = {"sin": "s", "cos": "c", "tan": "t"}
    e = re.sub(r"\\(sin|cos|tan)\^\{(\d)\}\\theta", lambda g: m[g.group(1)] + "**" + g.group(2), tex)
    e = re.sub(r"\\(sin|cos|tan)\\theta", lambda g: m[g.group(1)], e)
    e = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", e)
    e = re.sub(r"\^\{(\d)\}", r"**\1", e)
    assert "\\" not in e, e
    return parse_expr(e, transformations=standard_transformations + (split_symbols, implicit_multiplication), local_dict={"s": S_, "c": C_, "t": T_})


class _Dom(Exception):
    pass


def logfn(arg, base):
    if arg <= 0:
        raise _Dom()
    return mp.log(arg) / mp.log(base)


def conv_logs(s):
    """\\log_{B}ARG -> L(ARG, B) (B integer or \\frac{a}{b})"""
    def rep(m):
        b = m.group(1)
        mb = re.fullmatch(r"\\frac\{(\d+)\}\{(\d+)\}", b)
        base = f"(mp.mpf({mb.group(1)})/{mb.group(2)})" if mb else f"mp.mpf({b})"
        return f"L({m.group(2)},{base})"
    arg = r"(x|\((?:[^()]|\([^()]*\))*\))"
    return re.sub(r"\\log_\{((?:[^{}]|\{[^{}]*\})*)\}" + arg, rep, s)


def to_py(s):
    """LaTeX-ish arithmetic -> python source (x, L, mp available)"""
    s = s.replace("\\cdot", "*").replace("\\times", "*")
    s = re.sub(r"\^\{((?:[^{}]|\{[^{}]*\})*)\}", r"**(\1)", s)
    s = re.sub(r"(\d)(x|\()", r"\1*\2", s)
    s = re.sub(r"(x)(\()", r"\1*\2", s)
    s = re.sub(r"\)(\d|x|L|\()", r")*\1", s)
    return s

# ---------------------------------------------------------------- exponents & logarithms
def rootEval(v):
    a, b, n, m = v["ra"], v["rb"], v["rn"], v["rm"]
    R = lambda t, k: mp.root(mp.mpf(t), k)
    if v["kind"] == 1:
        val = R(a, n) * R(b, n)
    elif v["kind"] == 2:
        val = R(a, n) / R(b, n)
    else:
        val = R(R(a, n), m)
    f = rat_of(val)
    assert f.denominator == 1
    return int(f)


def realRootCount(v):
    A = sp.sympify(re.sub(r"\^\{(\d+)\}", r"**(\1)", v["rad"]))
    assert A != 0
    tot = 0
    for n in range(2, v["N"] + 1):
        tot += len(sp.Poly(x_ ** n - A, x_).real_roots()) if False else sp.Poly(x_ ** n - A, x_).count_roots()
    return tot


def rationalExp(v):
    val = sp.Rational(v["a1"]) ** sp.Rational(v["n1"], v["d1"]) * sp.Rational(v["a2"]) ** sp.Rational(v["n2"], v["d2"])
    val = sp.nsimplify(sp.simplify(val))
    assert val.is_Rational, val
    return val


def expSum(v):
    a, g, e1, k, e2, s = v["a"], v["g"], v["e1"], v["k"], v["e2"], v["s"]
    t = sp.Symbol("t", positive=True)
    sols = [r for r in sp.solve(t + e1 / t - s, t) if r.is_real and r > 0]
    assert sols, "no real x"
    vals = set()
    for r in sols:
        vals.add(sp.simplify(sp.expand(r ** k + e2 * r ** (-k))))
    assert len(vals) == 1, vals
    out = vals.pop()
    assert out.is_Rational
    return out


def logChain(v):
    xs = [int(t) for t in v["args"].split(",")]
    val = mp.mpf(1)
    for i in range(len(xs) - 1):
        val *= mp.log(xs[i + 1]) / mp.log(xs[i])
    return rat_of(val)


def logExpress(v):
    Rn, Rd, m = v["Rn"], v["Rd"], v["m"]
    fn, fd = sp.factorint(Rn), sp.factorint(Rd)
    ex = {2: 0, 3: 0, 5: 0}
    for p_, e in fn.items():
        assert p_ in ex, "prime outside {2,3,5}"
        ex[p_] += e
    for p_, e in fd.items():
        assert p_ in ex
        ex[p_] -= e
    x, y, z = Fraction(ex[3], m), Fraction(ex[5], m), Fraction(ex[2], m)
    N = (mp.mpf(Rn) / Rd) ** (mp.mpf(1) / m)
    lhs = mp.log(N, 2)
    rhs = mp.mpf(x.numerator) / x.denominator * mp.log(3, 2) + mp.mpf(y.numerator) / y.denominator * mp.log(5, 2) + mp.mpf(z.numerator) / z.denominator
    assert abs(lhs - rhs) < mp.mpf(10) ** -40
    return x + y + z


def digitsPow(v):
    big = v["b1"] ** v["n1"] * v["b2"] ** v["n2"]
    d = len(str(big))
    LG = {2: Fraction(3010, 10000), 3: Fraction(4771, 10000), 5: Fraction(6990, 10000), 7: Fraction(8451, 10000), 1: Fraction(0)}
    given = LG[v["b1"]] * v["n1"] + LG[v["b2"]] * v["n2"]
    assert math.floor(given) + 1 == d, "given 4-digit logs disagree with true digit count"
    return d


def growthYears(v):
    r, k = v["rate"], v["k"]
    n, cur = 0, Fraction(1)
    while cur < k:
        cur *= Fraction(100 + r, 100)
        n += 1
    # the stated logarithm values must give the same integer
    q = Fraction(v["lk"]) / Fraction(v["l1"])
    assert math.ceil(q) == n, (q, n)
    return n



def expFuncParams(v):
    p, q, r = v["p"], v["q"], v["r"]
    u, w = sp.Rational(tex2frac(v["u"]).numerator, tex2frac(v["u"]).denominator), sp.Rational(tex2frac(v["v"]).numerator, tex2frac(v["v"]).denominator)
    a = sp.Symbol("a", real=True)
    b = sp.Symbol("b", positive=True)
    sols = sp.solve([a * b ** p - u, a * b ** q - w], [a, b], dict=True)
    sols = [s for s in sols if sp.simplify(s[b] - 1) != 0]
    assert len(sols) == 1, sols
    return sp.nsimplify(sp.simplify(sols[0][a] * sols[0][b] ** r))


def expShiftA(v):
    f = v["f"]
    m = re.fullmatch(r"y=(-?\d*)a\^\{([^}]*)\}([+-]\d+)?", f)
    assert m, f
    c = {"": 1, "-": -1}.get(m.group(1), None)
    c = c if c is not None else int(m.group(1))
    ex = ptex(m.group(2))
    n = int(m.group(3)) if m.group(3) else 0
    e = ex.subs(x_, v["p"])
    assert e != 0
    a = sp.Symbol("a", positive=True)
    sols = [s for s in sp.solve(sp.Eq(c * a ** e + n, v["q"]), a) if s != 1]
    assert len(sols) == 1, sols
    return sp.nsimplify(sols[0])


def expEquation(v):
    lhs, rhs = v["eq"].split("=")
    expr = ptex(lhs) - ptex(rhs)
    f = sp.lambdify(x_, expr, "math")
    grid = [i / 64 for i in range(-14 * 64, 14 * 64 + 1)]
    vals = [f(t) for t in grid]
    roots = []
    for i, t in enumerate(grid):
        if abs(vals[i]) < 1e-9:
            roots.append(t)
        elif i + 1 < len(grid) and vals[i] * vals[i + 1] < 0 and abs(vals[i + 1]) >= 1e-9:
            lo, hi = grid[i], grid[i + 1]
            for _ in range(60):
                mid = (lo + hi) / 2
                if f(lo) * f(mid) <= 0:
                    hi = mid
                else:
                    lo = mid
            roots.append((lo + hi) / 2)
    assert len(roots) == 2, roots
    s = sum(roots)
    assert abs(s - round(s)) < 1e-6
    return int(round(s))


def expInequality(v):
    ineq = clean_frac(v["ineq"])
    m = re.fullmatch(r"(.*?)(\\le|\\ge|<|>)(.*)", ineq)
    assert m, ineq
    L, op, R = ptex(m.group(1)), m.group(2), ptex(m.group(3))
    def ok(x):
        a, b = L.subs(x_, x), R.subs(x_, x)
        return {"\\le": a <= b, "\\ge": a >= b, "<": a < b, ">": a > b}[op]
    sol = [x for x in range(-45, 46) if ok(x)]
    assert not ok(-90) and not ok(90), "unbounded solution set"
    return len(sol)


def logEquation(v):
    eq = v["eq"]
    lhs, rhs = eq.split("=")
    code = "(" + to_py(conv_logs(lhs)) + ")-(" + rhs + ")"
    env = {"L": logfn, "mp": mp}
    def f(t):
        try:
            return eval(code, env, {"x": mp.mpf(t)})
        except _Dom:
            return None
    pts = [mp.mpf(i) / 32 for i in range(-60 * 32, 400 * 32)]
    vals = [f(t) for t in pts]
    roots = []
    for i in range(len(pts)):
        if vals[i] is None:
            continue
        if abs(vals[i]) < mp.mpf(10) ** -25:
            roots.append(pts[i])
        elif i + 1 < len(pts) and vals[i + 1] is not None and vals[i] * vals[i + 1] < 0 and abs(vals[i + 1]) >= mp.mpf(10) ** -25:
            roots.append(mp.findroot(lambda z: f(z), (pts[i], pts[i + 1]), solver="bisect", tol=1e-30, maxsteps=200))
    assert len(roots) == 1, roots
    assert abs(roots[0] - round(roots[0])) < 1e-20
    return int(round(roots[0]))


def _lg(u, B):
    return mp.log(u) / mp.log(B)


def logInequality(v):
    s = v["ineq"]
    parts = re.split(r"(\\le|\\ge|<|>)", s)
    exprs = [to_py(conv_logs(p)) for p in parts[0::2]]
    ops = parts[1::2]
    eps = mp.mpf(10) ** -35
    chk = {"\\le": lambda a, b: a <= b + eps, "\\ge": lambda a, b: a >= b - eps, "<": lambda a, b: a < b - eps, ">": lambda a, b: a > b + eps}
    env = {"L": logfn, "mp": mp}
    cnt = 0
    for x in range(-400, 401):
        try:
            vals = [eval(e, env, {"x": mp.mpf(x)}) for e in exprs]
        except _Dom:
            continue
        if all(chk[o](vals[i], vals[i + 1]) for i, o in enumerate(ops)):
            assert abs(x) < 380, "unbounded"
            cnt += 1
    return cnt


def inverseGraph(v):
    f, p, q = v["f"], v["p"], v["q"]
    cands = [Fraction(k) for k in range(2, 13)] + [Fraction(1, k) for k in range(2, 13)]
    good = []
    for a in cands:
        A = mp.mpf(a.numerator) / a.denominator
        if v["kind"] == 1:
            m = re.fullmatch(r"y=\\log_\{a\}(x|\(x([+-]\d+)\))([+-]\d+)?", f)
            assert m, f
            mm = int(m.group(2)) if m.group(2) else 0
            n = int(m.group(3)) if m.group(3) else 0
            if q + mm <= 0:
                continue
            val = mp.log(q + mm) / mp.log(A) + n          # original f evaluated at x=q (the inverse passes (p, q))
        else:
            m = re.fullmatch(r"y=a\^\{([^}]*)\}([+-]\d+)?", f)
            assert m, f
            ex = ptex(m.group(1)).subs(x_, q)
            n = int(m.group(2)) if m.group(2) else 0
            val = A ** mp.mpf(int(ex)) + n
        if abs(val - p) < mp.mpf(10) ** -30:
            good.append(a)
    assert len(good) == 1, good
    return good[0]


def logDomain(v):
    f = v["f"]
    conds = []
    base = r"\{(?:[^{}]|\{[^{}]*\})*\}"
    arg = r"(x|\((?:[^()]|\([^()]*\))*\))"
    for m in re.finditer(r"\\log_" + base + arg, f):
        conds.append((">", ptex(m.group(1))))
    for m in re.finditer(r"\\sqrt\{([^{}]*)\}", f):
        conds.append((">=", ptex(m.group(1))))
    assert conds
    cnt = 0
    for x in range(-150, 151):
        ok = True
        for op, e in conds:
            val = e.subs(x_, x)
            ok = ok and (val > 0 if op == ">" else val >= 0)
        cnt += bool(ok)
    return cnt


def expMaxMin(v):
    expr = ptex(clean_frac(v["f"])[2:])
    f = sp.lambdify(x_, expr, "math")
    N = (v["t"] - v["s"]) * 1000
    best = max(f(v["s"] + j / 1000) for j in range(N + 1))
    return Fraction(best).limit_denominator(10 ** 5)


# ---------------------------------------------------------------- angles and trigonometry
def _parse_angle_deg(s):
    s = s.strip()
    m = re.fullmatch(r"(-?\d+)\^\\circ", s)
    if m:
        return Fraction(int(m.group(1)))
    m = re.fullmatch(r"(-?)(?:\\frac\{(\d*)\\pi\}\{(\d+)\}|(\d*)\\pi|\\frac\{(\d+)\}\{(\d+)\}\\pi)", s)
    assert m, s
    sign = -1 if m.group(1) else 1
    if m.group(3):
        num = int(m.group(2) or 1); den = int(m.group(3))
    elif m.group(5):
        num = int(m.group(5)); den = int(m.group(6))
    else:
        num = int(m.group(4) or 1); den = 1
    return sign * Fraction(num, den) * 180


def coterminal(v):
    deg = _parse_angle_deg(v["theta"])
    assert deg.denominator == 1
    a = deg % 360
    assert a != 0
    return a


def halfAngleQuad(v):
    m, n = v["m"], v["n"]
    qs = set()
    for k in range(-3 * n, 3 * n + 1):
        for i in range(1, 200):
            th = Fraction(90 * (m - 1)) + Fraction(90 * i, 200) + 360 * k
            a = (th / n) % 360
            assert a % 90 != 0
            qs.add(int(a // 90) + 1)
    return sum(qs)


def sectorForward(v):
    th = v["th"]
    m = re.fullmatch(r"(\d+)\^\\circ", th)
    if m:
        deg = Fraction(int(m.group(1)))
    else:
        m = re.fullmatch(r"\\frac\{(\d*)\\pi\}\{(\d+)\}", th)
        deg = Fraction(int(m.group(1) or 1) * 180, int(m.group(2)))
    r = v["r"]
    th_over_pi = deg / 180
    arc = r * th_over_pi            # coefficient of pi
    area = Fraction(1, 2) * r * r * th_over_pi
    return arc + area


def sectorPerimArea(v):
    r, l = sp.symbols("r l", positive=True)
    sols = sp.solve([2 * r + l - v["P"], r * l / 2 - v["S"]], [r, l], dict=True)
    good = [s for s in sols if s[l] > 0 and s[l] / s[r] < 2 * sp.pi]
    assert len(good) == 2, sols
    return max(s[r] for s in good)


def _sct(x, y):
    r = sp.sqrt(sp.Integer(x) ** 2 + sp.Integer(y) ** 2)
    return sp.Rational(y) / r, sp.Rational(x) / r, sp.Rational(y) / sp.Rational(x)


def trigPoint(v):
    x, y = v["xp"], v["yp"]
    assert sp.sqrt(x * x + y * y).is_Integer
    s_, c_, t_ = _sct(x, y)
    return sp.nsimplify(trig_tex(v["E"]).subs({S_: s_, C_: c_, T_: t_}))


def trigGiven(v):
    quad = v["quad"]
    m = re.fullmatch(r"\\(sin|cos|tan)\\theta=(.*)", v["given"])
    f, val = m.group(1), tex2frac(m.group(2))
    expr = trig_tex(v["E"])
    sx = 1 if quad in (1, 4) else -1
    sy = 1 if quad in (1, 2) else -1
    results = set()
    for r in range(1, 200):
        for x in range(1, r):
            y2 = r * r - x * x
            y = math.isqrt(y2)
            if y * y != y2 or y == 0:
                continue
            X, Y = sx * x, sy * y
            ratios = {"sin": Fraction(Y, r), "cos": Fraction(X, r), "tan": Fraction(Y, X)}
            if ratios[f] != val:
                continue
            s_, c_, t_ = _sct(X, Y)
            results.add(sp.nsimplify(expr.subs({S_: s_, C_: c_, T_: t_})))
    assert len(results) == 1, results
    return results.pop()


def trigIdentity(v):
    s, c = sp.symbols("s c", real=True)
    lhs, rhs = v["given"].split("=")
    gv = tex2frac(rhs)
    g = trig_tex(lhs).subs({S_: s, C_: c})
    sols = sp.solve([sp.Eq(g, sp.Rational(gv.numerator, gv.denominator)), sp.Eq(s ** 2 + c ** 2, 1)], [s, c], dict=True)
    sols = [q for q in sols if all(val.is_real for val in q.values())]
    assert sols, "no real theta"
    e = trig_tex(v["E"]).subs({S_: s, C_: c, T_: s / c})
    vals = set()
    for q in sols:
        assert q[s] != 0 and q[c] != 0
        vals.add(sp.nsimplify(sp.simplify(e.subs(q))))
    assert len(vals) == 1, vals
    return vals.pop()


def trigRootCount(v):
    m = re.fullmatch(r"(-?\d*)\\(sin|cos|tan)\\,(\d*)\\theta=(-?\d+)", v["eq"])
    assert m, v["eq"]
    a = {"": 1, "-": -1}.get(m.group(1)) or int(m.group(1))
    fn, mm, b = m.group(2), int(m.group(3) or 1), int(m.group(4))
    F = {"sin": np.sin, "cos": np.cos, "tan": np.tan}[fn]
    N = 200000 * mm
    th = np.linspace(0, 2 * np.pi, N, endpoint=False)
    f = np.abs(a * F(mm * th) - b)
    left, right = np.roll(f, 1), np.roll(f, -1)
    idx = np.where((f <= left) & (f < right) & (f < 1e-2))[0]
    cnt = 0
    h = 2 * np.pi / N
    g = lambda z: abs(a * F(mm * z) - b)
    for i in idx:
        lo, hi = th[i] - h, th[i] + h
        for _ in range(200):                      # golden-section search for the local minimum of |f|
            m1, m2 = lo + (hi - lo) * 0.381966, lo + (hi - lo) * 0.618034
            if g(m1) < g(m2):
                hi = m2
            else:
                lo = m1
        if g((lo + hi) / 2) < 1e-7:
            cnt += 1
    return cnt


def trigPeriod(v):
    code = v["code"]
    xs = np.linspace(0.123, 17.0, 60)
    ns = {"sin": np.sin, "cos": np.cos, "tan": np.tan, "abs": np.abs, "pi": np.pi}
    fx = lambda arr: eval(code, {"__builtins__": {}}, {**ns, "x": arr})
    base = fx(xs)
    cands = sorted({Fraction(p, q) for q in range(1, 13) for p in range(1, 12 * 10)})
    for k in cands:
        T = float(k) * np.pi
        shifted = fx(xs + T)
        both = np.isfinite(base) & np.isfinite(shifted) & (np.abs(base) < 1e6) & (np.abs(shifted) < 1e6)
        if both.sum() >= 40 and np.allclose(base[both], shifted[both], atol=1e-9, rtol=1e-9):
            return k
    raise AssertionError("no period found")


def trigGraphParam(v):
    M, m = v["M"], v["m"]
    per_s = v["per"]
    mm = re.fullmatch(r"(?:\\frac\{(\d+)\}\{(\d+)\}|(\d+))?\\pi", per_s)
    assert mm, per_s
    per = Fraction(int(mm.group(1)), int(mm.group(2))) if mm.group(1) else Fraction(int(mm.group(3))) if mm.group(3) else Fraction(1)
    b = Fraction(2) / per
    a, c = Fraction(M - m, 2), Fraction(M + m, 2)
    # numerical check of the reconstructed function
    F = np.sin if "sin" in v["fn"] else np.cos
    xs = np.linspace(0, 40, 400001)
    y = float(a) * F(float(b) * xs) + float(c)
    assert abs(y.max() - M) < 1e-6 and abs(y.min() - m) < 1e-6
    T = float(per) * np.pi
    assert np.allclose(float(a) * F(float(b) * (xs[:1000] + T)) + float(c), y[:1000], atol=1e-9)
    assert not np.allclose(float(a) * F(float(b) * (xs[:1000] + T / 2)) + float(c), y[:1000], atol=1e-6)
    return a * b * c


def trigSpecial(v):
    expr = v["expr"]
    term = re.compile(r"([+-]?)(\d*)\\(sin|cos|tan)\s*(\\left\(.*?\\right\)|-?\d+\^\\circ|\\frac\{\d+\}\{\d+\}\\pi|\d*\\pi|0)")
    pos, total = 0, sp.Integer(0)
    for m in term.finditer(expr):
        assert m.start() == pos, (expr, pos)
        pos = m.end()
        ang = m.group(4)
        if ang.startswith("\\left("):
            ang = ang[len("\\left("):-len("\\right)")]
        deg = Fraction(0) if ang == "0" else _parse_angle_deg(ang)
        fn = {"sin": sp.sin, "cos": sp.cos, "tan": sp.tan}[m.group(3)]
        coef = int(m.group(2) or 1) * (-1 if m.group(1) == "-" else 1)
        total += coef * fn(sp.Rational(deg.numerator, deg.denominator) * sp.pi / 180)
    assert pos == len(expr), expr
    return sp.nsimplify(total)

def circumradius(v):
    m = re.fullmatch(r"\\(sin|cos) A=(-?)\\frac\{(\d+)\}\{(\d+)\}", v["cond"])
    assert m, v["cond"]
    val = sp.Rational(int(m.group(3)), int(m.group(4))) * (-1 if m.group(2) else 1)
    sinA = val if m.group(1) == "sin" else sp.sqrt(1 - val ** 2)
    assert 0 < sinA <= 1
    return sp.nsimplify(sp.Rational(v["side"]) / (2 * sinA))


def survey(v):
    d = sp.Integer(v["d"])
    sa, sb = [tex2frac(v[k]) for k in ("sa", "sb")]
    ta = sp.Rational(sa.numerator, sa.denominator)
    tb = sp.Rational(sb.numerator, sb.denominator)
    A, B = sp.asin(ta), sp.asin(tb)           # acute angles
    tanA, tanB = sp.tan(A), sp.tan(B)
    xc = d * tanB / (tanA + tanB)              # C = (xc, xc tanA) with A=(0,0), B=(d,0)
    yc = xc * tanA
    return sp.nsimplify(sp.simplify(sp.sqrt(xc ** 2 + yc ** 2)))


def cosLawSide(v):
    a, b = v["a"], v["b"]
    cond = v["cond"]
    if "circ" in cond:
        ang = int(re.search(r"=(\d+)", cond).group(1))
        C = sp.pi * ang / 180
    else:
        f = tex2frac(cond.split("=", 1)[1])
        C = sp.acos(sp.Rational(f.numerator, f.denominator))
    # coordinates: C at origin, A=(b,0), B=a(cos C, sin C)
    Ax, Bx, By = b, a * sp.cos(C), a * sp.sin(C)
    return sp.nsimplify(sp.simplify(sp.sqrt(sp.simplify((Ax - Bx) ** 2 + By ** 2))))


def obtuseCount(v):
    a, b = v["a"], v["b"]
    cnt = 0
    for x in range(1, a + b + 3):
        s = sorted([a, b, x])
        if s[2] >= s[0] + s[1]:
            continue
        cosines = [Fraction(p * p + q * q - r * r, 2 * p * q) for p, q, r in ((a, b, x), (a, x, b), (b, x, a))]
        if any(c < 0 for c in cosines):
            cnt += 1
    return cnt


# ---------------------------------------------------------------- sequences
def arithTwoTerms(v):
    a1, d = sp.symbols("a1 d")
    s = sp.solve([a1 + (v["p"] - 1) * d - v["u"], a1 + (v["q"] - 1) * d - v["v"]], [a1, d], dict=True)
    assert len(s) == 1
    return s[0][a1] + (v["r"] - 1) * s[0][d]


def arithSumMax(v):
    a1, d = sp.symbols("a1 d")
    s = sp.solve([a1 + (v["p"] - 1) * d - v["u"], a1 + (v["q"] - 1) * d - v["v"]], [a1, d], dict=True)[0]
    assert s[d] < 0 and s[a1] > 0
    S = lambda n: n * (2 * s[a1] + (n - 1) * s[d]) / 2
    nn = sp.Symbol("nn", positive=True)
    vertex = sp.solve(sp.diff(S(nn), nn), nn)[0]
    best = max(S(k) for k in range(1, 400))
    cand = max(S(sp.floor(vertex)), S(sp.ceiling(vertex)))
    assert best == cand
    return best


def arithFirstExceeds(v):
    a, d, N = v["a"], v["d"], v["N"]
    n = sp.Symbol("n", real=True)
    S = n * (2 * a + (n - 1) * d) / 2
    roots = sp.solve(sp.Eq(S, N), n)
    rmax = max(roots)
    k = int(sp.floor(rmax)) + 1
    assert k >= 1 and S.subs(n, k) > N and (k == 1 or S.subs(n, k - 1) <= N)
    # S_n > N must not hold earlier (the parabola opens upward; check by brute force too)
    assert all(S.subs(n, j) <= N for j in range(1, k))
    return k


def arithGeoMix(v):
    d = sp.Symbol("d", real=True)
    y = sp.Rational(v["S"], 3)
    sols = [s for s in sp.solve(sp.Eq(y ** 2, (y - d) * (y + d + v["k"])), d) if s > 0]
    assert len(sols) == 1
    ans = sols[0]
    assert y - ans > 0
    return ans


def sumToTerm(v):
    S = sp.lambdify(n_, ptex(v["expr"].replace("n", "n_")), "sympy") if False else None
    expr = ptex(v["expr"].replace("\\cdot", "*"))
    n = [s for s in expr.free_symbols][0]
    f = lambda t: expr.subs(n, t)
    k = v["k"]
    return f(1) + (f(k) - f(k - 1))


def geoTwoTerms(v):
    a, r = sp.symbols("a r", positive=True)
    sols = sp.solve([a * r ** (v["p"] - 1) - v["u"], a * r ** (v["q"] - 1) - v["v"]], [a, r], dict=True)
    assert len(sols) == 1, sols
    return sp.nsimplify(sols[0][a] * sols[0][r] ** (v["r"] - 1))


def geoSumRatio(v):
    n, u, w = v["n1"], v["u"], v["v"]
    X = sp.Symbol("X", real=True)
    q = sp.Rational(w, u) - 1
    outs = set()
    for r in sp.real_roots(X ** n - q):
        r = sp.nsimplify(r)
        assert r != 1
        a = u * (r - 1) / (r ** n - 1)
        S = lambda m: a * (r ** m - 1) / (r - 1)
        assert sp.simplify(S(n) - u) == 0 and sp.simplify(S(2 * n) - w) == 0
        outs.add(sp.simplify(S(3 * n)))
    assert len(outs) == 1, outs
    return outs.pop()


def sigmaSquare(v):
    a, b = sp.symbols("a b")
    comb = v["comb"].replace("a_k", "a").replace("b_k", "b")
    e = sp.expand(parse_expr(comb, transformations=TR) ** 2)
    P = sp.Poly(e, a, b)
    A, B, C = v["A"], v["B"], v["C"]
    assert B * B <= A * C, "Cauchy-Schwarz violated: no such sequences"
    return P.coeff_monomial(a ** 2) * A + P.coeff_monomial(a * b) * B + P.coeff_monomial(b ** 2) * C


def sigmaTelescope(v):
    n, kd = v["n"], v["kind"]
    tot = Fraction(0)
    for k in range(1, n + 1):
        if kd in (1, 2, 3):
            tot += Fraction(1, k * (k + kd))
        elif kd == 4:
            tot += Fraction(1, (2 * k - 1) * (2 * k + 1))
        else:
            tot += Fraction(1, k * (k + 1) * (k + 2))
    m = re.search(r"\\sum_\{k=1\}\^\{(\d+)\}", v["expr"])
    assert int(m.group(1)) == n
    return tot


def sigmaSubseq(v):
    an = ptex(v["an"])
    nsym = [s for s in an.free_symbols][0]
    idx = ptex(v["idx"])
    ksym = [s for s in idx.free_symbols][0]
    return sum(an.subs(nsym, idx.subs(ksym, k)) for k in range(1, v["m"] + 1))


def seriesPattern(v):
    t, n = v["t"], v["n"]
    if t == "A":
        return sum(sum(range(1, k + 1)) for k in range(1, n + 1))
    if t == "B":
        return sum(k * (n + 1 - k) for k in range(1, n + 1))
    if t == "C":
        return sum(k * (k + 2) for k in range(1, n + 1))
    if t == "D":
        return sum((-1) ** (k + 1) * k * k for k in range(1, n + 1))
    if t == "E":
        return sum(k * (k + 1) * (k + 2) for k in range(1, n + 1))
    return sum(sum(2 * j for j in range(1, k + 1)) for k in range(1, n + 1))


def recAffine(v):
    p, q, s, k = sp.Rational(v["pn"], v["pd"]), v["q"], v["s"], v["k"]
    f = sp.Function("f")
    sol = sp.rsolve(f(n_ + 1) - p * f(n_) - q, f(n_), {f(1): s})
    return sp.nsimplify(sol.subs(n_, k))



def collatz(v):
    a, n = v["s"], 1
    while a != 1:
        a = a // 2 if a % 2 == 0 else v["p"] * a + v["q"]
        n += 1
        assert n < 500
    return n


def recParam(v):
    p = sp.Symbol("p", real=True)
    a2 = v["s"] * p + v["q"]
    a3 = p * a2 + v["q"]
    sols = [r for r in sp.solve(sp.Eq(a3, v["t"]), p) if r > 0]
    assert len(sols) == 1
    return sols[0]


def seqIntTerms(v):
    p, q, r = v["p"], v["q"], v["r"]
    big = 20000
    cnt = 0
    for n in range(1, big):
        if (p * n + q) % (n + r) == 0:
            cnt += 1
    # no integer-valued term beyond |D|+r: the remainder |D| < n+r
    D = q - p * r
    assert abs(D) < big - 1 - r
    return cnt


VERIFY = {
    "alg_rootEval": rootEval, "alg_realRootCount": realRootCount, "alg_rationalExp": rationalExp, "alg_expSum": expSum, "alg_logChain": logChain,
    "alg_logExpress": logExpress, "alg_digitsPow": digitsPow, "alg_growthYears": growthYears, "alg_expFuncParams": expFuncParams,
    "alg_expShiftA": expShiftA, "alg_expEquation": expEquation, "alg_expInequality": expInequality, "alg_logEquation": logEquation,
    "alg_logInequality": logInequality, "alg_inverseGraph": inverseGraph, "alg_logDomain": logDomain, "alg_expMaxMin": expMaxMin,
    "alg_coterminal": coterminal, "alg_halfAngleQuad": halfAngleQuad, "alg_sectorForward": sectorForward, "alg_sectorPerimArea": sectorPerimArea,
    "alg_trigPoint": trigPoint, "alg_trigGiven": trigGiven, "alg_trigIdentity": trigIdentity, "alg_trigRootCount": trigRootCount,
    "alg_trigPeriod": trigPeriod, "alg_trigGraphParam": trigGraphParam, "alg_trigSpecial": trigSpecial, "alg_circumradius": circumradius,
    "alg_survey": survey, "alg_cosLawSide": cosLawSide, "alg_obtuseCount": obtuseCount, "alg_arithTwoTerms": arithTwoTerms,
    "alg_arithSumMax": arithSumMax, "alg_arithFirstExceeds": arithFirstExceeds, "alg_arithGeoMix": arithGeoMix, "alg_sumToTerm": sumToTerm,
    "alg_geoTwoTerms": geoTwoTerms, "alg_geoSumRatio": geoSumRatio, "alg_sigmaSquare": sigmaSquare, "alg_sigmaTelescope": sigmaTelescope,
    "alg_sigmaSubseq": sigmaSubseq, "alg_seriesPattern": seriesPattern, "alg_recAffine": recAffine,
    "alg_collatz": collatz, "alg_recParam": recParam, "alg_seqIntTerms": seqIntTerms,
}
