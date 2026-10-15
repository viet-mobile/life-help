# High-school math bank tranche: authoring spec

Goal: about 6,000 NEW practice questions for the high-school courses of the 2022 curriculum, as a DRAFT bank (`lib/learn/content/bank/math-hs.json`,
never loaded by the runtime) next to the existing, untouched 6,672-question bank. Quality and structural variety matter more than count: a structure
(= one template + generator) is only worth having if it practises a different concept, representation or solution strategy from the others.

## What you write (and only this)
* `scripts/learn/bank/hs/modules/<mod>.mjs`  exporting `TEMPLATES`, `GEN`, `PLAN`
* `scripts/learn/bank/hs/verify/<mod>.py`   exporting `VERIFY = { template_key: fn(v) }`
Do not edit anything else (no lib/, tests/, other modules, standards.json, build.mjs, lib.mjs). If you need a helper, define it inside your module.
Read `modules/cul.mjs` + `verify/cul.py` (a complete small example), `lib.mjs` (helpers) and `build.mjs` (the rules the builder enforces).

## Module API
```js
export const TEMPLATES = { <mod>_<name>: { ko: [prompt, [hint1, hint2], explanation], en: [prompt, [hint1, hint2], explanation] } };
export const GEN = { <mod>_<name>: (r, lvl) => ({ v: { ...variables }, ans: <number>, tol?: <number> }) };   // r = seeded rng {int(lo,hi), pick(arr), nonzero(lo,hi), next()}
export const PLAN = [ { skill, template, levels: [1,2,..], count, d: <base difficulty 1..5>, standards: ["<official code>",..], strategy: "<short tag>", evidence: "calc|concept|application|reverse|counting|representation" } ];
```
* Template keys start with `<mod>_`. Placeholders `{name}` are the variables of `v` (+ `{ans}`); inside LaTeX write doubled braces `\frac{{a}}{{b}}` when `a`,`b` are variables; a literal group such as `\frac{3}{2}` or `^{2}` is written normally. Math in `$...$`. Korean text is canonical (`ko`), `en` is the reference every other language is translated from: same meaning, same placeholders, no Korean in `en`.
* The prompt ends with the answer format: `(숫자만 쓰세요)` / English `(digits only)`; for a fraction answer `(소수로 써도 되고 3/4 처럼 분수로 써도 돼요)`. Hints: 2, the first small, the second concrete but never the answer itself. Explanation: the actual solution steps with the numbers (shows the working, ends with the answer).
* `v` values are digits / signs / LaTeX only (no Hangul). `ans` is a finite JS number.
* `PLAN`: each template appears once or more; `levels` are the generator's `lvl` argument (1,2,3 = ranges / forms of growing difficulty; every level is its own set of `count` distinct rows, minimum 12 distinct rows each unless the parameter space is smaller); `d` is the base difficulty (1..5) of level 1. `standards` are OFFICIAL codes from your brief; the evidence label says honestly what the item practises. Items for standards that are about explaining, proving, investigating or presenting (class X) must not be written; class C standards get items whose numeric result genuinely depends on the concept (a count, a parameter value), never a disguised calculation.

## Quality rules (each is checked by a reviewer who did not write your code)
1. Exactly ONE correct numeric answer. State every condition the answer depends on: domain (`x`는 실수 / 양의 정수), "큰 근", "가장 작은", base, unit (cm, 원, %, Hz …), order. If a quantity could be 2 values, ask for their sum/product or the larger/smaller one, never leave it open.
2. Answers are integers, terminating decimals (<= 3 places) or simple fractions (then the prompt allows a fraction and `ans` is the exact double). Irrational results: avoid by choosing parameters so the result is rational; if truly needed, the prompt names the rounding ("소수 둘째 자리까지, 셋째 자리에서 반올림") and the generator sets `tol` to half a unit of that place (0.005) with `ans` the correctly rounded value.
3. No figure is shown: geometry is given by coordinates, equations or lengths, and the numbers must describe a REAL object (a triangle that exists, a line that meets the circle, positive lengths, a probability <= 1, a defined function value).
4. No two rows of a set may read the same; the builder drops duplicate prompts (also against the existing 6,672). Do not fill counts by trivial re-scaling of one pattern: vary the structure across templates (forward computation, finding an unknown parameter from a given result, counting / condition problems, changing representation (equation <-> graph feature <-> table <-> word problem), multi-step chains, "which value satisfies ..." with a unique integer).
5. Only high-school level content for your course; use the course's own vocabulary (공통수학1 ..). The site's H1~H3 grouping is NOT the official course-to-grade assignment: do not write "고1/고2" in prompts.
6. Word problems use plain, neutral, realistic contexts; units and magnitudes plausible; no cultural/brand specifics.
7. Hints/explanations must be mathematically correct for EVERY row the generator can produce (not just the typical one): e.g. a "since the discriminant is positive" sentence must be true for all rows, or the generator must enforce it.

## The independent verifier (`verify/<mod>.py`)
Python 3 with sympy (`/tmp/venv-math/bin/python`). `fn(v)` gets the row's variables and RE-DERIVES the answer by a different method than the generator (sympy solve/limit/integrate, `fractions.Fraction`, brute-force enumeration over a wide range, a mathematical invariant such as Vieta/identity, Monte-Carlo is NOT allowed). Do not port the JS algorithm. Also assert every precondition the prompt relies on (uniqueness: enumerate all candidates in a generous range and check exactly one fits; domain; existence). Return the recomputed answer (int / Fraction / sympy Rational / float); raise AssertionError with a message when a precondition fails. Parse LaTeX variable strings yourself (sympy `parse_expr` on a cleaned string is fine).

## Commands
```
HS_ONLY=<mod> node scripts/learn/bank/hs/build.mjs --dump /tmp/hs-rows-<mod>.json     # builds only your module (shared output files are not written); must end without errors
/tmp/venv-math/bin/python scripts/learn/bank/hs/verify/run.py /tmp/hs-rows-<mod>.json <mod>    # must print "failures 0"
```
Other agents work on other modules at the same time: ALWAYS run the builder with `HS_ONLY=<mod>` (it then writes nothing shared); never hand-edit `lib/learn/content/bank/math-hs.json` or `scripts/learn/bank/hs/kit/*`. Do not commit; the integrator commits.

## Report (final message, <= 40 lines)
Structures written (key + one-line math description), rows per structure, standards covered, anything you are unsure about, and the count of rows after dedupe.
