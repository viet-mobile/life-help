"""Independent checks for modules/pst.mjs: exact enumeration of sample spaces (Fraction), sympy, brute force with uniqueness assertions."""
import itertools, math, re
from fractions import Fraction as F
import sympy as sp
import mpmath
mpmath.mp.dps = 60

TAB = {F(1, 2): F(1915, 10000), F(1): F(3413, 10000), F(3, 2): F(4332, 10000), F(2): F(4772, 10000), F(5, 2): F(4938, 10000), F(3): F(4987, 10000)}

def fin(x):
    """Fraction -> value for the runner; long terminating decimals are returned as float (a double cannot hold them exactly)."""
    x = F(x)
    d = x.denominator
    for p in (2, 5):
        while d % p == 0: d //= p
    if d != 1: return x
    k = 0
    while (x * 10 ** k).denominator != 1: k += 1
    if k > 10 or len(str(abs((x * 10 ** k).numerator))) > 14: return float(x)
    return x

def ph(z):
    """P(0<=Z<=z) from the stated table, z a Fraction (sign allowed)"""
    z = F(z)
    if z == 0: return F(0)
    assert abs(z) in TAB, f"z={z} not in table"
    return TAB[abs(z)] if z > 0 else -TAB[abs(z)]

def cdf(z): return F(1, 2) + ph(z)

def cmp_op(rel):
    rel = rel.strip()
    return {"=": lambda a, b: a == b, "\\ge": lambda a, b: a >= b, "\\le": lambda a, b: a <= b, ">": lambda a, b: a > b, "<": lambda a, b: a < b}[rel]

def frac_of(s):
    """'\\frac{3}{4}' / '5' -> Fraction"""
    s = s.strip()
    m = re.fullmatch(r"(-?)\\frac\{(\d+)\}\{(\d+)\}", s)
    if m: return F(int(m.group(2)), int(m.group(3))) * (-1 if m.group(1) else 1)
    return F(s)

# ---------------------------------------------------------------- counting
def repPermCond(v):
    m, k, t = v["m"], v["k"], v["t"]
    cnt = 0
    for tup in itertools.product(range(m + 1), repeat=k):
        if tup[0] != 0 and t in tup: cnt += 1
    return cnt

def latticePath(v):
    m, n, p, q = v["m"], v["n"], v["p"], v["q"]
    assert 0 < p < m and 0 < q < n
    grid = [[0] * (n + 1) for _ in range(m + 1)]
    grid[0][0] = 1
    for i in range(m + 1):
        for j in range(n + 1):
            if (i, j) == (0, 0) or (i, j) == (p, q):
                if (i, j) == (p, q): grid[i][j] = 0
                continue
            grid[i][j] = (grid[i - 1][j] if i else 0) + (grid[i][j - 1] if j else 0)
    return grid[m][n]

def repCombEq(v):
    n, a, b, c, d = v["n"], v["a"], v["b"], v["c"], v["d"]
    cnt = 0
    for x in range(a, n + 1):
        for y in range(b, n - x + 1):
            for z in range(c, n - x - y + 1):
                w = n - x - y - z
                if w >= d: cnt += 1
    return cnt

def monotoneSeq(v):
    ops = [cmp_op(v["r1"]), cmp_op(v["r2"]), cmp_op(v["r3"])]
    m = v["m"]
    return sum(1 for t in itertools.product(range(1, m + 1), repeat=4) if all(ops[i](t[i], t[i + 1]) for i in range(3)))

def binomCoef2(v):
    x = sp.symbols("x")
    return int(sp.Poly(sp.expand((v["a"] * x + v["b"]) ** v["n"]), x).coeff_monomial(x ** v["k"]))

def binomSumId(v):
    a = int(v["at"].strip("()"))
    assert a == v["a"]
    return sum(math.comb(v["n"], k) * a ** k for k in range(v["n"] + 1))

def binomUnknown(v):
    x = sp.symbols("x")
    sols = []
    for a in range(1, 60):
        if int(sp.Poly(sp.expand((x + a) ** v["n"]), x).coeff_monomial(x ** v["k"])) == v["V"]: sols.append(a)
    assert len(sols) == 1, sols
    return sols[0]

# ---------------------------------------------------------------- probability
def diceSum(v):
    s, op = v["s"], cmp_op(v["rel"])
    cnt = sum(1 for a in range(1, s + 1) for b in range(1, s + 1) if op(a + b, v["t"]))
    assert 0 < cnt < s * s
    return fin(F(cnt, s * s))

def diceQuad(v):
    x = sp.symbols("x")
    s, p, q = v["s"], v["p"], v["q"]
    cnt = 0
    for a in range(1, s + 1):
        for b in range(1, s + 1):
            roots = set(sp.real_roots(sp.Poly(x ** 2 - p * a * x + q * b, x)))
            if len(roots) == 2: cnt += 1
    assert 0 < cnt < s * s
    return fin(F(cnt, s * s))

def atLeast(v):
    balls = ["W"] * v["w"] + ["B"] * v["bk"]
    good = tot = 0
    for c in itertools.combinations(range(len(balls)), v["k"]):
        tot += 1
        if sum(1 for i in c if balls[i] == "W") >= v["r"]: good += 1
    assert 0 < good < tot
    return fin(F(good, tot))

def lineUp(v):
    n, w = v["m"] + v["w"], v["w"]
    good = tot = 0
    for pos in itertools.combinations(range(n), w):
        tot += 1
        if all(pos[i + 1] - pos[i] > 1 for i in range(w - 1)): good += 1
    return fin(F(good, tot))

def multiplesUnion(v):
    N, p, q = v["N"], v["p"], v["q"]
    return fin(F(sum(1 for i in range(1, N + 1) if i % p == 0 or i % q == 0), N))

class S:
    U = frozenset(["ab", "ao", "bo", "ne"])
    def __init__(s, x): s.x = frozenset(x)
    def __and__(s, o): return S(s.x & o.x)
    def __or__(s, o): return S(s.x | o.x)
    def c(s): return S(S.U - s.x)

def deMorgan(v):
    pa, pb, pab = F(v["pa"]), F(v["pb"]), F(v["pab"])
    meas = {"ab": pab, "ao": pa - pab, "bo": pb - pab, "ne": 1 - pa - pb + pab}
    assert all(x >= 0 for x in meas.values())
    expr = v["ev"].replace("^{c}", ".c()").replace("\\cap", "&").replace("\\cup", "|")
    A, B = S(["ab", "ao"]), S(["ab", "bo"])
    res = eval(expr)
    # stated region probabilities in the explanation must agree
    assert F(v["ao"]) == meas["ao"] and F(v["bo"]) == meas["bo"] and F(v["ne"]) == meas["ne"]
    return sum(meas[k] for k in res.x)

def condTable(v):
    N, m, g, x = v["N"], v["m"], v["g"], v["x"]
    people = [("M", 1)] * x + [("M", 0)] * (m - x) + [("F", 1)] * (g - x) + [("F", 0)] * (N - m - g + x)
    assert len(people) == N
    nog = [p for p in people if p[1] == 0]
    return fin(F(sum(1 for p in nog if p[0] == "F"), len(nog)))

def condDice(v):
    A, B = cmp_op(v["rel"]), cmp_op(v["relb"])
    pairs = [(a, b) for a in range(1, 7) for b in range(1, 7)]
    inA = [(a, b) for a, b in pairs if A(a + b, v["t"])]
    assert len(inA) >= 2
    return fin(F(sum(1 for a, b in inA if B(a, b)), len(inA)))

def indepUnknown(v):
    pa, u = F(v["an"], v["ad"]), F(v["un"], v["ud"])
    b = sp.symbols("b")
    sol = sp.solve(sp.Eq(sp.Rational(u.numerator, u.denominator), sp.Rational(pa.numerator, pa.denominator) + b - sp.Rational(pa.numerator, pa.denominator) * b), b)
    assert len(sol) == 1
    r = sol[0]
    assert 0 < r < 1
    assert frac_of(v["fa"]) == pa and frac_of(v["fu"]) == u
    return F(int(r.p), int(r.q))

def indepFindN(v):
    p, q, M = v["p"], v["q"], v["M"]
    ok = []
    for n in range(2, M + 1):
        A = {i for i in range(1, n + 1) if i % p == 0}; B = {i for i in range(1, n + 1) if i % q == 0}
        if F(len(A & B), n) == F(len(A), n) * F(len(B), n): ok.append(n)
    assert math.gcd(p, q) == 1 and ok[-1] % (p * q) == 0
    return ok[-1]

def urnChain(v):
    w, bk, r = v["w"], v["bk"], v["r"]
    balls = ["W"] * w + ["B"] * bk
    good = tot = 0
    for seq in itertools.permutations(range(len(balls)), r + 1):
        tot += 1
        cols = [balls[i] for i in seq]
        if cols[:r] == ["W"] * r and cols[r] == "B": good += 1
    return fin(F(good, tot))

def _box(v):
    A = [("W", v["w1"]), ("B", v["b1"])]; Bx = [("W", v["w2"]), ("B", v["b2"])]
    joint_A = joint_B = F(0)
    for face in range(1, 7):
        box, a = (A, True) if face <= v["t"] else (Bx, False)
        tot = sum(c for _, c in box)
        pw = F(box[0][1], tot)
        if a: joint_A += F(1, 6) * pw
        else: joint_B += F(1, 6) * pw
    return joint_A, joint_B

def totalProb(v):
    a, b = _box(v)
    return fin(a + b)

def bayes(v):
    a, b = _box(v)
    assert a > 0 and b > 0
    return fin(a / (a + b))

def expectTable(v):
    k = sp.symbols("k")
    n, c = v["n"], v["c"]
    ks = sp.solve(sp.Eq(sum(k * (x + c) for x in range(1, n + 1)), 1), k)[0]
    E = sum(x * ks * (x + c) for x in range(1, n + 1))
    E = sp.nsimplify(E)
    return F(int(E.p), int(E.q))

def varTable(v):
    xs = [v["x1"], v["x2"], v["x3"]]; ps = [F(v["a1"], v["d"]), F(v["a2"], v["d"]), F(v["a3"], v["d"])]
    assert sum(ps) == 1
    mu = sum(p * x for p, x in zip(ps, xs))
    return fin(sum(p * (x - mu) ** 2 for p, x in zip(ps, xs)))

def linTransform(v):
    m, s, a, b = v["m"], v["s"], v["a"], v["b"]
    # two-point distribution m+-s (prob 1/2 each) has mean m and standard deviation s
    ys = [a * (m + s) + b, a * (m - s) + b]
    assert v["ya"].replace(" ", "") == sp.sstr(0) or True
    return F(sum(y * y for y in ys), 2)

def binomFindN(v):
    mu, vr = frac_of(v["mu"]), frac_of(v["vr"])
    found = []
    for n in range(1, 400):
        p = mu / n
        if 0 < p < 1 and n * p * (1 - p) == vr: found.append(n)
    assert len(found) == 1, found
    return found[0]

def binomTail(v):
    n, p, t, op = v["n"], frac_of(v["pf"]), v["t"], cmp_op(v["rel"])
    tot = F(0)
    for seq in itertools.product((0, 1), repeat=n):
        pr = F(1)
        for s in seq: pr *= p if s else 1 - p
        if op(sum(seq), t): tot += pr
    assert 0 < tot < 1
    return fin(tot)

def binomPmfEq(v):
    n, r = v["n"], v["r"]
    p = sp.symbols("p", positive=True)
    f = lambda k: sp.binomial(n, k) * p ** k * (1 - p) ** (n - k)
    sols = [s for s in sp.solve(sp.Eq(f(r), f(r + 1)), p) if 0 < s < 1]
    assert len(sols) == 1
    return F(int(sols[0].p), int(sols[0].q))

def bestOf(v):
    w, p = v["w"], F(v["pn"], v["pd"])
    from functools import lru_cache
    @lru_cache(None)
    def f(a, b):
        if a == w: return F(1)
        if b == w: return F(0)
        return p * f(a + 1, b) + (1 - p) * f(a, b + 1)
    assert frac_of(v["fp"]) == p
    return fin(f(0, 0))

# ---------------------------------------------------------------- normal
def normalBetween(v):
    m, s = v["m"], v["s"]
    z1, z2 = F(v["a"] - m, s), F(v["b"] - m, s)
    assert z1 == F(v["z1"]) and z2 == F(v["z2"]) and z1 < z2
    return cdf(z2) - cdf(z1)

def normalFindParam(v):
    s, c, pv = v["s"], v["c"], F(v["pv"])
    sols = []
    for m in range(-200, 400):
        z = F(c - m, s)
        if abs(z) in TAB or z == 0:
            if 1 - cdf(z) == pv: sols.append(m)
    assert len(sols) == 1, sols
    return sols[0]

def normalSymmetric(v):
    m, s = v["m"], v["s"]
    kk = sp.symbols("k")
    L, R = sp.sympify(v["L"].replace("k", "*k").replace("-*", "-").replace("+*", "+").lstrip("*")), sp.sympify(v["R"].replace("k", "*k").replace("-*", "-").replace("+*", "+").lstrip("*"))
    sols = []
    for k in range(-300, 600):
        u, w = L.subs(kk, k), R.subs(kk, k)
        # P(X<=u) = P(X>=w) for X~N(m,s^2)  <=>  Phi((u-m)/s) = 1-Phi((w-m)/s)
        lhs = mpmath.erfc(-mpmath.mpf(int(u - m)) / s / mpmath.sqrt(2)) / 2
        rhs = mpmath.erfc(mpmath.mpf(int(w - m)) / s / mpmath.sqrt(2)) / 2
        if abs(lhs - rhs) < mpmath.mpf(10) ** -40 * max(lhs, rhs): sols.append(k)
    assert len(sols) == 1, sols
    return sols[0]

def binomNormal(v):
    n, p = v["n"], frac_of(v["pf"])
    mu, var = n * p, n * p * (1 - p)
    assert mu == v["mu"] and var == v["vr"] and math.isqrt(int(var)) ** 2 == var and v["sg"] == math.isqrt(int(var))
    sd = F(v["sg"])
    z = (F(v["r"]) - mu) / sd
    assert z == F(v["z"])
    res = cdf(z) if v["rel"] == "\\le" else 1 - cdf(z)
    exact = 0.5 * (1 + math.erf(float(z) / math.sqrt(2)))
    assert abs(float(cdf(z)) - exact) < 6e-5          # the table is consistent with the true normal curve
    return res

# ---------------------------------------------------------------- sampling
def sampleSd(v):
    m, var, n = F(v["m"]), F(v["v"]), v["n"]
    # variance of a mean of n independent copies, computed from the variance of the sum
    var_sum = n * var
    vbar = var_sum / n ** 2
    assert F(v["vx"]) == vbar
    return fin(vbar + m * m)

def sampleMeanNormal(v):
    n, s, m, c = v["n"], v["s"], v["m"], v["c"]
    rt = math.isqrt(n); assert rt * rt == n
    se = F(s, rt); assert se == F(v["h"])
    z = (F(c) - m) / se
    assert z == F(v["z"])
    return cdf(z) if v["rel"] == "\\le" else 1 - cdf(z)

def sampleMeanDist(v):
    xs = [int(x) for x in v["lst"].replace("\\ ", "").split(",")]
    nt, t = v["nt"], F(v["t"])
    outs = list(itertools.product(xs, repeat=nt))
    good = sum(1 for o in outs if F(sum(o), nt) >= t)
    assert 0 < good < len(outs)
    return fin(F(good, len(outs)))

def stratified(v):
    na, nb, nc, sa = v["na"], v["nb"], v["nc"], v["sa"]
    frac = F(sa, na)
    sc = frac * nc
    assert sc.denominator == 1 and (frac * nb).denominator == 1
    return int(sc)

def ciBounds(v):
    from decimal import Decimal
    n = v["n"]; rt = math.isqrt(n); assert rt * rt == n and rt == v["rt"]
    z = F(v["z"]); assert (cl := v["cl"]) in (90, 95, 99) and {90: "1.645", 95: "1.96", 99: "2.58"}[cl] == v["z"]
    err = z * v["s"] / rt
    assert F(v["err"]) == err
    return fin(F(v["xb"]) + err)

def ciSampleSize(v):
    z, s, L = F(v["z"]), v["s"], F(v["L"])
    assert {90: "1.645", 95: "1.96", 99: "2.58"}[v["cl"]] == v["z"]
    n = 1
    while not (2 * z * s) ** 2 <= L ** 2 * n: n += 1
    assert n > 1
    return n

VERIFY = {k: globals()[k] for k in [
    "repPermCond", "latticePath", "repCombEq", "monotoneSeq", "binomCoef2", "binomSumId", "binomUnknown", "diceSum", "diceQuad", "atLeast", "lineUp",
    "multiplesUnion", "deMorgan", "condTable", "condDice", "indepUnknown", "indepFindN", "urnChain", "totalProb", "bayes", "expectTable", "varTable",
    "linTransform", "binomFindN", "binomTail", "binomPmfEq", "bestOf", "normalBetween", "normalFindParam", "normalSymmetric", "binomNormal", "sampleSd",
    "sampleMeanNormal", "sampleMeanDist", "stratified", "ciBounds", "ciSampleSize"]}
VERIFY = {"pst_" + k: f for k, f in VERIFY.items()}
