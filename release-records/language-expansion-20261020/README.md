# Language and country expansion candidate

This candidate adds seven genuine UI dictionaries and localized math-motion packs, retires Sango from active selectors, migrates legacy Sango preferences/URLs to French, defaults Central African Republic to French, and defines Congo as Republic of the Congo (CG). It preserves Singapore (SG), existing countries, IDs, answers and progress.

Seven newly added countries have explicit manual region entry rather than invented address lists. Country-domain changes are additive and planned, not applied. Existing 58 countries plus seven additions make 65 entries; pre-existing Kenya and Argentina are preserved.

The release is NOT deployed. The normal content-asset gate correctly rejects missing new-locale general-learning overlays. No English data has been copied under a different language name, and the gate is not weakened. The user selected complete general and thinking translation before release. English fallback is prohibited for the seven new locales. UI translation does not mean all question banks are translated.

Typecheck and 30 focused unit tests pass. These focused tests deliberately do not claim the full release gate: the standard full-suite global setup fails at `missing overlay pcm/math`. Full build, staging gate and production rollout remain unexecuted for this candidate. Production remains `eea593a1-cc8b-4b60-a683-ebd9c88179a3`.

Math-motion coverage is 455 video concepts and 828 strings per active locale (53 locales,43,884 values). Source provenance is frozen; separate active-locales configuration retires sg without rewriting historical inputs. AI translations and structural parity are not native/teacher semantic approval.

Durable source work: `/Users/juboklee/life-project/language-expansion-20261020` and `/Users/juboklee/life-project/learning-lab/math-video-library-20261020`. Domain plan is `add-country-domains.cjs`; its default does not mutate remote configuration.

Incremental general-content work is stored under `content/learn-translation-work/`, outside runtime overlays. Base-bank patches have hash-bound independent AI rechecks; unresolved source and terminology findings remain held. 5,500 authored math-course strings are not 4,300 completed questions. Native thinking chrome now includes grade, area, level, cadence and boss messages in all seven added languages. First-task translations have independent AI review and bounded rechecks of 14 wording changes. One task per locale is connected; this does not establish complete thinking coverage or native/teacher approval.

All nine thinking unit-test files pass (71 tests) under an isolated configuration. The standard suite remains blocked by missing new-locale general overlays. Source-wide thinking coverage fails intentionally: one translated task per locale out of 1,867 authored source tasks, including drafts. This denominator is not a count of approved or served tasks.
