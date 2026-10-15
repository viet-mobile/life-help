#!/usr/bin/env python3
"""Independent verification of the DRAFT high-school math bank (scripts/learn/bank/hs).

  node scripts/learn/bank/hs/build.mjs --dump /tmp/hs-rows.json
  /path/to/python scripts/learn/bank/hs/verify/run.py /tmp/hs-rows.json [module ...]      (needs sympy)

Every verify/<module>.py defines VERIFY = { template_key: fn(v) }.  fn receives the dict of variables of one row exactly as stored, recomputes the
answer with a method that shares NO code with the JS generator (sympy, exact Fractions, brute-force enumeration, or a mathematical invariant) and
returns that value (int / Fraction / float / sympy number).  It may `raise AssertionError` for a violated precondition (a condition missing from
the prompt, a non-unique answer, a value outside the domain).  The runner compares with the stored answer: exact for integers and for decimals
that terminate (compared as exact decimal fractions); for a stored tolerance the recomputed value must round to the stored answer.
Writes docs/learning/math-hs-bank/verification.json (with the sha256 of math-hs.json) when run for all modules.
"""
import hashlib, importlib.util, json, os, sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../../.."))

def load(mod):
    spec = importlib.util.spec_from_file_location(f"hs_verify_{mod}", os.path.join(HERE, f"{mod}.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def exact(x):
    """to an exact Fraction when possible"""
    try:
        import sympy
        if isinstance(x, sympy.Basic):
            if x.is_Rational: return Fraction(int(x.p), int(x.q))
            return float(x)
    except ImportError:
        pass
    if isinstance(x, bool): raise AssertionError("boolean result")
    if isinstance(x, (int, Fraction)): return Fraction(x)
    if isinstance(x, float): return x
    return Fraction(x)

def main():
    dump = json.load(open(sys.argv[1]))
    only = set(sys.argv[2:])
    mods = {}
    report = {"templates": {}, "failures": []}
    total = bad = 0
    for s in dump["sets"]:
        if only and s["module"] not in only: continue
        if s["module"] not in mods:
            path = os.path.join(HERE, f"{s['module']}.py")
            mods[s["module"]] = load(s["module"]) if os.path.exists(path) else None
        m = mods[s["module"]]
        fn = None if m is None else m.VERIFY.get(s["template"])
        t = report["templates"].setdefault(s["template"], {"module": s["module"], "rows": 0, "verified": 0})
        for row in s["rows"]:
            total += 1; t["rows"] += 1
            if fn is None:
                bad += 1; report["failures"].append([s["id"], "NO VERIFIER"]); continue
            try:
                got = exact(fn(dict(row["v"])))
                ans = row["ans"]
                tol = s["tolerance"]
                if tol:
                    # rounded / approximate answer: the stored value must be what rounding the exact value gives, and within the stored tolerance
                    dec = len(repr(ans).split(".")[1]) if "." in repr(ans) else 0
                    ok = abs(float(got) - ans) <= tol and abs(round(float(got), dec) - ans) < 1e-9
                elif isinstance(got, Fraction):
                    if terminating(got):
                        ok = got == Fraction(repr(ans))          # exact, as a decimal fraction
                    else:
                        ok = abs(float(got) - ans) < 1e-12        # a rational stored as a double (the prompt asks for a fraction)
                else:
                    ok = abs(got - ans) < 1e-9
                if not ok:
                    bad += 1; report["failures"].append([s["id"], row["v"], ans, str(got)])
                else:
                    t["verified"] += 1
            except AssertionError as e:
                bad += 1; report["failures"].append([s["id"], row["v"], "assert", str(e)])
            except Exception as e:  # a crashing verifier is a failure, never a pass
                bad += 1; report["failures"].append([s["id"], row["v"], "error", f"{type(e).__name__}: {e}"])
    print(f"verified {total - bad} / {total} rows; failures {bad}")
    for f in report["failures"][:25]: print("  FAIL", f)
    if not only:
        bank = open(os.path.join(ROOT, "lib/learn/content/bank/math-hs.json"), "rb").read()
        try:
            import sympy; sv = sympy.__version__
        except ImportError: sv = None
        out = {"bankSha256": hashlib.sha256(bank).hexdigest(), "rows": total, "failures": bad, "sympy": sv, "python": sys.version.split()[0],
               "templates": report["templates"]}
        os.makedirs(os.path.join(ROOT, "docs/learning/math-hs-bank"), exist_ok=True)
        json.dump(out, open(os.path.join(ROOT, "docs/learning/math-hs-bank/verification.json"), "w"), indent=1, ensure_ascii=False)
    sys.exit(1 if bad else 0)

def terminating(fr):
    d = fr.denominator
    for p in (2, 5):
        while d % p == 0: d //= p
    return d == 1

if __name__ == "__main__":
    main()
