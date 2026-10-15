"""Independent checks for modules/econ.mjs (exact Fractions, sympy, brute-force enumeration)."""
import math
import re
from fractions import Fraction

import sympy as sp


def fl(x):
    return math.floor(Fraction(x))


def exchange_cross(v):
    # dollars = euros * (won per euro) / (won per dollar), exact
    assert v["won"] == v["n"] * v["e"]
    assert v["e"] > v["d"], "a euro is worth more than a dollar"
    val = Fraction(v["n"]) * Fraction(v["e"]) / Fraction(v["d"])
    assert (val * 100).denominator == 1, "dollar amount has at most 2 decimals"
    return val


def tax_bracket(v):
    # integrate the marginal rate unit by unit (each 1 man-won of income)
    x = v["x1"]
    assert 0 < v["b1"] < v["b2"] and v["r1"] < v["r2"] < v["r3"]
    tot = Fraction(0)
    for u in range(x):
        rate = v["r1"] if u < v["b1"] else (v["r2"] if u < v["b2"] else v["r3"])
        tot += Fraction(rate, 100)
    assert v["s1"] + v["s2"] + v["s3"] == x
    return tot


def compound_fv(v):
    bal = Fraction(v["P"])
    per = Fraction(v["r"], 100 * v["m"])
    for _ in range(v["m"] * v["n"]):
        bal += bal * per          # interest added to the principal each period
    assert v["k"] == v["m"] * v["n"]
    assert Fraction(str(v["rp"])) == Fraction(v["r"], v["m"])
    return fl(bal)


def present_value(v):
    i = Fraction(v["r"], 100)
    pv = Fraction(v["F"]) / (1 + i) ** v["n"]
    # check: growing it back gives F again
    assert pv * (1 + i) ** v["n"] == v["F"]
    return fl(pv)


def annuity_pv(v):
    i = Fraction(v["r"], 100)
    return fl(sum(Fraction(v["A"]) / (1 + i) ** k for k in range(1, v["n"] + 1)))


def tax_equilibrium(v):
    p, q = sp.symbols("p q")
    sol = sp.solve([sp.Eq(p, v["a"] - v["b"] * q), sp.Eq(p - v["t"], v["c"] + v["d"] * q)], [p, q], dict=True)
    assert len(sol) == 1
    s = sol[0]
    assert s[q] == v["qn"] and s[q] > 0 and s[p] > 0, "equilibrium quantity / price"
    # seller's receipt is non-negative
    assert s[p] - v["t"] >= 0
    return s[p]


def equilibrium_table(v):
    p = sp.symbols("p")
    assert v["p1"] != v["p2"] and v["p3"] != v["p4"]
    qd = sp.interpolate([(v["p1"], v["qd1"]), (v["p2"], v["qd2"])], p)
    qs = sp.interpolate([(v["p3"], v["qs1"]), (v["p4"], v["qs2"])], p)
    assert sp.degree(qd, p) == 1 and sp.degree(qs, p) == 1
    assert sp.diff(qd, p) < 0 < sp.diff(qs, p)
    sol = sp.solve(sp.Eq(qd, qs), p)
    assert len(sol) == 1
    pe = sol[0]
    assert pe > 0 and qd.subs(p, pe) > 0
    assert str(sp.diff(qd, p)) == str(v["md"]) and str(sp.diff(qs, p)) == str(v["ns"])
    return pe


def _utility_fn(s):
    t = s.replace("^{2}", "**2")
    t = re.sub(r"(?<=[xy)\d])(?=[xy(])", "*", t)
    t = re.sub(r"\*\*2\*", "**2*", t)
    x, y = sp.symbols("x y")
    expr = sp.sympify(t)
    return lambda a, b: expr.subs({x: a, y: b})


def utility_bundle(v):
    U = _utility_fn(v["U"])
    best = None
    count = 0
    # enumerate y first
    for y in range(0, v["I"] // v["b"] + 1):
        rest = v["I"] - v["b"] * y
        if rest % v["a"]:
            continue
        x = rest // v["a"]
        count += 1
        val = U(x, y)
        best = val if best is None else max(best, val)
    assert count >= 1
    return best


def region_lp(v):
    best = None
    arg = []
    for y in range(0, v["M"] // v["b1"] + 1):
        for x in range(0, v["M"] // v["a1"] + 1):
            if v["a1"] * x + v["b1"] * y <= v["M"] and v["t1"] * x + v["t2"] * y <= v["T"]:
                val = v["pa"] * x + v["pb"] * y
                if best is None or val > best:
                    best, arg = val, [(x, y)]
                elif val == best:
                    arg.append((x, y))
    assert arg == [(v["x0"], v["y0"])], f"optimiser not unique/as stated: {arg}"
    return best


def _mat(s):
    nums = re.findall(r"-?\d+(?:\.\d+)?", s)
    assert len(nums) == 4
    return sp.Matrix(2, 2, [sp.Rational(n) for n in nums])


def leontief(v):
    A = _mat(v["M"])
    I = sp.eye(2)
    assert v["d1"] > 0 and v["d2"] > 0, "final demands must be positive"
    x = (I - A).inv() * sp.Matrix([v["d1"], v["d2"]])
    assert (I - A).det() == sp.Rational(v["D"]), "determinant"
    assert all(e > 0 for e in x), "outputs must be positive"
    assert (x - A * x) == sp.Matrix([v["d1"], v["d2"]])
    return x[0]


def inverse_entry(v):
    A = _mat(v["M"])
    assert A.det() != 0 and A.det() == v["det"]
    inv = A.inv()
    return inv[v["i"] - 1, v["j"] - 1]


def marginal_revenue(v):
    q = sp.symbols("q")
    R = (v["a"] - v["b"] * q) * q
    sol = sp.solve(sp.Eq(sp.diff(R, q), v["m"]), q)
    assert len(sol) == 1 and sol[0] > 0
    assert v["a"] - v["b"] * sol[0] > 0, "price must be positive"
    return sol[0]


def _demand(s):
    t = s.replace("^{2}", "**2")
    t = re.sub(r"(?<=\d)(?=p)", "*", t)
    p = sp.symbols("p", positive=True)
    return sp.sympify(t, locals={"p": p}), p


def elasticity_point(v):
    q, p = _demand(v["D"])
    p0 = v["p0"]
    qv = q.subs(p, p0)
    assert qv > 0
    e = abs(sp.diff(q, p) * p / q).subs(p, p0)
    assert qv == v["qv"] and sp.diff(q, p).subs(p, p0) == -v["adq"]
    return sp.nsimplify(e)


def elasticity_unit(v):
    q, p = _demand(v["D"])
    # q > 0 region: |q' p / q| = 1  <=>  -q' p = q   (q' < 0 there)
    sols = [s for s in sp.solve(sp.Eq(-sp.diff(q, p) * p, q), p) if s.is_real and s > 0]
    assert len(sols) == 1, sols
    s = sols[0]
    assert q.subs(p, s) > 0 and sp.diff(q, p).subs(p, s) < 0
    assert abs(sp.diff(q, p).subs(p, s) * s / q.subs(p, s)) == 1
    return s


def profit_cubic(v):
    q = sp.symbols("q", real=True)
    C = q**3 - v["b"] * q**2 + v["c"] * q + v["f"]
    pi = v["p"] * q - C
    # marginal cost C'(q) = 3q^2 - 2bq + c must be positive for every q (discriminant < 0), so total cost really rises with output
    mc = sp.diff(C, q)
    assert sp.discriminant(mc, q) < 0 and mc.subs(q, 0) > 0, "marginal cost must be positive"
    crit = [s for s in sp.solve(sp.diff(pi, q), q) if s.is_real and s >= 0]
    assert crit and sp.degree(pi, q) == 3 and pi.coeff(q, 3) < 0   # -> -infinity, so a global max exists on q >= 0
    cands = crit + [0]
    vals = [pi.subs(q, s) for s in cands]
    best = max(vals)
    assert sum(1 for s in crit if pi.subs(q, s) == best) == 1
    assert best > 0
    # the maximiser q0 is the only positive critical point
    assert [s for s in crit if s > 0] == [v["q0"]]
    return best


VERIFY = {
    "econ_exchangeCross": exchange_cross,
    "econ_taxBracket": tax_bracket,
    "econ_compoundFV": compound_fv,
    "econ_presentValue": present_value,
    "econ_annuityPV": annuity_pv,
    "econ_taxEquilibrium": tax_equilibrium,
    "econ_equilibriumTable": equilibrium_table,
    "econ_utilityBundle": utility_bundle,
    "econ_regionLP": region_lp,
    "econ_leontief": leontief,
    "econ_inverseEntry": inverse_entry,
    "econ_marginalRevenue": marginal_revenue,
    "econ_elasticityPoint": elasticity_point,
    "econ_elasticityUnit": elasticity_unit,
    "econ_profitCubic": profit_cubic,
}


def _check_dollars(mod):
    """Static check of the rendered text: every prompt / hint / explanation string (ko and en) has balanced math delimiters."""
    import os, re as _re
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modules", mod + ".mjs"), encoding="utf8").read()
    for line in src.splitlines():
        if _re.match(r"\s+(ko|en): \[", line):
            for s in _re.findall(r'"((?:[^"\\]|\\.)*)"', line):
                assert s.count("$") % 2 == 0, f"{mod}: odd number of $ in: {s[:80]}"


_check_dollars("econ")
