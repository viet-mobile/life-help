# Korean assessment evidence: policy

## Status of the bulk Korea matrix (`korea-gap-matrix.json`, commit 8ddb967 in the bulk branch): PROVISIONAL, not integrated
It claims, for 2005-2024 and six families (elementary / middle / high school equivalency exams, CSAT, KICE mock, NAEA): question papers available (a few years UNKNOWN), aggregate performance "VERIFIED" in all 120 cells, and 120 / 120 cells "VERIFIED as non-disclosed" for item-level correct rates. What the file carries as evidence is one archive index URL per exam family plus free-text names of press releases: no per-year, per-resource reference. A single archive page cannot verify twenty years, and an absence ("no item-level rates exist") cannot be verified by a list page at all. The matrix is a hypothesis to be evidenced; no product logic may rely on any percentage in it.

## Rules
1. FACT vs INTERPRETATION. The only statement allowed in product text, docs and UI is a fact about what was found: "official item-level correct rates were not identified in the reviewed public releases". Why they are not released is a legal interpretation and needs primary legal or agency evidence stored with the claim.
2. The bulk file cites a statute article and a Supreme Court judgment as the reason (the case number and decision year look inconsistent with each other). Neither primary document was retrieved or checked. Status: UNVERIFIED. It must not be repeated as "the law mandates non-disclosure".
3. Evidence granularity: one row per (family, year, resource type) in `coverage-evidence.csv` (contract v2, `validateEvidence`): the official URL of the resource itself, its publication year, `accessible` YES / NO / UNKNOWN, retrieved-at. An archive or list page is rejected as per-year evidence. UNKNOWN is a legitimate value and the default.
4. Calibration: Korean items stay STRUCTURAL (no rate). Commercial academy or media "estimated correct rates" are never used.
5. Until per-year evidence exists, Korean sources are listed with `correct_rate_availability = NONE` and no item rows.
