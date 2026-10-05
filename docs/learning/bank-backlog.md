# Question bank backlog (recorded during the frozen stress run; NOT started)

`bank-api-1` is frozen while Antigravity stress-tests it. Nothing below changes `GenerationContext`, `QuestionBlueprint`, `GeneratedQuestion`, `QuestionValidator`, `publicView`, `DifficultyProfile`, `ReasoningProfile` or the fingerprint contract, and none of it ships before the stress baseline is reviewed. Anything that adds families or changes item output bumps `BANK_API_VERSION` and the freeze test together, and the baseline is rerun.

## Generator-family gaps (from `docs/learning/generator-audit.md`)
1. Math optimization below level 9 (elementary best-buy with a budget and a rule, levels 3-7).
2. Math error analysis at levels 1, 6 and 10 (level 6 wrong equation-solving step, level 10 flaw in a short argument).
3. English levels 1-3 (bus-stop sign, opening-hours line, simple order confirmation).
4. English level 10: a "documentation + constraints" family (conflicting version notes, deprecation, regional differences).
5. English error analysis at levels 1-3 and 10, optimization at level 10, strategy selection below level 9 (what to search for, which source to open first).
6. A mixed search -> open -> verify family for the final band.
7. Two or more families that serve levels 1-2 in math beyond arithmetic and fact recall (place-value, measurement reading, simple pictogram reading).

## Engine and contract items
* Wire an ACCEPTED rubric mapping (`mapping-decision.json`) into `stampGenerated` so generated items become STRUCTURAL: a `bank-api-2` change with its own baseline.
* A per-subject cap on how often one template may appear in one run (diversity), if the stress report shows dominance.
* Replace the weak shuffle in `publicExercise` (adult exercises) by a seeded server-side shuffle before any adult exercise is served.
* Reasoning hints for families are template-id based; move them into the template objects once the API may change.

## Evidence items
* Rubric-code at least 40 real items (guide: `rubric-scoring-guide.md`), run `assessFit`, record the decision.
* Per-year Korean coverage evidence (`coverage-evidence.csv`) or leave Korean as "not identified".

## Diversity finding from the stress rerun (2026-10-05)
499 of 5,000 sampled items repeat an exact fingerprint across seeds, concentrated in math L1 (91/250) and L10 (110/250). Candidates: widen parameter ranges at math L1, add structural variation at L10. Not started; any change to item output bumps `BANK_API_VERSION`.
