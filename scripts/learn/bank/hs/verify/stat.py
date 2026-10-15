"""Independent checks for modules/stat.mjs (statistics module / sympy / Fraction / brute force; no port of the JS code)."""
import re, statistics
from fractions import Fraction
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

TR = standard_transformations + (implicit_multiplication_application,)

def ints(s):
    return [int(x) for x in re.findall(r"-?\d+", s)]

def D(s):
    return Fraction(s)               # exact decimal string

def quartile(v):
    data = ints(v["data"]); n = len(data)
    s = sorted(data)
    assert s == ints(v["sorted"])
    h = n // 2
    # median of a block of h consecutive sorted values via its two middle positions
    q1 = Fraction(s[(h - 1) // 2] + s[h // 2], 2)
    q3 = Fraction(s[n - h + (h - 1) // 2] + s[n - h + h // 2], 2)
    # cross-check with the statistics module on explicit halves
    lower = s[: n // 2]; upper = s[(n + 1) // 2:]
    assert q1 == Fraction(statistics.median(lower)) and q3 == Fraction(statistics.median(upper))
    assert (q1, q3) == (D(v["q1"]), D(v["q3"]))
    assert q3 - q1 > 0
    return q3 - q1

def sdfreq(v):
    xs, fs = ints(v["xs"]), ints(v["fs"])
    assert len(xs) == len(fs) and len(set(xs)) == len(xs) and all(f > 0 for f in fs)
    data = [Fraction(x) for x, f in zip(xs, fs) for _ in range(f)]
    assert len(data) == v["tot"]
    var = statistics.pvariance(data)
    assert var == D(v["var"]) and statistics.mean(data) == D(v["mean"])
    sd = sp.sqrt(sp.Rational(var.numerator, var.denominator))
    assert sd.is_Rational, "sd must be rational"
    return sd

def lintr(v):
    x = sp.Symbol("x")
    f = parse_expr(v["eq"].replace("^", "**"), local_dict={"x": x}, transformations=TR)
    m, vx = sp.Integer(v["m"]), sp.Integer(v["vx"])
    pts = [m - sp.sqrt(vx), m + sp.sqrt(vx)]                     # a two-value data set with this mean and (population) variance
    ys = [f.subs(x, p) for p in pts]
    my = sp.simplify((ys[0] + ys[1]) / 2)
    vy = sp.simplify(((ys[0] - my) ** 2 + (ys[1] - my) ** 2) / 2)
    assert (my, vy) == (v["my"], v["vy"])
    return my + vy

ZMAP = {90: Fraction("1.645"), 95: Fraction("1.96"), 99: Fraction("2.58")}

def cimean(v):
    n = v["cnt"]; assert sp.sqrt(n).is_Integer
    z = D(v["z"]); assert ZMAP[v["cl"]] == z
    se = sp.Rational(v["sig"]) / sp.sqrt(n)
    up = sp.Rational(str(v["xbar"])) + sp.Rational(str(z)) * se
    assert up.is_Rational and sp.Rational(v["moe"]) == sp.Rational(str(z)) * se
    return up

TT = {3: "3.182", 8: "2.306", 15: "2.131", 24: "2.064", 35: "2.030", 48: "2.011", 63: "1.998", 99: "1.984"}

def tci(v):
    n, df = v["cnt"], v["df"]
    assert df == n - 1 and TT[df] == v["t0"], "t table value"
    assert sp.sqrt(n).is_Integer and v["sd"] % int(sp.sqrt(n)) == 0
    se = sp.Rational(v["sd"]) / sp.sqrt(n)
    return sp.Rational(str(v["xbar"])) - sp.Rational(v["t0"]) * se

def ciprop(v):
    n, a = v["cnt"], v["ag"]
    assert 0 < a < n and ZMAP[v["cl"]] == D(v["z"])
    p = sp.Rational(a, n)
    sd = sp.sqrt(p * (1 - p) / n)
    assert sd.is_Rational, "standard error must be rational"
    assert sp.Rational(v["sdp"]) == 100 * sd and sp.Rational(v["ph"]) == 100 * p
    lo, up = 100 * (p - sp.Rational(v["z"]) * sd), 100 * (p + sp.Rational(v["z"]) * sd)
    assert 0 < lo and up < 100
    return up

def zstat(v):
    n = v["cnt"]; assert sp.sqrt(n).is_Integer
    z = (sp.Rational(v["xbar"]) - v["mu0"]) / (sp.Rational(v["sig"]) / sp.sqrt(n))
    assert z.is_Rational and sp.Rational(v["se"]) == sp.Rational(v["sig"]) / sp.sqrt(n)
    return z

def rejectn(v):
    d = D(v["xbar"]) - v["mu0"]; crit = D(v["crit"]); sig = v["sig"]
    assert d > 0 and crit > 0
    # brute force on n: Z > crit  <=>  d^2 n > crit^2 sigma^2   (both sides positive)
    hits = [n for n in range(1, 5000) if d * d * n > crit * crit * sig * sig]
    first = hits[0]
    assert hits == list(range(first, 5000)), "rejection region must be an upper interval of n"
    assert first < 4999
    return first

def strat(v):
    sizes = [v["n1"], v["n2"], v["n3"]]
    assert sum(sizes) == v["pop"]
    alloc = [Fraction(v["ns"] * x, v["pop"]) for x in sizes]
    assert all(a.denominator == 1 and a >= 1 for a in alloc), "allocation must be whole numbers"
    assert sum(alloc) == v["ns"]
    return alloc[1]

VERIFY = {"stat_quartileIqr": quartile, "stat_sdFreq": sdfreq, "stat_linTransform": lintr, "stat_ciMean": cimean, "stat_tCiLower": tci,
          "stat_ciProp": ciprop, "stat_zStat": zstat, "stat_rejectN": rejectn, "stat_stratified": strat}
