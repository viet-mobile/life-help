# Math and English question bank: ten-step difficulty ladder and random question engine

```
node scripts/learn/bank/generate.mjs --subject math    --level 6 --count 10 --seed 42
node scripts/learn/bank/generate.mjs --subject english --level 3 --count 5  --lang vi
node scripts/learn/bank/generate.mjs --coverage
node scripts/learn/bank/calibrate.mjs scripts/learn/bank/data/reference-items.csv --subject math
```

```js
import { generate } from "./engine.mjs";
const { items, bundle, overlay } = generate({ subject: "math", level: 6, count: 20, seed: 42, cognitive: "ANALYZE" });
```

## The ladder

| level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| grade | E3 | E4 | E5 | E6 | M1 | M2 | M3 | H1 | H2 | H3 |

Level 1 is the easiest question (highest published % correct) and level 10 the hardest (lowest). The rule used by `calibration.mjs`:

* the item with the highest % correct is level 1, the lowest is level 10;
* the difficulty range between them is split into **8 equal parts = levels 2..9**.

Interpretation (one line to change in `buildScale`): items at the easiest / hardest value (ties included) are levels 1 / 10, every other item falls into
one of the eight equal-width bins of the open interval between them. `--extreme 0.05` widens levels 1 and 10 to the outer 5 % of the range.

**Caution on pooling exams.** Raw % correct depends on who took the test: the same item looks "easier" to a selective cohort than to a general one. The raw
rule is the default because it is what was specified. When more than one exam is pooled use `--scale logit-within-exam`, which centres every exam on its
own median difficulty (logit scale) before pooling. Linking exams properly needs anchor items and an IRT model.

## What separates "memorise" from "think": the cognitive rubric (`rubric.mjs`)

Every question is described by seven small integers: `steps`, `abstraction`, `context`, `novelty`, `recall`, `distractor`, `numberSize`.

| class | meaning | typical level |
|---|---|---|
| MEMORIZE | a remembered fact or table answers it | 1-3 |
| PROCEDURE | a taught routine on bare numbers or sentences | 1-7 |
| APPLY | choose and run routines inside a realistic situation | 2-8 |
| ANALYZE | compare, evaluate, find the flaw, interpret data or sources | 3-10 |
| CREATE | non-routine: estimate, optimise, generalise, decide under several constraints | 6-10 |

`demandScore` (weights in `WEIGHTS`) -> `predictLevel`. The engine keeps a generated item only when its rubric level is within one level of the requested
level, so a template's declared range is advisory and the level always comes from the structure of the question.

## Status: PROVISIONAL (read this before relying on the numbers)

* The score -> level mapping is anchored on the design range, **not** on published pass rates. Every generated item carries `provisional: true`.
* **No published pass-rate data has been imported yet.** `data/reference-items.csv` contains a header only. A previous idea of using 20 years of Korean
  elementary / middle / high school equivalency exams and the CSAT could not be fulfilled from data that is officially downloadable: item-level % correct
  is not published as a bulk dataset for those exams, and figures circulated by private academies are estimates, not official statistics, so none were used.
* Open, citable sources of item-level % correct that fit this method: the US NAEP Questions Tool (released items with percent correct), IEA TIMSS / PIRLS
  released items (item-level percent correct by country, public domain for educational and research use), and national test bodies that publish
  question-level national results (for example England's Key Stage 2 test question-level analyses). Each row needs source, licence and url
  (`validateRow` rejects rows without them).
* Once at least 40 coded rows exist: `calibrate.mjs` produces the real scale; `fitMapping` / `evaluateMapping` in `rubric.mjs` learn the score -> level
  mapping from the coded items and report how well the rubric explains the published difficulty (Spearman correlation, share within one level).

## What is generated, and why it is not copied

Templates (20 math, 19 English) are original generators: a situation is composed from parameters, names, numbers and text pools, and the answer is computed
by code, with an independent check (`verify`) that must agree. No exam question text is stored or reproduced; exams may only inform which kinds of thinking
exist at each level.

* Math: recall facts, routines, shopping with dependent steps, fractions / percent / ratio, rates and travel, statistics, plan comparison with linear
  models, finding the flaw in a worked solution, equations, counting and probability, modelling with functions, real geometry, estimation with stated
  assumptions, optimisation under constraints, pattern generalisation, exponential and logarithmic models.
* English (decoding information found online): public signs, notices, product pages and totals, schedules and time zones, return policies and eligibility,
  weather alerts, e-mails (purpose, deadline, tone), review reliability, headline versus evidence, instruction order, error messages and logs, two
  sources that disagree, numbers inside text. The target text is English in every locale; instructions, hints and explanations are Korean and Vietnamese.

Same seed -> same questions. Different seeds -> different numbers, names, texts, options. At least 400 distinct questions per level and subject.

## Output format and how to use it

`items[i].question` follows the schema of `lib/learn/content/*.json` (Korean in the bundle) and `items[i].overlay` is the Vietnamese overlay. `meta` fields:
`level`, `grade`, `template`, `cognitive`, `features`, `predictedLevel`, `provisional`. Nothing here is wired into the learner's path yet: the engine is a
source of questions, to be placed into lessons, practice or placement later.

Known rendering notes: documents use " | " as a line separator and "USD" instead of a dollar sign, because the lesson renderer shows one line of text and
reads `$...$` as math.

## Extending

Add a template to `templates/*.mjs` (`id`, `short`, `cognitive`, `levels`, `make(rand, level)` returning type, prompt, hints, expl, features and `verify`),
export it from `templates/math.mjs` or `templates/english.mjs`, and run `npx vitest run tests/learn/bank.test.ts`.
