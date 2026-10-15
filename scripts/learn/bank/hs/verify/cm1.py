"""Independent checks for modules/cm1.mjs (공통수학1).

Every function receives the variables of one row, re-derives the answer with sympy / exact Fractions / brute-force enumeration (never the JS formula)
and asserts the preconditions the prompt relies on (uniqueness, existence, domain).
"""
import itertools
import math
import re
from fractions import Fraction

import sympy as sp

x, y, k, t = sp.symbols("x y k t")
AL, BE, W = sp.symbols("al be w")
LOC = {ch: sp.Symbol(ch) for ch in "abcdefghjklmnopqrstuvwxyz"}
LOC.update({"al": AL, "be": BE, "i": sp.I, "N": sp.Symbol("N"), "z": sp.Symbol("z")})


def conv(s):
    """LaTeX-ish string -> python/sympy source (explicit '*' inserted)"""
    s = re.sub(r"\\sqrt\{(\d+)\}", lambda m: str(sp.N(sp.sqrt(int(m.group(1))), 45)), s)
    s = re.sub(r"\^\{(-?\d+)\}", r"^\1", s)
    s = s.replace("\\div", "/").replace("[", "(").replace("]", ")").replace("\\ne0", "")
    s = s.replace("\\left", "").replace("\\right", "").replace("\\cdot", "*").replace("\\times", "*").replace("\\ ", " ")
    s = s.replace("\\alpha", "al").replace("\\beta", "be").replace("\\omega", "w")
    while True:
        n = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"((\1)/(\2))", s)
        if n == s:
            break
        s = n
    s = s.replace("{", "(").replace("}", ")").replace("^", "**")
    toks = re.findall(r"al|be|[A-Za-z]|\d+(?:\.\d+)?|\*\*|\S", s)

    def kind(tok):
        if re.fullmatch(r"\d+(\.\d+)?", tok):
            return "num"
        if tok in ("al", "be") or re.fullmatch(r"[A-Za-z]", tok):
            return "var"
        return {")": "r", "(": "l"}.get(tok, "op")

    out = []
    prev = None
    for tok in toks:
        kd = kind(tok)
        if prev is not None:
            pk = kind(prev)
            if (pk in ("num", "var", "r") and kd in ("var", "l")) or (pk == "r" and kd == "num"):
                out.append("*")
        out.append(tok)
        prev = tok
    return "".join(out)


def P(s):
    return sp.sympify(conv(s), locals=LOC, rational=True)


def ratify(val):
    n = sp.N(val, 70)
    re_, im_ = sp.re(n), sp.im(n)
    assert abs(im_) < 1e-40, f"not real: {val}"
    f = Fraction(str(re_)).limit_denominator(10**8)
    assert abs(sp.Float(str(re_), 70) - sp.Rational(f.numerator, f.denominator)) < 1e-35, f"not rational: {val}"
    return f


def same(a, b, tol=1e-25):
    return abs(sp.N(sp.sympify(a) - sp.sympify(b), 60)) < tol


def seq_bounds(txt):
    """first / last integer of a displayed run 'a, b, c' or 'a, a+1, \\ldots, c' (the run must really be consecutive)"""
    nums = [int(z) for z in re.findall(r"-?\d+", txt)]
    if "\\ldots" in txt:
        assert len(nums) >= 3 and nums[1] == nums[0] + 1, txt
    else:
        assert nums == list(range(nums[0], nums[-1] + 1)), txt
    return nums[0], nums[-1]


def chain(txt, subs, expect):
    """every '='-chain in a displayed working string (segments split at ',\\ ' and '\\Rightarrow') must have equal values, the last one = expect"""
    last = None
    for seg in re.split(r",\\ |\\ \\Rightarrow\\ ", txt):
        parts = [p for p in seg.split("=")]
        vals = []
        for p in parts:
            e = P(p)
            vals.append(sp.sympify(e).subs(subs) if subs else e)
        for a_, b_ in zip(vals, vals[1:]):
            assert same(a_, b_, 1e-20), f"working differs: {seg} -> {vals}"
        last = vals[-1]
    assert same(last, expect, 1e-20), f"working ends in {last}, answer {expect}"


def fr(v):
    v = sp.nsimplify(v) if not isinstance(v, sp.Rational) else v
    assert v.is_Rational, f"not rational: {v}"
    return Fraction(int(v.p), int(v.q))


def split_rel(s):
    m = re.fullmatch(r"(.*?)(\\le|\\ge|<|>)(.*)", s)
    assert m, s
    return P(m.group(1)) - P(m.group(3)), m.group(2)


def holds(val, op):
    return {"<": val < 0, "\\le": val <= 0, ">": val > 0, "\\ge": val >= 0}[op]


def mat_of(tex):
    nums = [int(z) for z in re.findall(r"-?\d+", tex.replace("\\begin{pmatrix}", "").replace("\\end{pmatrix}", ""))]
    rows = tex.count("\\\\") + 1
    cols = len(nums) // rows
    return [nums[i * cols:(i + 1) * cols] for i in range(rows)]


# ---------------------------------------------------------------- polynomials
def poly_prod(v):
    prod = sp.expand(P(v["pa"]) * P(v["pb"]))
    assert sp.expand(P(v["prod"]) - prod) == 0
    return int(sp.Poly(prod, x).coeff_monomial(x ** v["k"]))


def poly_div(v):
    Pp, D = P(v["pp"]), P(v["dv"])
    qq, rr = sp.div(Pp, D, x)
    assert sp.expand(qq - P(v["qq"])) == 0 and sp.expand(rr - P(v["rr"])) == 0
    assert sp.degree(rr, x) < sp.degree(D, x)
    return fr(qq.subs(x, v["t"]) + rr.subs(x, v["t"]))


def rem_unknown(v):
    Pk = P(v["pp"])
    rem = sp.rem(sp.Poly(Pk, x), sp.Poly(P(v["dv"]), x)).as_expr()
    assert sp.expand(rem - P(v["lhs"])) == 0, "lhs text differs from P(t)"
    sol = sp.solve(sp.Eq(rem, v["R"]), k)
    assert len(sol) == 1
    return fr(sol[0])


def rem_quad(v):
    a, b, r1, r2 = v["a"], v["b"], v["r1"], v["r2"]
    # any polynomial with these two remainders is L + (x-a)(x-b)*anything, L the line through (a, r1), (b, r2)
    L = sp.interpolate([(a, r1), (b, r2)], x)
    Pp = sp.expand(L + (x - a) * (x - b) * (x ** 3 - 5 * x + 2))
    assert sp.rem(Pp, x - a, x) == r1 and sp.rem(Pp, x - b, x) == r2
    R = sp.rem(Pp, sp.expand((x - a) * (x - b)), x)
    assert sp.expand(R - P(v["Rx"])) == 0
    return fr(R.subs(x, v["c"]))


def identity(v):
    syms = [LOC[c.strip()] for c in v["consts"].split(",")]
    diff = sp.expand(P(v["lhs"]) - P(v["rhs"]))
    sol = sp.solve(sp.Poly(diff, x).all_coeffs(), syms, dict=True)
    assert len(sol) == 1 and all(s in sol[0] for s in syms)
    return fr(P(v["ask"]).subs(sol[0]))


def sym_eval(v):
    m = re.fullmatch(r"x\+y=(-?\d+),\\ xy=(-?\d+)", v["cond"])
    assert m, v["cond"]
    s_, p_ = int(m.group(1)), int(m.group(2))
    assert s_ * s_ - 4 * p_ >= 0 and v["dd"] == s_ * s_ - 4 * p_, "real x, y must exist (prompt says real numbers)"
    z1, z2 = sp.roots(sp.Poly(t ** 2 - s_ * t + p_, t), multiple=True)
    assert z1.is_real and z2.is_real and sp.expand(z1 + z2 - s_) == 0 and sp.expand(z1 * z2 - p_) == 0
    a1, a2 = ratify(P(v["expr"]).subs({x: z1, y: z2})), ratify(P(v["expr"]).subs({x: z2, y: z1}))
    assert a1 == a2
    chain(v["work"], {x: z1, y: z2}, sp.Rational(a1.numerator, a1.denominator))
    return a1


def sym_inv(v):
    kk = v["k"]
    assert abs(kk) >= 2, "real x with x+1/x=k needs |k|>=2"
    z1, z2 = sp.roots(sp.Poly(t ** 2 - kk * t + 1, t), multiple=True)
    for z in (z1, z2):
        assert z.is_real and sp.simplify(z + 1 / z - kk) == 0
    a1, a2 = ratify(P(v["expr"]).subs(x, z1)), ratify(P(v["expr"]).subs(x, z2))
    assert a1 == a2
    chain(v["work"], {x: z1}, sp.Rational(a1.numerator, a1.denominator))
    return a1


def factor_eval(v):
    val = P(v["expr"])
    assert val.is_Integer
    Nn, Nsym = v["N"], LOC["N"]
    m = re.fullmatch(r"\\frac\{(.*)\}\{(.*)\}", v["expr"])
    num, den = P(m.group(1)), P(m.group(2))
    # the displayed factorisation really is the numerator, and the displayed simplification is the quotient
    numN = sp.expand(num)  # numerator with the number already inserted
    fac = P(v["fac"]).subs(Nsym, Nn)
    assert sp.expand(fac) == numN, "factorisation differs from numerator"
    left, right = v["simp"].split("=")
    assert P(left).subs(Nsym, Nn) == P(right) == val
    assert num / den == val
    return fr(val)


# ---------------------------------------------------------------- complex numbers, quadratic equations
def i_power(v):
    zc = sp.simplify(P(v["z"]))
    assert sp.simplify(zc - P(v["zs"])) == 0, "z does not simplify to the stated value"
    assert sp.expand(zc ** 4) == 1
    e = sp.expand(P(v["expr"]).subs(LOC["z"], zc))
    chain(v["work"], {LOC["z"]: zc}, e)
    return fr(sp.re(e) + sp.im(e))


def i_power_sum(v):
    zc = sp.simplify(P(v["z"]))
    assert sp.simplify(zc - P(v["zs"])) == 0
    n, c = v["n"], v["c"]
    assert v["expr"] == f"{c}\\left(z+z^2+z^3+\\cdots+z^{{{n}}}\\right)"
    s_ = sp.Integer(0)
    pw = sp.Integer(1)
    for _ in range(n):
        pw = sp.expand(pw * zc)
        s_ += pw
    s_ = sp.expand(c * s_)
    assert v["rm"] == n % 4 and v["q4"] == n // 4 and n % 4 != 0
    chain(v["work"], {LOC["z"]: zc}, sp.expand(c * sum(zc ** j for j in range(1, v["rm"] + 1))))
    return fr(sp.re(s_) + sp.im(s_))


def complex_cond(v):
    xr = sp.Symbol("x", real=True)
    z = sp.expand(P(v["zs"]).subs(x, xr))
    re_, im_ = sp.re(z), sp.im(z)
    assert sp.expand(re_ - P(v["re"]).subs(x, xr)) == 0 and sp.expand(im_ - P(v["im"]).subs(x, xr)) == 0
    cands = [c for c in sp.solve(sp.Eq(re_, 0), xr) if c.is_real]
    good = [c for c in cands if sp.simplify(im_.subs(xr, c)) != 0]
    assert len(good) == 1, f"pure-imaginary solutions: {good}"
    # displayed roots and displayed imaginary-part values
    shown = sorted(int(z_) for z_ in re.findall(r"x=(-?\d+)", v["roots"]))
    assert shown == sorted(int(c) for c in cands), (shown, cands)
    items = re.findall(r"(-?\d+)(\\ne0)?\\ \(x=(-?\d+)\)", v["chk"])
    assert len(items) == len(cands)
    for val, ne, x0 in items:
        iv = im_.subs(xr, int(x0))
        assert iv == int(val) and ((iv != 0) == bool(ne)), (v["chk"], iv)
    return fr(good[0])


def discrim_count(v):
    eq = P(v["eq"])
    pl = sp.Poly(eq, x)
    a1, b1, c1 = pl.all_coeffs()
    d4 = sp.expand((b1 / 2) ** 2 - a1 * c1)
    assert sp.expand(P(v["d4"]) - d4) == 0, "displayed D/4 is wrong"
    cnt, good = 0, []
    for kk in range(v["lo"], v["hi"] + 1):
        a, b, c = sp.Poly(eq.subs(k, kk), x).all_coeffs()
        assert a != 0
        if b * b - 4 * a * c < 0:
            cnt += 1
            good.append(kk)
    # displayed solved range of D/4 < 0
    r1, r2 = sorted(sp.solve(d4, k), key=lambda z: float(z))
    left, right = v["kr"].split("<k<", 1)
    if "\\approx" in right:
        right, apx = right.split("\\ \\left(\\approx ")
        lo_, hi_ = re.fullmatch(r"(-?\d+\.\d+)<k<(-?\d+\.\d+)\\right\)", apx).groups()
        assert abs(float(lo_) - float(r1)) < 0.006 and abs(float(hi_) - float(r2)) < 0.006
    assert same(P(left), r1) and same(P(right), r2), v["kr"]
    assert seq_bounds(v["ks"]) == (min(good), max(good)), v["ks"]
    assert len(good) == len(range(min(good), max(good) + 1))
    return cnt


def vieta_expr(v):
    pl = sp.Poly(P(v["eq"]), x)
    a, b, c = pl.all_coeffs()
    r1, r2 = sp.roots(pl, multiple=True)
    e = P(v["expr"])
    val1 = ratify(e.subs({AL: r1, BE: r2}))
    val2 = ratify(e.subs({AL: r2, BE: r1}))
    assert val1 == val2
    # displayed Vieta values and working
    assert same(P(v["sf"]), sp.Rational(-b, a)) and same(P(v["pf"]), sp.Rational(c, a))
    ans = sp.Rational(val1.numerator, val1.denominator)
    assert same(P(v["res"]), ans)
    chain(v["work"], {AL: r1, BE: r2}, ans)
    # the answer is a modest fraction (denominator <= 12); if the prompt offers decimals the builder has verified termination
    assert val1.denominator <= 12, f"denominator {val1.denominator}"
    if "ansf" in v:
        assert Fraction(str(v["ansf"])) == val1, (v["ansf"], val1)
    return val1


def vieta_unknown(v):
    al, be, kk = sp.symbols("al2 be2 kk")
    c = v["c"]
    cond = v["cond"]
    assert sp.expand(P(f"x^2-kx{v['cs']}") - P(f"x^2-kx+({c})")) == 0
    need_real = False
    if cond.startswith("|"):
        m = re.fullmatch(r"\|(.*)\|=(.*)", cond)
        e3 = P(m.group(1)) ** 2 - P(m.group(2)) ** 2
        need_real = True
    else:
        lhs, rhs = cond.split("=")
        e3 = P(lhs) - P(rhs)
    e3 = e3.subs({AL: al, BE: be})
    sols = sp.solve([al + be - kk, al * be - c, e3], [al, be, kk], dict=True)
    ks = set()
    for s in sols:
        kv = sp.simplify(s[kk])
        if sp.im(sp.N(kv, 40)) != 0 or kv <= 0:
            continue
        if need_real and (abs(sp.im(sp.N(s[al], 40))) > 1e-30 or abs(sp.im(sp.N(s[be], 40))) > 1e-30):
            continue
        ks.add(kv)
    assert len(ks) == 1, f"positive k values: {ks}"
    return fr(ks.pop())


def root_sign(v):
    eq, tt = P(v["eq"]), v["t"]
    # displayed D/4 and f(t) as functions of k
    a1, b1, c1 = sp.Poly(eq, x).all_coeffs()
    assert a1 == 1 and sp.expand(P(v["d4"]) - ((b1 / 2) ** 2 - c1)) == 0, "displayed D/4"
    assert sp.expand(P(v["ft"]) - eq.subs(x, tt)) == 0, "displayed f(t)"
    found = []
    for kk in range(-80, 81):
        pl = sp.Poly(eq.subs(k, kk), x)
        a, b, c = pl.all_coeffs()
        assert a == 1
        D = b * b - 4 * a * c
        if D <= 0:
            continue
        lo = (-b - sp.sqrt(D)) / 2
        if bool(lo > tt):
            found.append(kk)
    assert found and min(found) > -75, found
    return min(found)


# ---------------------------------------------------------------- quadratic functions
def parabola_line(v):
    f, g = P(v["f"]), P(v["g"])
    D = sp.discriminant(sp.expand(f - g), x)
    sol = sp.solve(sp.Eq(D, 0), k)
    assert len(sol) == 1
    return fr(sol[0])


def parabola_line_count(v):
    f, g = P(v["f"]), P(v["g"])
    assert sp.expand(P(v["eq2"]) - (f - g)) == 0
    D = sp.discriminant(sp.expand(f - g), x)
    assert sp.expand(P(v["dk"]) - D) == 0, "displayed D"
    good = [kk for kk in range(v["lo"], v["hi"] + 1) if D.subs(k, kk) < 0]
    # cross-check one value per row with an explicit root computation
    for kk in (v["lo"], v["hi"]):
        roots = sp.solve(sp.expand((f - g).subs(k, kk)), x)
        has_real = any(abs(sp.im(sp.N(z, 30))) < 1e-20 for z in roots)
        assert has_real == (D.subs(k, kk) >= 0)
    th = sp.solve(D, k)[0]
    m_ = re.fullmatch(r"k([<>])(.*)", v["kr"])
    assert same(P(m_.group(2)), th)
    # D = -4a*k + const: D<0 exactly on the displayed side
    side = [kk for kk in range(int(th) - 40, int(th) + 41) if (kk < th if m_.group(1) == "<" else kk > th)]
    assert all(D.subs(k, kk) < 0 for kk in side[:6]) and all(D.subs(k, kk) >= 0 for kk in range(int(th) - 40, int(th) + 41) if kk not in side)
    assert seq_bounds(v["ks"]) == (min(good), max(good)) and len(good) == max(good) - min(good) + 1
    return len(good)


def parabola_xaxis(v):
    f = P(v["f"])
    pl = sp.Poly(f, x)
    a = pl.coeff_monomial(x ** 2)
    D = sp.discriminant(f, x)
    sol = sp.solve(sp.Eq(D, (a * v["d"]) ** 2), k)
    assert len(sol) == 1
    kv = sol[0]
    assert D.subs(k, kv) > 0
    r1, r2 = sp.solve(f.subs(k, kv), x)
    assert sp.simplify(abs(r1 - r2) - v["d"]) == 0
    return fr(kv)


def quad_range(v):
    pl = sp.Poly(P(v["f"]), x)
    a, b, c = (Fraction(int(z)) for z in pl.all_coeffs())
    lo, hi = v["m"], v["n"]
    f_ = lambda z: a * z * z + b * z + c
    assert f_(Fraction(lo)) == v["fm"] and f_(Fraction(hi)) == v["fn"], "displayed end values"
    pts = [Fraction(lo) + Fraction(j, 12) for j in range((hi - lo) * 12 + 1)]
    pts.append(-b / (2 * a)) if lo <= -b / (2 * a) <= hi else None
    vals = [f_(z) for z in pts]
    assert a * Fraction(v["h"]) ** 2 + b * Fraction(v["h"]) + c == v["kv"]
    assert -b / (2 * a) == v["h"], "displayed vertex"
    return max(vals) + min(vals)


def quad_revenue(v):
    best, arg = None, []
    for tt in range(0, v["b"] // v["c"] + 1):
        pr = (v["a"] - v["w"] + v["s"] * tt) * (v["b"] - v["c"] * tt)
        if best is None or pr > best:
            best, arg = pr, [tt]
        elif pr == best:
            arg.append(tt)
    assert len(arg) == 1 and arg[0] == v["tstar"], arg
    assert v["a"] - v["w"] == v["e1"]
    return best


def quad_fence(v):
    # independent geometric model: rectangle with depth d (perpendicular to the wall) and width w (along the wall);
    # perpendicular fence lines are the two ends plus j equally spaced partitions; fencing = w + (#lines) * d = L
    j, L = v["j"], v["L"]
    best, arg = None, []
    for i in range(1, 8 * L):
        d = Fraction(i, 8)
        lines = [Fraction(0)] + [Fraction(m_ + 1, j + 1) for m_ in range(j)] + [Fraction(1)]   # relative positions along the width
        w = L - len(lines) * d
        if w <= 0:
            break
        area = w * d
        if best is None or area > best:
            best, arg = area, [d]
        elif area == best:
            arg.append(d)
    assert len(arg) == 1, arg
    assert len(lines) == v["k"] and arg[0] == v["u"], (arg, v["u"])
    return best


# ---------------------------------------------------------------- higher-degree equations, systems
def omega(v):
    lhs = v["eq"].split("=")[0]
    roots = sp.solve(P(lhs), x)
    ws = [r for r in roots if sp.im(r) != 0]
    assert len(ws) == 2
    vals = set()
    for w in ws:
        e = P(v["expr"]).subs(W, w) if "n" not in v else None
        if "n" in v:
            n, c = v["n"], v["c"]
            assert v["expr"].startswith(f"{c}\\left[") and v["expr"].endswith(f"\\left(\\omega^{{{n}}}+\\frac{{1}}{{\\omega^{{{n}}}}}\\right)\\right]")
            e = c * sum(w ** j + w ** (-j) for j in range(1, n + 1))
            assert n % v["per"] != 0
        vals.add(ratify(e))
        ve = ratify(e)
        chain(v["step"], {W: w}, sp.Rational(ve.numerator, ve.denominator))
    assert len(vals) == 1
    # displayed relation: w^3 = +-1 holds for the roots
    for w in ws:
        assert sp.simplify(w ** v["per"] - 1) == 0 and sp.simplify(w ** 3 - (1 if v["per"] == 3 else -1)) == 0
    return vals.pop()


def cubic_one_real(v):
    eq = sp.Poly(P(v["eq"]), x)
    rts = sp.roots(eq, multiple=False)
    assert sum(rts.values()) == eq.degree(), "roots not all found exactly"
    real = [r for r in rts if sp.im(sp.N(r, 40)) == 0]
    non = [r for r in rts if sp.im(sp.N(r, 40)) != 0]
    assert all(rts[r] == 1 for r in rts)
    assert len(non) == 2
    S = sum(real)
    T = sp.simplify(non[0] * non[1])
    # displayed factorisation, discriminant, T, S
    assert sp.expand(P(v["fac"]) - P(v["eq"])) == 0
    qd = sp.Poly(P(v["quad"]), x)
    assert qd.discriminant() == v["D"] < 0 and qd.all_coeffs()[-1] == v["q"] == T and v["S"] == S
    assert sp.Poly(P(v["eq"]), x).degree() == 3 + (0 if len(real) == 1 else 1)
    return fr(sp.simplify(S + T))


def sys_two(v):
    eqs = []
    for e in (v["e1"], v["e2"]):
        lhs, rhs = e.split("=")
        eqs.append(P(lhs) - P(rhs))
    sols = sp.solve(eqs, [x, y], dict=True)
    xs = [s[x] for s in sols if abs(sp.im(sp.N(s[x], 40))) < 1e-30 and abs(sp.im(sp.N(s[y], 40))) < 1e-30]
    assert xs
    return fr(max(xs))


def sys_real(v):
    e1, e2 = (z.split("=") for z in (v["e1"], v["e2"]))
    cnt = 0
    for kk in range(-v["M"], v["M"] + 1):
        eqs = [P(e1[0]).subs(k, kk) - P(e1[1]).subs(k, kk), P(e2[0]) - P(e2[1])]
        sols = sp.solve(eqs, [x, y], dict=True)
        if any(abs(sp.im(sp.N(s[x], 40))) < 1e-30 and abs(sp.im(sp.N(s[y], 40))) < 1e-30 for s in sols):
            cnt += 1
    return cnt


# ---------------------------------------------------------------- inequalities
def lin_ineq_count(v):
    cons = []
    for key in ("i1", "i2"):
        ex, op = split_rel(v[key])
        pl = sp.Poly(sp.expand(ex), x)
        cons.append((Fraction(int(pl.coeff_monomial(x).p), int(pl.coeff_monomial(x).q)), fr(pl.coeff_monomial(1)), op))
    xs = [z for z in range(-300, 301) if all(holds(A * z + B, op) for A, B, op in cons)]
    assert xs and all(abs(z) < 200 for z in xs), "unbounded or empty"
    assert xs == list(range(xs[0], xs[-1] + 1))
    assert seq_bounds(v["ints"]) == (xs[0], xs[-1]), v["ints"]
    return len(xs)


def lin_ineq_param(v):
    ex1, op1 = split_rel(v["i1"])
    ex2, op2 = split_rel(v["i2"])
    p1 = sp.Poly(sp.expand(ex1), x)
    A1, B1 = int(p1.coeff_monomial(x)), int(p1.coeff_monomial(1))
    p2 = sp.Poly(sp.expand(ex2), x, k)
    A2, K2, B2 = int(p2.coeff_monomial(x)), int(p2.coeff_monomial(k)), int(p2.coeff_monomial(1))
    good = []
    for kk in range(-200, 201):
        cnt = sum(1 for z in range(-400, 401) if holds(A1 * z + B1, op1) and holds(A2 * z + K2 * kk + B2, op2))
        if cnt == v["n"]:
            good.append(kk)
    assert good and good == list(range(good[0], good[-1] + 1)) and good[0] > -150 and good[-1] < 150
    return sum(good)


def abs_ineq_count(v):
    m = re.fullmatch(r"(\d*)\|([^|]*)\|([+-]\d+)?(<|\\le)\s*(-?\d+)", v["expr"])
    assert m, v["expr"]
    mm = int(m.group(1)) if m.group(1) else 1
    inner = sp.lambdify(x, P(m.group(2)), "math")
    d = int(m.group(3)) if m.group(3) else 0
    c = int(m.group(5))
    op = m.group(4)
    xs = [z for z in range(-400, 401) if holds(mm * abs(inner(z)) + d - c, op)]
    assert xs and xs == list(range(xs[0], xs[-1] + 1)) and abs(xs[0]) < 300 and abs(xs[-1]) < 300
    assert seq_bounds(v["ints"]) == (xs[0], xs[-1]), v["ints"]
    return len(xs)


def abs_ineq_rep(v):
    m = int(v["mx"][:-1]) if len(v["mx"]) > 1 else 1
    lo, hi = P(v["lo"]), P(v["hi"])
    a, c = sp.symbols("a c")
    sol = sp.solve([(a - c) / m - lo, (a + c) / m - hi], [a, c], dict=True)
    assert len(sol) == 1
    av, cv = sol[0][a], sol[0][c]
    assert cv > 0
    rel = sp.Abs(m * x - av) < cv if v["op"].strip() == "<" else sp.Abs(m * x - av) <= cv
    S = sp.solve_univariate_inequality(rel, x, relational=False)
    want = sp.Interval.open(lo, hi) if v["op"].strip() == "<" else sp.Interval(lo, hi)
    assert S == want
    assert av.is_Integer and cv.is_Integer
    return fr(av + cv)


def quad_ineq_sol(v):
    pq = sp.Poly(P(v["mx2"]), x)
    mm = pq.coeff_monomial(x ** 2)
    mo = re.fullmatch(r"(.*?)(\\le|<)\s*x(\\le|<)\s*(.*)", v["sol"])
    lo, hi = P(mo.group(1)), P(mo.group(4))
    a, b = sp.symbols("a b")
    sol = sp.solve([mm * lo ** 2 + a * lo + b, mm * hi ** 2 + a * hi + b], [a, b], dict=True)
    assert len(sol) == 1
    av, bv = sol[0][a], sol[0][b]
    ex = mm * x ** 2 + av * x + bv
    rel = {"<": ex < 0, "\\le": ex <= 0, ">": ex > 0, "\\ge": ex >= 0}[v["op"].strip()]
    S = sp.solve_univariate_inequality(rel, x, relational=False)
    want = sp.Interval.open(lo, hi) if mo.group(2) == "<" else sp.Interval(lo, hi)
    assert S == want, f"{S} != {want}"
    assert sp.expand(P(v["full"]) - ex) == 0, "displayed expansion"
    assert (v["a"], v["b"]) == (av, bv)
    return fr(P(v["ask"]).subs({LOC["a"]: av, LOC["b"]: bv}))


def quad_ineq_always(v):
    ex, op = split_rel(v["ineq"])
    strict = op == ">"
    good = []
    for kk in range(-60, 61):
        e = sp.expand(ex.subs(k, kk))
        pl = sp.Poly(e, x)
        if pl.degree() <= 0:
            c = pl.coeff_monomial(1)
            ok = c > 0 if strict else c >= 0
        elif pl.degree() == 1:
            ok = False
        else:
            bad = sp.solveset(e <= 0 if strict else e < 0, x, sp.S.Reals)
            ok = bad == sp.S.EmptySet
        if ok:
            good.append(kk)
    assert good and good == list(range(good[0], good[-1] + 1)) and good[0] > -55 and good[-1] < 55
    pk = sp.Poly(ex, x, k)
    m_, n_ = pk.coeff_monomial(x * k) / 2, pk.coeff_monomial(1)
    assert pk.coeff_monomial(x ** 2 * k) == 1 and n_ == v["n"] > 0
    assert sp.expand(P(v["d4"]) - (m_ ** 2 * k ** 2 - n_ * k)) == 0, "displayed D/4"
    mo = re.fullmatch(r"0<k(<|\\le )(.*)", v["kr"])
    assert (mo.group(1) == "<") == strict and mo.group(1).strip() == v["rel"].strip()
    assert same(P(mo.group(2)), sp.Rational(n_) / m_ ** 2)
    assert seq_bounds(v["ks"]) == (0, good[-1])
    return len(good)


# ---------------------------------------------------------------- counting
def divisor_count(v):
    N = int(P(v["fac"]))
    m = v["m"]
    assert N % m == 0
    return sum(1 for d in range(1, N + 1) if N % d == 0 and d % m == 0)


def coloring(v):
    edges = [tuple(int(z) - 1 for z in e) for e in re.findall(r"\((\d+),(\d+)\)", v["edges"])]
    n, kk = v["n"], v["k"]
    assert all(0 <= a < n and 0 <= b < n for a, b in edges)
    return sum(1 for col in itertools.product(range(kk), repeat=n) if all(col[a] != col[b] for a, b in edges))


def perm_arrange(v):
    m, w = v["m"], v["w"]
    n = m + w
    cnt = 0
    for perm in itertools.permutations(range(n)):
        girls = [i for i, p in enumerate(perm) if p >= m]
        if all(girls[j + 1] - girls[j] > 1 for j in range(len(girls) - 1)):
            cnt += 1
    return cnt


def perm_numbers(v):
    D = [int(z) for z in v["digs"].split(",")]
    assert len(D) == v["nc"] and len(set(D)) == len(D)
    cnt = 0
    for tup in itertools.permutations(D, v["r"]):
        if tup[0] == 0:
            continue
        num = int("".join(map(str, tup)))
        if num % v["m"] == 0:
            cnt += 1
    return cnt


def comb_committee(v):
    m, w, r, a = v["m"], v["w"], v["r"], v["a"]
    people = [("B", i) for i in range(m)] + [("G", i) for i in range(w)]
    cnt = 0
    for com in itertools.combinations(people, r):
        if ("B", 0) in com and ("G", 0) not in com and sum(1 for p in com if p[0] == "G") >= a:
            cnt += 1
    return cnt


def grid_paths(v):
    a, b = v["a"], v["b"]
    P_, U = (v["p"], v["q"]), (v["u"], v["v"])
    states = {(0, 0, (0, 0) == P_, (0, 0) == U): 1}
    for step in range(a + b):
        new = {}
        for (px, py, fp, fu), cnt in states.items():
            for dx, dy in ((1, 0), (0, 1)):
                nx, ny = px + dx, py + dy
                if nx > a or ny > b:
                    continue
                key = (nx, ny, fp or (nx, ny) == P_, fu or (nx, ny) == U)
                new[key] = new.get(key, 0) + cnt
        states = new
    return sum(c for (px, py, fp, fu), c in states.items() if (px, py) == (a, b) and fp and not fu)


# ---------------------------------------------------------------- matrices
def mat_cayley(v):
    A = sp.Matrix(mat_of(v["A"]))
    assert mat_of(v["Emat"]) == [[1, 0], [0, 1]]
    An = A ** v["n"]
    assert sp.Matrix(mat_of(v["Apow"])) == An
    p, q = sp.symbols("p q")
    sol = sp.solve(list(An - p * A - q * sp.eye(2)), [p, q], dict=True)
    assert len(sol) == 1 and sol[0][p] == v["p"] and sol[0][q] == v["q"]
    return fr(P(v["ask"]).subs({LOC["p"]: sol[0][p], LOC["q"]: sol[0][q]}))


def mat_word(v):
    Pm, Qm = sp.Matrix(mat_of(v["mp"])), sp.Matrix(mat_of(v["mq"]))
    assert Pm.shape == (2, v["ni"]) and Qm.shape == (v["ni"], 2)
    PQ = Pm * Qm
    assert sp.Matrix(mat_of(v["pq"])) == PQ
    tot = 0
    for j in range(2):
        a, b = PQ[0, j], PQ[1, j]
        assert a != b
        tot += min(a, b)
    return fr(tot)


VERIFY = {
    "cm1_polyProdCoef": poly_prod,
    "cm1_polyDivQR": poly_div,
    "cm1_remUnknown": rem_unknown,
    "cm1_remQuadDiv": rem_quad,
    "cm1_identity": identity,
    "cm1_symmetricEval": sym_eval,
    "cm1_symmetricInv": sym_inv,
    "cm1_factorEval": factor_eval,
    "cm1_iPower": i_power,
    "cm1_iPowerSum": i_power_sum,
    "cm1_complexCond": complex_cond,
    "cm1_discrimCount": discrim_count,
    "cm1_vietaExpr": vieta_expr,
    "cm1_vietaUnknown": vieta_unknown,
    "cm1_rootSignCond": root_sign,
    "cm1_parabolaLine": parabola_line,
    "cm1_parabolaLineCount": parabola_line_count,
    "cm1_parabolaXaxis": parabola_xaxis,
    "cm1_quadRange": quad_range,
    "cm1_quadRevenue": quad_revenue,
    "cm1_quadFence": quad_fence,
    "cm1_omega": omega,
    "cm1_cubicOneReal": cubic_one_real,
    "cm1_sysTwo": sys_two,
    "cm1_sysReal": sys_real,
    "cm1_linIneqCount": lin_ineq_count,
    "cm1_linIneqParam": lin_ineq_param,
    "cm1_absIneqCount": abs_ineq_count,
    "cm1_absIneqRep": abs_ineq_rep,
    "cm1_quadIneqSol": quad_ineq_sol,
    "cm1_quadIneqAlways": quad_ineq_always,
    "cm1_divisorCount": divisor_count,
    "cm1_coloring": coloring,
    "cm1_permArrange": perm_arrange,
    "cm1_permNumbers": perm_numbers,
    "cm1_combCommittee": comb_committee,
    "cm1_gridPaths": grid_paths,
    "cm1_matCayley": mat_cayley,
    "cm1_matWord": mat_word,
}
