# Language and country expansion candidate

This candidate adds seven genuine UI dictionaries and localized math-motion packs, retires Sango from active selectors, migrates legacy Sango preferences/URLs to French, defaults Central African Republic to French, and defines Congo as Republic of the Congo (CG). It preserves Singapore (SG), existing countries, IDs, answers and progress.

Seven newly added countries have explicit manual region entry rather than invented address lists. Country-domain changes are additive and planned, not applied. Existing 58 countries plus seven additions make 65 entries; pre-existing Kenya and Argentina are preserved.

The release is NOT deployed. The normal content-asset gate correctly rejects missing new-locale general-learning overlays. No English data has been copied under a different language name, and the gate is not weakened. The user selected complete general and thinking translation before release. English fallback is prohibited for the seven new locales. UI translation does not mean all question banks are translated.

Typecheck and 30 focused unit tests pass. These focused tests deliberately do not claim the full release gate: the standard full-suite global setup fails at `missing overlay pcm/math`. Full build, staging gate and production rollout remain unexecuted for this candidate. Production remains `eea593a1-cc8b-4b60-a683-ebd9c88179a3`.

Math-motion coverage is 455 video concepts and 828 strings per active locale (53 locales,43,884 values). Source provenance is frozen; separate active-locales configuration retires sg without rewriting historical inputs. AI translations and structural parity are not native/teacher semantic approval.

Durable source work: `/Users/juboklee/life-project/language-expansion-20261020` and `/Users/juboklee/life-project/learning-lab/math-video-library-20261020`. Domain plan is `add-country-domains.cjs`; its default does not mutate remote configuration.

Incremental general-content work is stored under `content/learn-translation-work/`, outside runtime overlays. Base-bank patches have hash-bound independent AI rechecks; unresolved source and terminology findings remain held. 8,400 authored math-course strings are not 4,300 completed questions. Native thinking chrome now includes grade, area, level, cadence and boss messages in all seven added languages. First-task translations have independent AI review and bounded rechecks of 14 wording changes. One task per locale is connected; this does not establish complete thinking coverage or native/teacher approval.

All nine thinking unit-test files pass (71 tests) under an isolated configuration. The standard suite remains blocked by missing new-locale general overlays. Source-wide thinking coverage fails intentionally: one translated task per locale out of 1,867 authored source tasks, including drafts. This denominator is not a count of approved or served tasks.

Retired Sango main messages are preserved outside the active dictionary directory under `content/retired-locales/sg/`. Staging specs now require French for Central African Republic, test all seven new-country defaults, cover the new locales, and assert legacy Sango redirects. These updated remote specs have not yet been executed for the incomplete candidate.

`npm run check:expanded-content` is now a prebuild requirement. It invokes the actual English localization and thinking completeness boundaries for the seven locales without English fallback. It currently fails, correctly, because the full corpus is not translated. Per-task coverage alone is not release permission. General course, math bank (including HS) and Korean bank completeness remain checked by the asset builder.

## English/Korean course checkpoint

English course drafts are now checkpointed with source hashes and target-vs-meaning roles; exact per-locale authored string counts are in `english-course-progress.json`. CS and HU each have all 2,454 unique reference strings assembled privately (3,076 field positions). This is authoring/structural completion, not semantic approval or runtime activation. Source defects include a duplicated “a piece of” answer construction and name-based gender inference. They remain source holds, never justified by translation.

Korean course drafts are checkpointed separately in `korean-course-progress.json`. The asset builder now requires explicit entries for every native instruction, meaning option and protected Korean target; English presentation fallback cannot disguise a missing new-locale course. Three focused node tests cover this boundary.

PCM thinking task e-01 has independent AI field review and a two-label delta recheck; English notice/evidence/models and answer mechanics are preserved. The private PCM k-01 candidate is not active: its source hint asks for a question while a model ends with a declarative suggestion. Private entity context preserves unknown genders and is excluded from student assets. Thinking unit tests: 73/73 in ten files; the full release gate remains incomplete.

English-course authoring now covers all seven locales: 2,454 unique source strings per locale (17,178 explicit entries, including preserved learning targets). Seven complete drafts are assembled under the private authoring tree, not runtime overlays. This does not complete the 14,981-question English bank or the thinking corpus. `english-course-source-holds.json` records source adjudications; independent reviews and bounded patch rechecks are saved separately. New assembly tests reject partial batches and changed Korean targets/quantities before creating output.
