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

# ---- LaTeX reading helpers (the verifier parses what the STUDENT reads)
def _grp(s, i):
    while s[i] == " ": i += 1
    assert s[i] == "{", f"expected {{ at {i} in {s!r}"
    d = 0
    for j in range(i, len(s)):
        if s[j] == "{": d += 1
        elif s[j] == "}":
            d -= 1
            if d == 0: return s[i + 1:j], j + 1
    raise AssertionError("unbalanced braces in " + s)

def L(s):
    s = str(s)
    for a_, b_ in (("\\left", ""), ("\\right", ""), ("\\cdot", "*"), ("\\times", "*"), ("\\{", "("), ("\\}", ")"), ("\\,", " "), ("\\ ", " ")):
        s = s.replace(a_, b_)
    out, i = "", 0
    while i < len(s):
        if s.startswith("\\frac", i):
            a_, j = _grp(s, i + 5); b_, k_ = _grp(s, j)
            out += "((%s)/(%s))" % (L(a_), L(b_)); i = k_
        elif s.startswith("\\sqrt", i):
            a_, j = _grp(s, i + 5)
            out += "sqrt(%s)" % L(a_); i = j
        else:
            out += s[i]; i += 1
    out = out.replace("{", "(").replace("}", ")")
    return re.sub(r"(?<=[A-Za-z0-9\)])(?=[fg]\()", "*", out)

def frac_parts(s):
    s = s.strip()
    assert s.startswith("\\frac"), s
    a_, j = _grp(s, 5); b_, k_ = _grp(s, j)
    assert s[k_:].strip() == "", "trailing text after fraction: " + s
    return a_, b_

def read_cases(pw):
    body = re.search(r"\\begin\{cases\}(.*)\\end\{cases\}", pw, re.S).group(1)
    rows = []
    for part in body.split("\\\\"):
        part = part.strip()
        if not part: continue
        e_, c_ = part.rsplit("&", 1)
        c_ = c_.strip()
        assert c_[0] == "(" and c_[-1] == ")", c_
        rows.append((e_.strip(), c_[1:-1]))
    return rows

def cond_fn(c_):
    c_ = c_.replace("\\le", "<=").replace("\\ge", ">=").replace("\\ne", "!=")
    c_ = re.sub(r"(?<![<>!=])=(?!=)", "==", c_)
    return lambda z: bool(eval(c_, {"x": z}))

def read_lim(s):
    m = re.match(r"\\lim_\{(\w)\\to\s*([^{}]+?)\}(.*)$", s.strip(), re.S)
    assert m, s
    return {"x": x, "h": h}[m.group(1)], m.group(2), m.group(3)

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
    assert den.subs(x, c_) == 0, "denominator must vanish at c"
    bsol = solve(num.subs(x, c_), b)
    assert len(bsol) == 1
    num2 = num.subs(b, bsol[0])
    lim = limit(num2 / den, x, c_)
    sol = solve(Eq(lim, Lv), a)
    assert len(sol) == 1, "a not unique"
    av = sol[0]; bv = bsol[0].subs(a, av)
    assert limit(num.subs({a: av, b: bv}) / den, x, c_) == Lv
    assert (av, bv) == (v["av"], v["bv"]), "explanation values differ"
    # the limit cannot be finite if the numerator does not vanish at c (so b is forced)
    bad = limit(num.subs(b, bsol[0] + 1) / den, x, c_)
    assert bad.is_finite is not True, "numerator need not vanish"
    return av + bv

@reg
def v_limInfRatio(v):
    N, D = P(v["num"]), P(v["den"])
    lim = limit(N / D, x, oo)
    assert lim.is_finite, "limit must be finite (numerator degree <= denominator degree)"
    # the leading terms printed in the explanation give the same value
    assert limit(P(v["nl"]) / P(v["dl"]), x, oo) == lim
    return lim

@reg
def v_limRadical(v):
    e = P(v["expr"])
    rad = [z for z in sp.preorder_traversal(e) if isinstance(z, sp.Pow) and z.exp == Rational(1, 2)]
    if len(rad) == 2:
        num = sp.expand(rad[0] ** 2 - rad[1] ** 2)
    else:
        assert len(rad) == 1
        num = sp.expand(rad[0] ** 2 - (rad[0] - e) ** 2)       # (A - B)(A + B) with B = A - e
    assert Poly(num, x).degree() == 1, "rationalised numerator is not linear"
    assert Poly(num, x).all_coeffs()[0] == v["nc"], "explanation numerator coefficient differs"
    assert sp.expand(num - P(v["numr"])) == 0
    return limit(e, x, oo)

@reg
def v_limPiecewise(v):
    rows = read_cases(v["pw"])
    assert len(rows) == 3
    (el, cl), (em, cm), (er, cr) = rows
    k_ = int(re.fullmatch(r"x<(-?\d+)", cl).group(1))
    assert cm == "x=%d" % k_ and cr == "x>%d" % k_ and k_ == v["k"]
    FL, FM, FR = P(el), Fraction(int(P(em))), P(er)
    def f(z):
        z = Fraction(z)
        if z < k_: return Fraction(str(FL.subs(x, sp.Rational(z.numerator, z.denominator))))
        if z == k_: return FM
        return Fraction(str(FR.subs(x, sp.Rational(z.numerator, z.denominator))))
    eps = Fraction(1, 10 ** 9)
    def snap(val_):
        rv = round(val_)
        assert abs(val_ - rv) < Fraction(1, 10 ** 5), "limit is not an integer"
        return rv
    assert snap(f(k_ - eps)) == v["lv"] and snap(f(k_ + eps)) == v["rv"], "explanation one-sided values differ"
    assert FM != v["lv"] and FM != v["rv"] and v["lv"] != v["rv"]
    ask = v["ask"].strip().strip("$")
    total, sign = 0, 1
    for tok in re.split(r"(?=\\lim)", ask):
        if not tok: continue
        m_ = re.fullmatch(r"\\lim_\{x\\to\s*(.+?)(?:\^\{([+-])\})?\}f\((.*)\)([+-]?)", tok)
        assert m_, tok
        x0 = Fraction(str(P(m_.group(1))))
        G = P(m_.group(3))
        def val(sd):
            xv = x0 + sd * eps
            return snap(f(Fraction(str(G.subs(x, sp.Rational(xv.numerator, xv.denominator))))))
        if m_.group(2) is None:
            assert val(1) == val(-1), "two sides differ"
            term = val(1)
        else:
            term = val(1 if m_.group(2) == "+" else -1)
        total += sign * term
        sign = -1 if m_.group(4) == "-" else 1
    return total

@reg
def v_contRadical(v):
    rows = read_cases(v["pw"])
    assert len(rows) == 2 and rows[1][0] == "k"
    c_ = v["c"]
    assert rows[0][1] == "x\\ne %d" % c_ and rows[1][1] == "x=%d" % c_
    N, D = frac_parts(rows[0][0])
    Ne, De = P(N), P(D)
    assert sp.expand(Ne - De) != 0, "numerator and denominator are the same expression"
    assert Ne.subs(x, c_) == 0 and De.subs(x, c_) == 0
    # the rationalised form printed in the explanation equals f near c
    R = P(v["rat"])
    for dx in (Rational(1, 100), -Rational(1, 100)):
        z = c_ + dx
        assert abs(float((Ne / De - R).subs(x, z))) < 1e-9, "printed rationalised form differs"
    return limit(Ne / De, x, c_)

@reg
def v_contTwoJoint(v):
    rows = read_cases(v["pw"])
    assert len(rows) == 3
    p1 = int(re.fullmatch(r"x<(-?\d+)", rows[0][1]).group(1))
    m_ = re.fullmatch(r"(-?\d+)\\le x<(-?\d+)", rows[1][1]); assert int(m_.group(1)) == p1
    p2 = int(m_.group(2)); assert p2 > p1 and rows[2][1] == "x\\ge %d" % p2
    g1, g2, g3 = (P(r_[0]) for r_ in rows)
    sol = solve([Eq(g1.subs(x, p1), g2.subs(x, p1)), Eq(g2.subs(x, p2), g3.subs(x, p2))], [a, b], dict=True)
    assert len(sol) == 1 and a in sol[0] and b in sol[0], "unknowns not determined uniquely"
    assert (sol[0][a], sol[0][b]) == (v["av"], v["bv"])
    return sol[0][a] + sol[0][b]

@reg
def v_contProduct(v):
    rows = read_cases(v["pw"])
    vals = [int(r_[0]) for r_ in rows]
    pts = [int(re.search(r"x<(-?\d+)", r_[1]).group(1)) for r_ in rows[:-1]]
    assert rows[-1][1] == "x\\ge %d" % pts[-1] and sorted(pts) == pts and len(set(pts)) == len(pts)
    assert pts == [int(z) for z in re.findall(r"-?\d+", v["ptxt"])], "points named in the explanation differ"
    g = P(v["gd"])
    syms = [sy for sy in (a, b, c) if g.has(sy)]
    eqs = []
    for i, pt in enumerate(pts):
        assert vals[i] != vals[i + 1], "no jump"
        eqs.append(g.subs(x, pt) * (vals[i + 1] - vals[i]))   # right limit minus left limit of f*g at pt
    assert len(syms) == len(pts), "number of unknowns differs from number of conditions"
    sol = solve(eqs, syms, dict=True)
    assert len(sol) == 1 and all(sy in sol[0] for sy in syms)
    gs = g.subs(sol[0])
    assert sp.expand(gs - P(v["gfull"])) == 0, "gfull in the explanation differs"
    return gs.subs(x, v["kq"])

@reg
def v_ivtCount(v):
    f = P(v["fx"]); m_, n_ = v["m"], v["n"]
    assert m_ < n_
    fp = Poly(diff(f, x), x)
    assert not sp.real_roots(fp) and fp.eval(0) > 0, "f must be strictly increasing (f' > 0 everywhere)"
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
    F = P(v["f"]); A = v["a"]
    fn = sp.Lambda(x, F)
    var, pt, rest = read_lim(v["lim"])
    assert var != x or Fraction(str(P(pt))) == A, "limit point differs from a"
    assert diff(F, x).subs(x, A) == v["d1"] and F.subs(x, A) == v["d0"]
    return limit(P(rest, f=fn), var, P(pt))

@reg
def v_limDerivForm(v):
    A, s, tt = v["a"], v["s"], v["t"]
    var, pt, rest = read_lim(v["lim"])
    assert var != x or Fraction(str(P(pt))) == A, "limit point differs from a"
    # two different differentiable stand-ins with the given f(a), f'(a): the limit must not depend on the rest of f
    f1 = sp.Lambda(x, s + tt * (x - A))
    f2 = sp.Lambda(x, s + tt * (x - A) + 3 * (x - A) ** 2 - (x - A) ** 3)
    e = P(rest, f=f1); e2 = P(rest, f=f2)
    if var == h: assert re.search(r"f\(%d[+-]" % A, v["lim"]), "increment point differs from a"
    r1, r2 = limit(e, var, P(pt)), limit(e2, var, P(pt))
    assert r1 == r2, "limit depends on more than f(a), f'(a)"
    return r1

@reg
def v_limCoefPoly(v):
    F = P(v["f"]); Lv = v["L"]
    fn = sp.Lambda(x, F)
    var, pt, rest = read_lim(v["lim"])
    c_ = P(pt)
    Ns, Ds = frac_parts(rest)
    Ne, De = P(Ns, f=fn), P(Ds)
    assert De.subs(x, c_) == 0
    free = [sy for sy in (a, b) if F.has(sy)]
    assert len(free) == 2
    bs = solve(Ne.subs(x, c_), b)
    assert len(bs) == 1
    lim = limit(Ne.subs(b, bs[0]) / De, x, c_)
    asol = solve(Eq(lim, Lv), a)
    assert len(asol) == 1
    av = asol[0]; bv = bs[0].subs(a, av)
    assert limit(Ne.subs({a: av, b: bv}) / De, x, c_) == Lv
    assert (av, bv) == (v["av"], v["bv"]) and Ne.subs({a: av, b: bv}).subs(x, c_) == 0
    # without the vanishing numerator the limit would not be finite
    assert limit(Ne.subs(b, bs[0] + 1) / De, x, c_).is_finite is not True
    # the relation printed in the hint: limit = f'(c) / D'(c)
    rel = diff(F.subs({a: av, b: bv}), x).subs(x, c_) / diff(De, x).subs(x, c_)
    assert rel == Lv, "limit is not f'(c)/D'(c)"
    return F.subs({a: av, b: bv}).subs(x, 1)

@reg
def v_powerFindN(v):
    A, V = v["a"], v["V"]
    hits = []; prev = None
    for nn in range(1, 61):
        F = P(v["f"], n=nn)
        d_ = diff(F, x).subs(x, A)
        assert prev is None or d_ > prev, "f'(a) is not strictly increasing in n"
        prev = d_
        if d_ == V: hits.append(nn)
    assert len(hits) == 1, f"n not unique: {hits}"
    return hits[0]

@reg
def v_prodAbstract(v):
    A, s, tt, u, w = v["a"], v["s"], v["t"], v["u"], v["w"]
    res = []
    for ex_f, ex_g in ((0, 0), (5, -4)):          # two stand-in pairs with the same f(a), f'(a), g(a), g'(a)
        F = sp.Lambda(x, s + tt * (x - A) + ex_f * (x - A) ** 2)
        G = sp.Lambda(x, u + w * (x - A) + ex_g * (x - A) ** 3)
        H = P(v["hx"], f=F, g=G)
        res.append(diff(H, x).subs(x, A))
    assert res[0] == res[1]
    return res[0]

@reg
def v_diffParam(v):
    rows = read_cases(v["pw"])
    assert len(rows) == 2
    c_ = v["c"]
    assert (rows[0][1], rows[1][1]) in (("x<%d" % c_, "x\\ge %d" % c_), ("x\\le %d" % c_, "x>%d" % c_))
    g1, g2 = P(rows[0][0]), P(rows[1][0])
    sol = solve([Eq(g1.subs(x, c_), g2.subs(x, c_)), Eq(diff(g1, x).subs(x, c_), diff(g2, x).subs(x, c_))], [a, b], dict=True)
    assert len(sol) == 1 and a in sol[0] and b in sol[0]
    assert (sol[0][a], sol[0][b]) == (v["av"], v["bv"])
    return sol[0][a] + sol[0][b]

@reg
def v_absNotDiff(v):
    exprs = [P(z) for z in re.findall(r"\|([^|]+)\|", v["fx"])]
    assert 1 <= len(exprs) <= 2 and v["fx"].count("|") == 2 * len(exprs)
    css = [co(e) for e in exprs]
    f = lambda z: sum(abs(hv(cs, z)) for cs in css)
    roots = set(); odd = set(); even_all = set()
    for e in exprs:
        for rr, mu in sp.roots(Poly(e, x)).items():
            assert rr.is_Rational
            q_ = Fraction(int(rr.p), int(rr.q))
            roots.add(q_)
            (odd if mu % 2 == 1 else even_all).add(q_)
    assert all(q_.denominator == 1 for q_ in roots)
    hh = Fraction(1, 10 ** 9); cnt = 0
    for rr in roots:
        dr = (f(rr + hh) - f(rr)) / hh
        dl = (f(rr) - f(rr - hh)) / hh
        if abs(dr - dl) > Fraction(1, 100): cnt += 1
    # the roots named in the explanation
    assert {Fraction(z) for z in re.findall(r"-?\d+", v["oddr"])} == odd
    assert {Fraction(z) for z in re.findall(r"-?\d+", v["evenr"])} == even_all - odd
    assert cnt == len(odd)
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
    ints = [(m_ * (x - z) + f.subs(x, z)).subs(x, 0) for z in xs]
    assert ints[0] != ints[1], "the two tangent lines coincide"
    return sum(ints)

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
    best = max(reach)
    # analytic bound: min over the known points of value + hi * distance; the known points must be compatible
    ks = sorted(known)
    for p_, q_ in zip(ks, ks[1:]):
        assert lo * (q_ - p_) <= known[q_] - known[p_] <= hi * (q_ - p_)
    assert best == min(known[k_] + hi * (b_ - k_) for k_ in ks)
    nearest = max(ks)
    assert (v["na"], v["nm"], v["gap"]) == (nearest, known[nearest], b_ - nearest), "explanation numbers differ"
    return best

# ---------------------------------------------------------------- 02 monotonicity, extrema, optimisation
@reg
def v_monoGiven(v):
    f = P(v["f"]); m_, n_ = v["m"], v["n"]
    sol = solve([diff(f, x).subs(x, m_), diff(f, x).subs(x, n_)], [a, b], dict=True)
    assert len(sol) == 1
    g = f.subs(sol[0])
    fp = diff(g, x)
    assert fp.subs(x, Rational(m_ + n_, 2)) < 0 and fp.subs(x, m_ - 1) > 0 and fp.subs(x, n_ + 1) > 0, "monotone pattern differs"
    assert (sol[0][a], sol[0][b]) == (v["av"], v["bv"])
    mn, mx = closed_ext(g, m_, n_)
    assert (mx, mn) == (g.subs(x, m_), g.subs(x, n_)) == (v["fmv"], v["fnv"])
    return mx - mn

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
    cost = P(v["cost"]); X = v["X"]; price = v["price"]
    assert price > 0, "unit price must be positive"
    cp = Poly(diff(cost, x), x)
    assert cp.all_coeffs()[0] > 0 and sp.discriminant(cp) <= 0, "marginal cost must never be negative"
    assert cost.subs(x, 0) > 0
    Pf = price * x - cost
    cands = [0, X] + [z for z in solve(diff(Pf, x), x) if z.is_real and 0 <= z <= X]
    vals = sorted((Pf.subs(x, z), z) for z in cands)
    assert vals[-1][0] > vals[-2][0], "max not unique"
    assert vals[-1][1] == v["xs"] and Pf.subs(x, 0) == v["p0"] and Pf.subs(x, X) == v["pX"]
    assert diff(Pf, x, 2).subs(x, v["xs"]) < 0, "xs is not a local maximum"
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
    assert ht.subs(t, 0) == v["h0"] > 0 and v["h0"] <= 80, "launch height should be believable"
    rts = [z for z in solve(ht, t) if z.is_real and z > 0]
    assert len(rts) == 1 and rts[0] == v["T"]
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
    g = P(v["g"]); A = v["a"]
    pg = Poly(g, x)
    even = sum(c_ * x ** d_[0] for d_, c_ in pg.terms() if d_[0] % 2 == 0)
    assert even != 0 and sp.expand(even - P(v["evp"])) == 0, "even part named in the explanation differs"
    return integrate(g, (x, -A, A))

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
    F = P(v["f"])
    var, pt, rest = read_lim(v["lim"])
    m_ = re.fullmatch(r"\\frac\{1\}\{([^{}]+)\}\\int_\{(.+?)\}\^\{(.+?)\}f\(t\)\\,dt", rest.strip())
    assert m_, rest
    den, lo, hi = P(m_.group(1)), P(m_.group(2)), P(m_.group(3))
    G = integrate(F.subs(x, t), (t, lo, hi))
    return limit(G / den, var, P(pt))

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
    tot = 0; segs = []
    for lo, hi in zip(pts, pts[1:]):
        seg = integrate(f, (x, lo, hi))
        segs.append(seg)
        tot += abs(seg)       # f has constant sign on each piece, so |integral| equals integral of |f|
    shown = [_fr(P(z)) for z in re.findall(r"\\left\|(.+?)\\right\|", v["parts"])]
    assert shown == [_fr(z) for z in segs], "pieces in the explanation differ"
    assert sorted(int(z) for z in re.findall(r"-?\d+", v["zs"])) == [int(z) for z in sorted(rts)]
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
    assert len(rts) == 2 and (rts[0], rts[1]) == (v["al"], v["be"])
    assert sp.expand(f - g - P(v["dif"])) == 0
    area = abs(integrate(f - g, (x, rts[0], rts[1])))
    assert abs(float(P(v["calc"]) - area)) < 1e-12, "area formula in the explanation differs"
    return area

@reg
def v_areaCubicAxis(v):
    f = P(v["f"])
    rts = sorted(z for z in solve(f, x) if z.is_real)
    assert len(rts) == 3 and rts == [v["r1"], v["r2"], v["r3"]]
    ints = [integrate(f, (x, lo, hi)) for lo, hi in zip(rts, rts[1:])]
    assert ints[0] * ints[1] < 0, "the two lobes must lie on opposite sides of the axis"
    assert (_fr(P(v["i1"])), _fr(P(v["i2"]))) == (_fr(ints[0]), _fr(ints[1]))
    return sum(abs(z) for z in ints)

@reg
def v_areaTangentParabola(v):
    f = P(v["f"]); A = v["a"]
    T = f.subs(x, A) + diff(f, x).subs(x, A) * (x - A)
    assert sp.expand(T - P(v["tl"])) == 0
    d = sp.expand(f - T)
    assert sp.expand(d - P(v["dif"])) == 0
    mid = Rational(A, 2)
    assert d.subs(x, mid) != 0
    lo, hi = sorted([0, A])
    area = abs(integrate(d, (x, lo, hi)))
    assert abs(float(P(v["calc"]) - area)) < 1e-12
    return area

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
    segs = [integrate(vt, (t, lo, hi)) for lo, hi in zip(pts, pts[1:])]
    shown = [_fr(P(z)) for z in re.findall(r"\\left\|(.+?)\\right\|", v["parts"])]
    assert shown == [_fr(z) for z in segs], "pieces in the explanation differ"
    return sum(abs(z) for z in segs)

@reg
def v_returnTime(v):
    vt = P(v["v"]); xt = integrate(vt, (t, 0, t)) if False else integrate(vt.subs(t, x), (x, 0, t))
    rts = sorted(z for z in solve(xt, t) if z.is_real and z > 0)
    return vt.subs(t, rts[0])

@reg
def v_limExistence(v):
    rows = read_cases(v["pw"])
    c_ = v["c"]
    assert rows[0][1] == "x<%d" % c_ and rows[-1][1] == "x>%d" % c_
    if len(rows) == 3: assert rows[1][1] == "x=%d" % c_
    lf, rt = P(rows[0][0]), P(rows[-1][0])
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
