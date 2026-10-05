# Review of the final bulk redelivery (branch `feature/learning-v3-bulk-final`, HEAD `be6dc7d`, based on core `fcdc4af`; reviewed 2026-10-05)

Method: committed content only (extracted with `git archive`), checked by core code. Commits are cherry-picked one at a time; the branch is not merged.

| commit | content | verdict | core commit |
|---|---|---|---|
| `f9b8ebc` | 35 main-service locales (21 keys) + generator, sample report, test | **APPROVE** | `3971e8b`, merged into `messages/` in `52f1372` |
| `6ec4798` | bank stress rerun on the fixed core, duplicate classification | **APPROVE** | `a46feb6` |
| `b363d1f` | duplicate-severity report | **APPROVE** | `db83016` |
| `d7fcd2e` | root-cause analysis of the earlier translation failure | APPROVE (record) | `5c7ed2a` |
| `cfd73b7` | regenerated 35 learning locales + generated TS module | **REJECT** (section 1) | - |
| `be6dc7d` | tests/reports for those learning locales | REJECT (depends on `cfd73b7`) | - |

## 1. Learning translations: REJECTED on semantic review (the structural gate passes)
* Structural: `verify-generated-locales.mjs` on the delivered files: 301 keys, 35/35 locales, wrong-language 0, missing 0, empty 0, placeholder mismatch 0, no Hangul, no copies between languages. The earlier wrong-language defect is fixed.
* Semantic: reading the canonical text against the translations shows 13 locales (**ar, de, es, fr, hi, id, it, ja, nl, pt, ru, zh-Hans, zh-Hant**) were produced from a different source text than `en.ts`:
  * `onboarding.nickname.hint`: canonical "A nickname of 2-16 characters"; these locales say 2-12. This is a wrong validation hint for the real input rule.
  * `landing.cta.start`: canonical "Start in 1 minute"; these locales say "Start for free" (a promise that is not in the canonical text; the handoff forbids added promises).
  * `site.math.description`, `site.english.description`, `landing.how1.body`, `diag.intro.title`, `dash.diagnostic.cta`: canonical numbers ("3-10 minute", "2-minute") dropped.
* The check is now mechanical: the verifier compares the numbers of every string (native digits normalised; `grade.*` labels exempt). On the delivered package it reports 15 locales: the 13 above are genuine defects; `arz` (number words, e.g. "دقيقة واحدة") and `he` ("בדקה אחת") are false positives of the digit rule and read correctly, but a re-delivery should still use digits.
* The other 20 locales (am, bn, da, el, fa, kk, km, mn, my, ne, no, pl, si, sv, ta, tet, th, tr, uk, uz, plus arz and he on reading) are faithful on the sampled keys.
* Core does not hand-edit generated translations. The 38-locale learning gate stays **OPEN/FAIL** until those 13 locales are regenerated from the canonical text and the verifier exits 0.

## 2. Main-service package: PASS
Core verifier 35/35, 0 problems, 0 strings identical to English; `merge-main-service-i18n.mjs --check` PASS; temporary-copy merge: merged 35, rejected 0, stale 0; hand sample over ar, he, th, ja, zh-Hans, hi, ru, de, nl, pt, uz, tet, id, tr: Study and Aircon meaning correct, `{site}` kept, no unrelated language. Notes: some locales localize "Grade 1 to Grade 12" to the local school system (th ป.1-ม.6, nl "groep 3 tot het eindexamenjaar"): acceptable, flagged as PASS_WITH_NOTE. `ko`, `en`, `vi` untouched.

## 3. Bank stress rerun: PASS
Rerun harness (cherry-picked): 5,000 items; unexpected throws 0; determinism mismatches 0; tolerance violations 0; option-count (invalid multiple choice) 0; non-finite numeric 0; Hangul in English target 0 (the harness now inspects options, ordering items, passage, stimulus and the READ frame); `bankApiVersion = bank-api-1`. The harness has no "public answer leak" counter: the guarantee is structural (`publicView` returns only id, blueprintId, prompt, options, difficulty; frozen by `tests/learn/bank-freeze.test.ts`).

## 4. Duplicates: FOLLOWUP, not a blocker
Bulk report: exact content repeats 523 items (272 clusters, 10.5 %), near duplicates 191, max repetition 20 ("1 m = how many cm" at math L1, a small fact pool); concentration math L10 132, L1 99. The "same skeleton 4,950 (99 %)" row is expected generator behaviour and not a defect. Core's independent re-generation over the same grid (5,000 items): 4,492 distinct contents; of 508 repeats, 0 have a different answer for identical content and 0 ids map to different content, so there is no answer-instability, id-collision or determinism bug. The bank is not wired into the learner runtime. Classification: FOLLOWUP (backlog), no arbitrary diversity threshold applied.

## 5. Rubric
`53b1fb3` REJECTED (circular, confirmed independently); `FIT_MAPPING_STATUS = DEFERRED`; generated items PROVISIONAL.

## 6. Re-delivery request for the learning package
Regenerate at least the 13 locales above (ideally all) from the canonical `en.ts` text and the Korean/Vietnamese references: keep every number, add no claim ("free", "official", "guaranteed"), keep the nickname hint at 2-16. Acceptance: `verify-generated-locales.mjs --dir <dir>` exits 0 (now including number parity) and a core semantic read of the changed locales.
