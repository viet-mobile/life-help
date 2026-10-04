# Legacy adult-study sites: what is known, and how they migrate

## What was mechanically established
Census snapshot: `docs/learning/legacy-domain-references.json`, tool `scripts/learn/bank/core/verify/legacy_domain_refs.mjs` (counts files, records file / line / category only).

* The legacy study sites are a vanilla-JavaScript single-page PWA built by a Python pipeline (`build_app.py`, `assemble_app.py`, `site_profiles.py`), deployed as static Cloudflare Pages output. 14 language entry routes are rewrites to `/index.html` (`_redirects`). Progress is browser-local; there is no account system.
* References to the string `viet.mobile`: **47** in the four standalone source repositories found (korean 16, english 9, chinese 11, indonesian 11; the Japanese standalone repository was not found; the Vietnamese site is the large `hoc-tieng-viet-mobile` application and was not scanned) and **15** in the five consolidated `study-*` dist folders (3 each). The bulk report figure "42" is not reproducible: its generator contains it as a constant and reads no file.
* Categories found in the sources: build / API configuration (3-4 per repository), service worker (2), canonical metadata (2), static text (README and sample data, 2-8). The consolidated dist references are 3 static-text lines each.

## What is NOT established
* The content model. The bulk reports state 300 vocabulary items, 15 lessons and 15 grammar rules per site (1,800 / 90 / 90). Those numbers are constants in the bulk generators (`vocabCount: 300` and so on), which read no content. In the consolidated dist the data file carries an empty `TARGET_CORPUS`, and the standalone repositories' `data_block.js` holds a handful of `[SAMPLE]` rows. Until a real extraction counts the real corpus, do NOT plan from "1,800 / 90 / 90", and do not call any duplicate-code percentage ("85 %") a fact: no file or hash comparison produced it.
* `AdultVocabularyEntry`, `AdultGrammarUnit`, `AdultLesson`, `AdultExercise` and `AdultContentPack` (`lib/learn/products/content.ts`) are TARGET contracts for the one shared engine, checked by `validateContentPack`. Importing legacy content means writing an extractor against the real corpus first.

## Migration of the hard-coded references (categories in order of risk; nothing is rewritten yet)
| category | what it is | migration |
|---|---|---|
| CANONICAL_METADATA | canonical link, og:url | emitted per host by the new app from the target registry (`study.<slug>.life.help`); during the transition the legacy host serves a canonical pointing at the new host |
| MANIFEST_PWA | start_url, scope, id | new manifest per target host; the PWA identity changes with the host, so users reinstall: plan a notice |
| SERVICE_WORKER | cache names, scope, absolute origins | the legacy worker is replaced by one that unregisters itself and redirects; never keep two scopes alive |
| UI_LINK | links between legacy hosts | resolved through the registry; an unknown target is a 404, never a fallback |
| API_CONFIG | build constants, storage keys (`viet_mobile_locale`, `target_study_progress_*`) | storage keys are read once for an opt-in import into the account progress, then retired |
| STATIC_TEXT | README / sample text | rewritten together with the content, not migrated |

## Host transition
Legacy host -> `study.<slug>.life.help` (registry `legacyHosts`, exact names, no wildcard) with a permanent redirect (301) and a canonical on the new host only AFTER the new host serves the full product; before that, no redirect (a redirect to an empty product is worse than the old site). Certificates: two-label hosts need per-host certificates (see adult-study-architecture.md). No DNS or route change is part of this work.
