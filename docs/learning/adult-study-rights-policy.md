# Adult Study: content-rights policy (decision of 2026-10-05)

## Decision
1. The six legacy `viet.mobile` study sites stay exactly as they are. Nothing here changes, redirects or replaces them.
2. Their corpus is documented (by the legacy repositories themselves) as jw.org publication material. Rights for LIFE.HELP to reuse it are **UNCLEARED**. While UNCLEARED, no legacy text is imported, translated, summarized or paraphrased into Adult Study, and nothing is scraped from or repackaged from jw.org.
3. Adult Study v1 (`study.<korean|english|japanese|chinese|indonesian|vietnamese>.life.help`) may use only content whose status is ORIGINAL, LICENSED, OPEN_LICENSE or PUBLIC_DOMAIN, each with recorded evidence.

This file records a decision about what the project will do. It makes no legal claim about the legacy content, jw.org or anyone's rights.

## Statuses (`lib/learn/products/rights.ts`)
| status | publishable | needs |
|---|---|---|
| ORIGINAL | yes | authoring record, decidedBy, decidedAt |
| LICENSED | yes | evidence, licence/contract id, decidedBy, decidedAt |
| OPEN_LICENSE | yes | evidence, SPDX id on the allow-list (non-commercial and no-derivatives terms are refused), decidedBy, decidedAt |
| PUBLIC_DOMAIN | yes | evidence of the basis, decidedBy, decidedAt |
| UNCLEARED | **never** | default for anything not listed |
| REJECTED | **never** | final; no later note clears it |

A clearing status with missing evidence degrades to UNCLEARED (fails closed). Gate points: `rightsOf` in the importer (source level) and `publishProblems(pack)` (pack level, reads `provenance.rights`). Decisions live in `data/learning-study/rights.json`; the committed file clears nothing (test: `tests/learn/content-rights.test.ts`).

## Consequences
* The legacy importer remains a measurement and dry-run tool; its dry run refuses all six products.
* Adult Study content is authored from scratch (see `adult-study-curriculum.md`); no imitation or close paraphrase of legacy lessons.
* Bulk agents may not touch `rights.json`; changing a status is a human decision recorded with evidence.
