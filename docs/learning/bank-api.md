# Question bank API (frozen: `bank-api-1`)

`BANK_INTERFACE_FROZEN = YES`. Guarded by `tests/learn/bank-freeze.test.ts`; any change of shape, error behaviour or determinism bumps `BANK_API_VERSION` and that test.

## Invocation (stress tests)
```js
import { generate, BANK_API_VERSION } from "./scripts/learn/bank/engine.mjs";   // plain ES module, no build step
const { items, bundle, overlay } = generate({ subject: "math" | "english", level: 1..10, count: n, seed: anything, cognitive?: "MEMORIZE" | "PROCEDURE" | "APPLY" | "ANALYZE" | "CREATE" });
```
CLI: `node scripts/learn/bank/generate.mjs --subject math --level 6 --count 10 --seed 42` and `--coverage`. Family probe: `node scripts/learn/bank/core/probe-family.mjs <math-c|english-c|...> 300`. Audit: `npm run bank:audit`.

## Item shape (exact key set, enforced)
`id, level, grade, template, cognitive, features (7 rubric integers), predictedLevel, featureClass, provisional (always true today), question (schema of lib/learn/content/*.json, Korean), overlay (Vietnamese), reasoning (12 dimensions 0..4), reasoningTags, difficulty { difficultyLevel, difficultyBasis: "PROVISIONAL", calibrationConfidence, calibrationVersion: "provisional-1", sourceEvidence: [] }, fingerprint { structural, reasoningPath, skillCombination, parameterPattern, semanticPattern, surface }`.

## Behaviour that may be relied on
* Deterministic: same arguments, same output (byte-identical JSON). Different seeds give different questions.
* Bad input throws (`unknown subject`, `level must be an integer 1..10`, `unknown cognitive class`, `could not generate N distinct ...`); it never returns partial output. A thrown "pool too small" for a large `count` at one level is a finding to record, not a crash to hide.
* `|predictedLevel - level| <= 1` for every item (the rubric level, not the template's declared range).
* Multiple choice items have exactly 4 distinct options with one right answer; numeric items reject an absurd answer; ordering items reject the reversed order; every item has 2 hints and Korean + Vietnamese text; English target text contains no Hangul.

## Stress-test protocol (Antigravity; statistics only, never store the questions)
Per subject x level (1..10) x seeds (hundreds to thousands): run `generate` and record counts of: throws (with message class), determinism mismatches (run twice), tolerance violations, duplicate surfaces inside one run, `EXACT` fingerprint duplicates between different seeds (expected about 0), `NaN` / `undefined` / `{` / `}` in `question.prompt` or `overlay.prompt`, option-count violations, Hangul inside English target text, numeric answers that are not finite.
Output `reports/generated/bank-stress-<date>.json` with fields `bankApiVersion`, `baselineSha`, `subject`, `level`, `seeds`, `items`, one counter per check above, and a markdown summary. A non-zero counter is reported, never filtered.
