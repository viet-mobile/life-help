# Legacy adult-study import: real-corpus pipeline (design and what it found)

Code: `scripts/learn/study/importer.mjs` (stages, ids, rights gate), `scripts/learn/study/legacy-import.mjs` (CLI), `lib/learn/products/content.ts` (`AdultContentPack`, `validateContentPack`). Tests: `tests/learn/study-import.test.ts`. Snapshot of the real run: `data/learning-study/import/legacy-discovery.json`.
`node --no-warnings scripts/learn/study/legacy-import.mjs [--root <legacy root>]` writes the report and imports nothing; no database is touched at any stage.

## Stages
| stage | input | output | rule |
|---|---|---|---|
| discover | legacy root | per product: data files with size and sha256 | read from disk; a missing file is reported missing, never assumed |
| parse | data files | containers (`const NAME = [...]`) with measured row counts and bytes | `JSON.parse` only, no code is evaluated; unreadable containers are reported as such |
| normalize | containers + adapters | one `AdultContentPack` per product + the list of unmapped containers | a container becomes content only through an explicit adapter; no adapter ships, so nothing is guessed |
| validate | packs | problems per pack | `validateContentPack` (ids, references, levels, locales, per-target extensions, exercises) |
| report | all of the above | counts, rights status, unmapped containers | every number is measured; lesson / vocabulary / grammar / exercise counts are whatever the adapters produce |
| dry run | packs + rights | the rows an import WOULD create, or a refusal with reasons | rights gate, then id-collision check; `database: NOT TOUCHED` |

## What the real run found (this machine, snapshot in the report)
* The five `study-*` data blocks (korean, english, japanese, chinese, indonesian) each hold 5 containers with 39 rows in total: configuration, UI text, TTS guide and source labels, plus an EMPTY `TARGET_CORPUS`. There is no vocabulary, lesson, grammar or exercise content in the deployed study data to import.
* The Vietnamese application's data block (`data_block.js`) holds 113 containers with 8,760 rows (frequency vocabulary, vocabulary groups, grammar units, a 20-week curriculum, culture articles, scripture and song text, templates, ...). None is mapped: each container needs its own adapter and its own rights decision.
* The claimed "300 vocabulary / 15 lessons / 15 grammar rules per site (1,800 / 90 / 90)" does not exist in these files.
* RIGHTS: the legacy source metadata (`target_sources.py`) documents its corpus sources by jw.org publication symbol and says the official titles were copied from jw.org. Whether LIFE.HELP may use that material is a rights question for people, not a parsing question. Every legacy source is therefore recorded as UNCLEARED in `data/learning-study/rights.json`, and the dry run refuses all six products (0 rows). An adapter may be written and tested, but nothing is imported until a source has an evidenced OWNED / LICENSED / PUBLIC_DOMAIN decision (evidence, decidedBy, decidedAt).
* Consequence for the product plan: adult study v1 should be built on content LIFE.HELP owns or licenses (original lessons authored against `AdultContentPack`, validated by the same checks), with the legacy sites remaining as they are until a rights decision exists. The engine, the contracts, the host model and the importer are ready; the content is the open item.

## ID namespace
`study:<target>:<type>:<legacyId>` with `<target>` = the registry slug (`korean`, `english`, ...), `<type>` in `vocab | grammar | lesson | exercise`. Deterministic, repeatable (same input, same ids), unique across targets and types, and INJECTIVE: any character outside `[A-Za-z0-9._-]` is written `~xxxx` (hex code unit), so `a b` and `a~0020b` cannot collide; at most 200 characters; `parseNamespacedId` round-trips. References inside a pack (lesson -> vocabulary / grammar / exercise, content -> lesson) are namespaced in the same pass, so they stay consistent. A collision inside a product blocks the dry run.

## Per-host migration (nothing is switched; see `legacy-migration.md` for the census and the category table)
1. Build the new host's content on owned content (`study.<slug>.life.help`, staging variant `study-<slug>-staging.life.help`, local `study.<slug>.localhost`).
2. Canonical metadata, manifest and service worker are generated per host from the registry; the legacy worker is replaced by one that unregisters itself (never two scopes).
3. Only when the new host serves the full product: exact-host permanent redirects (`legacyHosts` in the registry, no wildcard) and `<link rel="canonical">` on the new host only; SEO canonical on the legacy host points to the new host during the overlap.
4. Browser-local progress (`target_study_progress_*`, `viet_mobile_locale`) is read once for an opt-in import into the account, then retired.
5. Production DNS and certificates (two-label hosts need per-host certificates) are a separate, explicit step; none of this changes DNS.
