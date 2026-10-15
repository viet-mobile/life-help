"""Independent checks for modules/bm.mjs (sympy / exact Fractions / brute force; nothing is ported from the JS generators)."""
import itertools
import re
from fractions import Fraction

import sympy as sp
from sympy.parsing.sympy_parser import (convert_xor, implicit_multiplication_application, parse_expr,
                                        standard_transformations)

TR = standard_transformations + (implicit_multiplication_application, convert_xor)
x, y, k, m = sp.symbols("x y k m")
LOC = {"x": x, "y": y, "k": k, "m": m}


def P(s):
    return parse_expr(s, local_dict=LOC, transformations=TR)


REL = r"(\\le|\\ge|<|>)"


def holds(a, rel, b):
    return {"<": a < b, ">": a > b, "\\le": a <= b, "\\ge": a >= b}[rel]


def split_rel(s):
    mm = re.fullmatch(r"(.+?)" + REL + r"(.+)", s)
    assert mm, s
    return mm.group(1), mm.group(2), mm.group(3)


def ineq_system(v):
    fs = []
    for key in ("i1", "i2"):
        l, rel, r = split_rel(v[key])
        fs.append((P(l), rel, P(r)))
    sols = [t for t in range(-400, 401)
            if all(holds(Fraction(int(l.subs(x, t))), rel, Fraction(int(r.subs(x, t)))) for l, rel, r in fs)]
    assert sols and max(abs(t) for t in sols) < 100, "solution set unbounded or empty"
    assert 2 <= len(sols) <= 9
    # the listed integers of the explanation
    assert [int(t) for t in v["ints"].split(",")] == sols
    return len(sols)


def abs_ineq(v):
    mm = re.fullmatch(r"\|(.+)\|" + REL + r"(\d+)", v["ineq"])
    assert mm, v["ineq"]
    e = P(mm.group(1)); rel = mm.group(2); c = int(mm.group(3))
    N = v["N"]
    # sympy: solve the inequality over the reals and count integers of [-N, N] in the resulting set
    S = {"<": sp.Lt, ">": sp.Gt, "\\le": sp.Le, "\\ge": sp.Ge}[rel](sp.Abs(e), c)
    sol = sp.solve_univariate_inequality(S, x, relational=False)
    cnt = sum(1 for t in range(-N, N + 1) if sol.contains(t) == sp.true)
    cnt2 = sum(1 for t in range(-N, N + 1) if holds(abs(int(e.subs(x, t))), rel, c))
    assert cnt == cnt2
    return cnt


def quad_range(v):
    f = P(v["f"])
    s, t = v["s"], v["t"]
    assert s < t
    from sympy.calculus.util import function_range
    rng = function_range(f, x, sp.Interval(s, t))
    a = sp.Poly(f, x).all_coeffs()[0]
    # grid check (vertex and endpoints are multiples of 1/(2a))
    step = Fraction(1, 2 * abs(int(a)))
    vals = []
    p = Fraction(s)
    while p <= t:
        vals.append(Fraction(int(sp.Rational(f.subs(x, sp.Rational(p.numerator, p.denominator)).p)),
                             int(sp.Rational(f.subs(x, sp.Rational(p.numerator, p.denominator)).q))))
        p += step
    assert rng.sup == max(vals) and rng.inf == min(vals)
    assert v["M"] == rng.sup and v["m"] == rng.inf
    # vertex strictly inside, as the explanation says
    xv = sp.solve(sp.diff(f, x), x)[0]
    assert s < xv < t
    return rng.sup + rng.inf


def disc_k(v):
    f = P(v["f"])
    N = v["N"]
    cnt = 0
    for kv in range(-N, N + 1):
        g = f.subs(k, kv)
        roots = sp.solveset(g, x, sp.Reals)
        if len(roots) == 2:
            cnt += 1
    return cnt


def poly_factor(v):
    e = sp.Poly(P(v["Pex"]), x)
    A, B, C = e.all_coeffs() if e.degree() == 2 else (None, None, None)
    assert A is not None
    assert sp.gcd(sp.gcd(A, B), C) == 1
    found = []
    for a in range(1, 13):
        for c in range(a, 13):
            if a * c != A:
                continue
            for b in range(-40, 41):
                for d in range(-40, 41):
                    if a == c and b > d:
                        continue
                    if a * d + b * c == B and b * d == C:
                        found.append((a, b, c, d))
    assert len(found) == 1, found
    a, b, c, d = found[0]
    assert sp.expand((a * x + b) * (c * x + d) - e.as_expr()) == 0
    assert sp.factor(e.as_expr()).equals(e.as_expr())
    return a + b + c + d


def poly_expand(v):
    e = sp.Poly(sp.expand(P(v["expr"])), x)
    assert sp.expand(P(v["total"]) - e.as_expr()) == 0
    return e.coeff_monomial(x ** 2) + e.coeff_monomial(1)


def quad_roots(v):
    l, r = v["eq"].split("=")
    sol = sp.solveset(sp.Eq(P(l), P(r)), x, sp.Reals)
    assert len(sol) == 2, sol
    lo, hi = sorted(sol)
    assert lo == v["al"] and hi == v["be"]
    return hi - 2 * lo


def count_digits(v):
    ds = [int(t) for t in v["ds"].split(",")]
    kk = 3  # the prompt fixes: choose 3 cards, three-digit number
    assert len(set(ds)) == len(ds)
    nums = {int("".join(map(str, p))) for p in itertools.permutations(ds, kk) if p[0] != 0}
    assert all(len(str(n)) == kk for n in nums)
    ev = [n for n in nums if n % 2 == 0]
    assert v["z"] == sum(1 for n in ev if n % 10 == 0) and v["o"] == sum(1 for n in ev if n % 10 != 0)
    assert 0 in ds and v["n"] == len(ds)
    return len(ev)


def parse_mat(s):
    body = re.search(r"pmatrix\}(.*)\\end", s, re.S).group(1)
    return sp.Matrix([[P(c) for c in row.split("&")] for row in body.split("\\\\")])


def mat_unknown(v):
    A, B, C = parse_mat(v["A"]), parse_mat(v["B"]), parse_mat(v["C"])
    ex = re.sub(r"(\d)([AB])", r"\1*\2", v["ex"])
    E = eval(ex, {"A": A, "B": B})
    sol = sp.solve(list(E - C), [x, y], dict=True)
    assert len(sol) == 1 and set(sol[0]) == {x, y}, sol
    return sol[0][x] + sol[0][y]


def line_par_perp(v):
    l, _ = v["L"].split("=")
    e = P(l)
    a, b = e.coeff(x), e.coeff(y)
    c = e.subs({x: 0, y: 0})
    x0, y0 = v["x0"], v["y0"]
    assert e.subs({x: x0, y: y0}) != 0
    pts = []
    for xv in (0, 1):
        yv = sp.solve(e.subs(x, xv), y)[0]
        pts.append(sp.Point(xv, yv))
    L = sp.Line(*pts)
    Pp = sp.Point(x0, y0)
    yaxis = sp.Line(sp.Point(0, 0), sp.Point(0, 1))
    s = L.parallel_line(Pp).intersection(yaxis)[0].y
    t = L.perpendicular_line(Pp).intersection(yaxis)[0].y
    assert s == v["s"] and t == v["t"]
    return s + t


def circle_line(v):
    # circle x^2 + y^2 = N, line y = p x + m  or  p x + y = m  (parsed from the printed strings)
    l, r = v["circ"].split("=")
    ce = sp.expand(P(l.replace("{", "(").replace("}", ")")) - int(r))
    pc = sp.Poly(ce, x, y)
    assert pc.coeff_monomial(x) == 0 and pc.coeff_monomial(y) == 0 and pc.coeff_monomial(x ** 2) == 1 and pc.coeff_monomial(y ** 2) == 1
    r2 = -pc.coeff_monomial(1)
    assert r2 > 0
    lhs, rhs = v["line"].split("=")
    le = P(lhs) - P(rhs)                      # linear in x, y, m
    a, b, mc = le.coeff(x), le.coeff(y), le.coeff(m)
    assert le.subs({x: 0, y: 0, m: 0}) == 0 and b != 0 and a != 0 and mc != 0
    good = []
    for mv in range(-300, 301):
        # exact squared distance from the centre (0,0) to the line  a x + b y + mc*m = 0, compared with r^2
        if (mc * mv) ** 2 < r2 * (a * a + b * b):
            good.append(mv)
    assert good and good == list(range(good[0], good[-1] + 1)) and abs(good[0]) < 290
    # sympy geometry at the boundary: number of intersection points is 2 inside, <2 outside
    circle = sp.Circle(sp.Point(0, 0), sp.sqrt(r2))
    for mv in (good[0] - 1, good[0], good[-1], good[-1] + 1):
        ln_e = le.subs(m, mv)
        p1 = sp.Point(0, sp.solve(ln_e.subs(x, 0), y)[0]); p2 = sp.Point(1, sp.solve(ln_e.subs(x, 1), y)[0])
        n_int = len(circle.intersection(sp.Line(p1, p2)))
        assert (n_int == 2) == (mv in good), (mv, n_int)
    # explanation columns: B = (1+p^2) N and the symmetric range
    assert v["hi"] == good[-1] and -v["hi"] == good[0]
    assert v["cond"] == "m^{2}<%d" % ((a * a + b * b) * r2 // (mc * mc))
    return len(good)


def transform(v):
    pt = sp.Point(v["a"], v["b"]).translate(v["p"], v["q"])
    xaxis = sp.Line(sp.Point(0, 0), sp.Point(1, 0))
    diag = sp.Line(sp.Point(0, 0), sp.Point(1, 1))
    R = pt.reflect(xaxis)
    S = R.reflect(diag)
    assert (v["m"], v["n"]) == (S.x, S.y)
    return 2 * S.x + S.y


def set_ops(v):
    n, a, b = v["n"], v["a"], v["b"]
    U = set(range(1, n + 1))
    A = {t for t in U if a % t == 0}
    B = {t for t in U if t % b == 0}
    R = A & (U - B)
    assert R and sorted(R) == [int(t) for t in v["Rs"].split(",")]
    return sum(R)


def prop_range(v):
    mm = re.fullmatch(r"\|(.+)\|" + REL + r"(\d+)", v["pc"])
    e = P(mm.group(1)); rel = mm.group(2); t = int(mm.group(3))
    n = v["n"]
    step = Fraction(1, 60)
    pts = []
    q = Fraction(-40)
    while q <= 40:
        if holds(abs(e.subs(x, sp.Rational(q.numerator, q.denominator))), rel, t):
            pts.append(q)
        q += step
    assert pts
    good = [mv for mv in range(-39, 40) if all(mv <= pt <= n for pt in pts)]
    assert good, "no integer m works"
    assert pts[0] > -39 and good[-1] < 39
    return good[-1]


def comp_unknown(v):
    f, h = P(v["f"]), P(v["h"])
    u, w = sp.symbols("u w")
    # assume g(y) = u*y + w and match coefficients of g(f(x)) = h(x)
    diff = sp.Poly(sp.expand(u * f + w - h), x).all_coeffs()
    sol = sp.solve(diff, [u, w], dict=True)
    assert len(sol) == 1
    g = sol[0]
    # direct route: x with f(x) = k, then h(x)
    x0 = sp.solve(sp.Eq(f, v["k"]), x)
    assert len(x0) == 1 and x0[0] == v["x0"]
    val = g[u] * v["k"] + g[w]
    assert val == h.subs(x, x0[0])
    return val


def func_count(v):
    mm, n = v["m"], v["n"]
    tot = 0
    for rest in itertools.product(range(1, n + 1), repeat=mm - 1):
        img = (1,) + rest
        tot += 1
        if len(set(img)) == mm:
            tot -= 1
    assert v["tot"] == n ** (mm - 1)
    return tot


VERIFY = {
    "bm_ineqSystem": ineq_system, "bm_absIneq": abs_ineq, "bm_quadRange": quad_range, "bm_discK": disc_k,
    "bm_polyFactor": poly_factor, "bm_polyExpand": poly_expand, "bm_quadRoots": quad_roots,
    "bm_countDigits": count_digits, "bm_matUnknown": mat_unknown, "bm_lineParPerp": line_par_perp,
    "bm_circleLine": circle_line, "bm_transform": transform, "bm_setOps": set_ops, "bm_propRange": prop_range,
    "bm_compUnknown": comp_unknown, "bm_funcCount": func_count,
}
