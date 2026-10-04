# Learning Platform V3: parallel work plan (source of truth)

Base (clean feature HEAD): 9d3b0c3 (`feature/learning-elementary-vi`). Plan-doc commit e33c521. Both tracks start from the final baseline recorded in `docs/learning/antigravity-handoff.md`.
Live `6e68ec3d` stays 100%. Canary `25747a2a` (`c4b03fe`) is NOT promoted. The next production release is rebuilt from a new RC after this work.

| Track | Owner | Branch | Worktree |
|---|---|---|---|
| A core | Claude | `feature/learning-v3-core` | `../life-help-v3-core` |
| B bulk | Antigravity | `feature/learning-v3-bulk` | `../life-help-v3-bulk` |

Rules: no same-file edits. Antigravity does not decide product meaning, security policy or the difficulty math: it expands what this document and Claude's
schemas fix. Every Antigravity commit is reviewed and cherry-picked by Claude. Never fabricate data: unknown = `null` + status `UNAVAILABLE`.
Never store copyrighted exam stems, passages or answer choices (or near-verbatim paraphrase).

## File ownership (no overlap)
Claude (A): `lib/learn/bank/core/**`, `lib/learn/certification/**`, `lib/learn/scholarship/**`, `lib/learn/transparency/**`, `lib/learn/products/**`,
`scripts/learn/bank/**` (engine, rubric, templates), `docs/learning/**`, `data/learning-calibration/schema/**`, `lib/learn/i18n/ko.ts|en.ts` (canonical strings),
`app/**`, `components/**`, `tests/learn/*.test.ts` (hand-written).
Antigravity (B): `data/learning-calibration/{sources.csv,items.csv,source-manifest.json,gap-report.md}`, `lib/learn/i18n/generated/**`,
`messages/generated/**`, `tests/generated/**`, `reports/generated/**`, `data/learning-study/inventory/**`, generated section of the registry file
`lib/learn/products/registry.generated.ts`. B never edits files outside this list; if it needs something else it writes `reports/generated/REQUESTS.md`.

## Interfaces and canonical facts
* Language registry source of truth is the real code: `messages/index.ts` `locales` (38 entries, JSON files in `messages/`). Never guess the list; generate from it.
* Difficulty ladder: level 1..10 = E3,E4,E5,E6,M1,M2,M3,H1,H2,H3. Adaptive band around the anchor (e.g. M2 = L6, band L4..L8). E1/E2 = pre-anchor foundation.
* Product hosts: `math.life.help`, `english.life.help` (school, E1..H3); adult: `study.<language>.life.help`. UI locale is independent of target language.
  Legacy map: study.korean.viet.mobile -> study.korean.life.help, study.english.viet.mobile -> study.english.life.help, study.japanese.viet.mobile ->
  study.japanese.life.help, zhong.wen.viet.mobile -> study.chinese.life.help, bahasa.indonesia.viet.mobile -> study.indonesian.life.help,
  hoc.tieng.viet.mobile -> study.vietnamese.life.help.
* English target sentences inside English-learning content are NOT translated; only UI and instructions are.

## Schemas (B must follow exactly)
`sources.csv`: source_id,country,institution,exam_family,year,subject,official_url,publication_status,license_status,usage_note,data_status
(data_status in EMPIRICAL|STRUCTURAL_ONLY|UNAVAILABLE).
`items.csv`: source_id,item_ref,year,subject,topic,grade_or_population,correct_rate,sample_n,sample_note,official_url,data_status
(`correct_rate` fraction 0..1 or empty if not public; `item_ref` is a public id/number only, no text).
`source-manifest.json`: `{ generatedAt, sources:[{source_id, retrievedAt, url, sha256OfRetrievedMetadata?}], gaps:[{source_id, reason}] }`.
Locale files: `{ "<key>": "<string>" }` flat; keys = canonical key set in `lib/learn/i18n/en.ts`; keep `{placeholders}` byte-identical; RTL locales: ar, arz, fa, he.

## Packages for Antigravity (one commit each)
1. `data(learn): add public assessment calibration metadata` (priority NAEP, TIMSS, PIRLS, England KS2, then others in the 7 countries and Korea; Korea stays UNAVAILABLE/STRUCTURAL if no official item rates).
2. `feat(i18n): expand learning UI to all supported locales` (all 38 from the canonical keys, plus QA report: missing/empty/placeholder/interpolation/duplicate-English/ko/vi leakage/RTL).
3. `test(learn): add generated bank stress coverage` (after Claude's API freeze; hundreds+ seeds per subject x grade x level; statistics only).
4. `feat(i18n): localize new home services` (Study card + Aircon copy x 38, reuse glossary, + service ordering tests).
5. `data(study): add legacy site inventories` (counts only, from Claude's schema).
6. `test(crypto): add transparency test vectors` (after Claude's spec).

## Acceptance
Each package: deterministic generation script committed with the data; `git diff --check`, `tsc`, `vitest` green; no secrets; no copyrighted text; report in `reports/generated/`.
Claude gates: provenance review, license, comparability, cherry-pick, then groups A..G stay separable (A UX, B bank, C 38-lang, D adult study, E Study card, F Aircon, G cert/scholarship).
