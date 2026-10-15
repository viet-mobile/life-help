"""Independent checks for modules/cul.mjs."""
from fractions import Fraction
from itertools import product

def borda(v):
    # enumerate the ballots explicitly
    ballots = [("A", "B", "C")] * v["n1"] + [("B", "C", "A")] * v["n2"] + [("C", "A", "B")] * v["n3"]
    return sum({0: 2, 1: 1, 2: 0}[b.index("A")] for b in ballots)

def borda_max(v):
    ballots = [(v["b1"], v["n1"]), (v["b2"], v["n2"]), (v["b3"], v["n3"])]
    assert len({b for b, _ in ballots}) == 3 and all(sorted(b.split(">")) == ["A", "B", "C"] for b, _ in ballots)
    tot = {c: 0 for c in "ABC"}
    for b, n in ballots:
        for _ in range(n):
            for place, c in enumerate(b.split(">")):
                tot[c] += 2 - place
    assert sorted(tot.values())[-1] > sorted(tot.values())[-2], "winner must be unique"
    return max(tot.values())

def vote_guarantee(v):
    a, b, c, m = v["a"], v["b"], v["c"], v["m"]
    assert c < max(a, b) and c + m > max(a, b), "C is behind but can still win"
    def sure(x):
        # C gets x of the remaining; try every split of the other m-x votes between A and B
        return all(c + x > a + y and c + x > b + (m - x - y) for y in range(m - x + 1))
    good = [x for x in range(m + 1) if sure(x)]
    assert good and good == list(range(good[0], m + 1)), "guarantee must be monotone in x"
    return good[0]

def string_length(v):
    L, f, L2 = v["L"], v["f"], v["L2"]
    assert 0 < L2 < L
    k = Fraction(f * L)
    assert (k / L2).denominator == 1, "answer must be a whole number of Hz"
    return k / L2

def braille_at_most(v):
    assert v["d"] in (6, 8) and 1 <= v["k"] < v["d"]
    n = sum(1 for cell in product((0, 1), repeat=v["d"]) if 1 <= sum(cell) <= v["k"])
    return n

def pitch(v):
    f = Fraction(v["f"])
    for _ in range(v["k"]): f *= 2
    assert v["mid"] == f, "intermediate value differs"
    return f * Fraction(3, 2)

VERIFY = {"cul_pitchFifth": pitch, "cul_bordaTotal": borda, "cul_bordaMax": borda_max, "cul_voteGuarantee": vote_guarantee,
          "cul_stringLength": string_length, "cul_brailleAtMost": braille_at_most}


def _check_dollars(mod):
    """Static check of the rendered text: every prompt / hint / explanation string (ko and en) has balanced math delimiters."""
    import os, re as _re
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modules", mod + ".mjs"), encoding="utf8").read()
    for line in src.splitlines():
        if _re.match(r"\s+(ko|en): \[", line):
            for s in _re.findall(r'"((?:[^"\\]|\\.)*)"', line):
                assert s.count("$") % 2 == 0, f"{mod}: odd number of $ in: {s[:80]}"


_check_dollars("cul")
