"""Independent checks for modules/cul.mjs."""
from fractions import Fraction
from itertools import product

def borda(v):
    # enumerate the ballots explicitly
    ballots = [("A", "B", "C")] * v["n1"] + [("B", "C", "A")] * v["n2"] + [("C", "A", "B")] * v["n3"]
    return sum({0: 2, 1: 1, 2: 0}[b.index("A")] for b in ballots)

def braille(v):
    # brute force over all raised/not-raised assignments
    return sum(1 for cell in product((0, 1), repeat=v["d"]) if any(cell))

def pitch(v):
    f = Fraction(v["f"])
    for _ in range(v["k"]): f *= 2
    assert v["mid"] == f, "intermediate value differs"
    return f * Fraction(3, 2)

VERIFY = {"cul_pitchFifth": pitch, "cul_bordaTotal": borda, "cul_brailleCells": braille}
