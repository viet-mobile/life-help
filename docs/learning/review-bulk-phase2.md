# Review of Antigravity Phase 2 (branch `feature/learning-v3-bulk-phase2`, HEAD `a6c1d71`; reviewed 2026-10-05)

Method: committed files only, verified by core code; chat summaries and generator "audits" were not trusted. Cherry-picks only; the branch was not merged.

| commit | verdict | core commit | reason |
|---|---|---|---|
| `61d5c2b` translation readiness / canonical verification | APPROVE | `1a43e78` | checks run and pass on core |
| `6ecb0de` 35 generated locales | REJECT | - | structurally valid but not translations: family-template copies; 27 of 35 in the wrong language (e.g. Hebrew strings are Arabic, Thai strings Indonesian); added claims ("free", 3 minutes, nickname 2-12, flame emoji). Verifier: 70 problems |
| `e0bb18b` generated translation module | REJECT | - | wraps the rejected locale files |
| `2effabf` bank stress harness | APPROVE_WITH_CORRECTION | `63e10db` (+ fix `1307bb5`, rerun `48316e6`) | sound infrastructure; it found a real defect (327 of 2,500 English items with Hangul in the target layer), fixed in core templates; `bank-api-1` unchanged |
| `53b1fb3` rubric coding candidate | REJECT | - | circular: `switch (lvl)` on the empirical level assigns the features; fit metrics INVALID; `FIT_MAPPING_STATUS = DEFERRED`; generated items stay PROVISIONAL |
| `e982212` candidate v2 | REJECT | - | identical copy of the reviewed 308-item layer; no new items; `MULTI_CYCLE_EXPANSION = NO` |
| `a6c1d71` whitespace trim | REJECT (as a commit) | - | touches mostly files from rejected commits; the approved files are already clean on core |

## Acceptance gate for re-delivered translations
`scripts/learn/i18n/verify-generated-locales.mjs` (core-owned, tested by `tests/learn/generated-locales-verify.test.ts`): key parity with `en.ts`, placeholder multiset, no markup/newline/`$`, no Hangul outside ko, brand tokens and emoji, `locale.*` names, no generated reference locale, script match per locale, no copying between languages.

## Open items for Antigravity
See `antigravity-handoff.md` (Phase 3 re-delivery requirements). Bank diversity finding: `bank-backlog.md`.
