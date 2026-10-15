"""Independent checks for modules/ai.mjs (sympy / numpy / Fraction / brute force; no port of the JS code)."""
import re
from fractions import Fraction
import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

TR = standard_transformations + (implicit_multiplication_application,)

def P(s, name):
    sym = sp.Symbol(name)
    return parse_expr(s.replace("^", "**"), local_dict={name: sym}, transformations=TR), sym

def mats(tex):
    out = []
    for body in re.findall(r"\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}", tex):
        out.append(np.array([[int(x) for x in row.split("&")] for row in body.split("\\\\")]))
    return out

def ints(s):
    return [int(x) for x in re.findall(r"-?\d+", s)]

def dec(s):
    return sp.Rational(s)           # exact decimal string -> Rational

def cosine(v):
    a, b = sp.Matrix(ints(v["va"])), sp.Matrix(ints(v["vb"]))
    assert len(a) == len(b) and (a.T * a)[0] > 0 and (b.T * b)[0] > 0
    na, nb = sp.sqrt((a.T * a)[0]), sp.sqrt((b.T * b)[0])
    assert na.is_Integer and nb.is_Integer, "norms must be integers"
    assert (na, nb) == (v["na"], v["nb"]) and a.dot(b) == v["dot"]
    c = sp.Rational(a.dot(b)) / (na * nb)
    assert 0 < c < 1
    return c

def jaccard(v):
    A, B = set(ints(v["sa"])), set(ints(v["sb"]))
    assert len(A) == len(ints(v["sa"])) and len(B) == len(ints(v["sb"])), "sets must not repeat"
    assert A | B <= set(range(1, 13))
    # via 0-1 indicator vectors over the 12 numbered words
    ua = [int(i in A) for i in range(1, 13)]; ub = [int(i in B) for i in range(1, 13)]
    both = sum(x * y for x, y in zip(ua, ub)); either = sum(max(x, y) for x, y in zip(ua, ub))
    assert (both, either) == (v["ni"], v["nu"])
    return Fraction(both, either)

def jaccard_rev(v):
    sols = [x for x in range(0, 40) if x <= min(v["na"], v["nb"]) and Fraction(x, v["na"] + v["nb"] - x) == Fraction(v["jp"], v["jq"])]
    assert len(sols) == 1, f"solutions {sols}"
    return sols[0]

def bright(v):
    A = mats(v["mat"])[0]
    B = np.minimum(255, v["a"] * A + v["b"])
    assert (B == mats(v["res"])[0]).all()
    assert (v["a"] * A + v["b"] > 255).any(), "no clipping occurs"
    assert A.min() >= 0 and A.max() <= 255
    return int(B.sum())

def fliptr(v):
    A = mats(v["mat"])[0]
    assert A.shape == (3, 4)
    C = np.fliplr(A).T
    assert C.shape == (4, 3) and (C == mats(v["cm"])[0]).all() and (np.fliplr(A) == mats(v["bm"])[0]).all()
    assert 1 <= v["i"] <= 4 and 1 <= v["j"] <= 3
    return int(C[v["i"] - 1, v["j"] - 1])

def conv(v):
    I, K = mats(v["img"])[0], mats(v["ker"])[0]
    k = K.shape[0]
    wins = np.lib.stride_tricks.sliding_window_view(I, (k, k))          # all k x k patches
    O = np.einsum("abij,ij->ab", wins, K)
    assert (O == mats(v["out"])[0]).all()
    return int(O.sum())

def bayes(v):
    pop = 10000
    spam = pop * v["s"] // 100
    non = pop - spam
    sw = spam * v["p"] // 100; nw = non * v["q"] // 100
    assert spam * v["p"] % 100 == 0 and non * v["q"] % 100 == 0
    assert (spam, non, sw, nw) == (v["s2"], v["h2"], v["a"], v["b"])
    return Fraction(sw, sw + nw)

def trend(v):
    xs, ys = ints(v["xs"]), ints(v["ys"])
    X = sp.Matrix([[x, 1] for x in xs]); Y = sp.Matrix(ys)
    a, b = list((X.T * X).inv() * X.T * Y)                                   # normal equations
    assert dec(v["sl"]) == a
    return a * v["x0"] + b

def parse_line(s):
    return P(s, "x")

def mse(v):
    pts = re.findall(r"\((-?\d+), (-?\d+)\)", v["pts"])
    f, x = parse_line(v["model"])
    errs = [sp.Integer(y) - f.subs(x, int(px)) for px, y in pts]
    assert len(errs) == v["np"]
    return sum(e ** 2 for e in errs) / len(errs)

def gradstep(v):
    L, w = P(v["lw"], "w")
    assert sp.expand(sp.diff(L, w)) == sp.expand(P(v["dl"], "w")[0])
    eta = dec(v["eta"]); cur = sp.Integer(v["w0"])
    for _ in range(v["t"]):
        cur = cur - eta * sp.diff(L, w).subs(w, cur)
    assert cur.is_Rational
    return cur

def gradmse(v):
    pts = [(int(a), int(b)) for a, b in re.findall(r"\((-?\d+), (-?\d+)\)", v["pts"])]
    assert len(pts) == v["np"] and len({p[0] for p in pts}) == len(pts)
    w = sp.Symbol("w")
    L = sum((w * x - y) ** 2 for x, y in pts) / len(pts)
    g = sp.diff(L, w).subs(w, v["w0"])
    assert g == sp.Rational(v["grad"]) and g != 0
    return sp.Integer(v["w0"]) - dec(v["eta"]) * g

VERIFY = {"ai_cosine": cosine, "ai_jaccard": jaccard, "ai_jaccardRev": jaccard_rev, "ai_pixelBright": bright, "ai_flipTranspose": fliptr,
          "ai_convolve": conv, "ai_bayesSpam": bayes, "ai_trendPredict": trend, "ai_mseLoss": mse, "ai_gradStep": gradstep, "ai_gradMse": gradmse}
