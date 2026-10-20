# Language and country expansion candidate

This candidate adds seven genuine UI dictionaries and localized math-motion packs, retires Sango from active selectors, migrates legacy Sango preferences/URLs to French, defaults Central African Republic to French, and defines Congo as Republic of the Congo (CG). It preserves Singapore (SG), existing countries, IDs, answers and progress.

Seven newly added countries have explicit manual region entry rather than invented address lists. Country-domain changes are additive and planned, not applied. Existing 58 countries plus seven additions make 65 entries; pre-existing Kenya and Argentina are preserved.

The release is NOT deployed. The normal content-asset gate correctly rejects missing new-locale general-learning overlays. No English data has been copied under a different language name, and the gate is not weakened. A product decision about explicitly disclosed English learning fallback versus completing native learning content remains pending. UI translation does not mean all question banks are translated.

Typecheck and 23 focused unit tests pass. These focused tests deliberately do not claim the full release gate: the standard full-suite global setup fails at `missing overlay pcm/math`. Full build, staging gate and production rollout remain unexecuted for this candidate. Production remains `eea593a1-cc8b-4b60-a683-ebd9c88179a3`.

Math-motion coverage is 455 video concepts and 828 strings per active locale (53 locales,43,884 values). Source provenance is frozen; separate active-locales configuration retires sg without rewriting historical inputs. AI translations and structural parity are not native/teacher semantic approval.

Durable source work: `/Users/juboklee/life-project/language-expansion-20261020` and `/Users/juboklee/life-project/learning-lab/math-video-library-20261020`. Domain plan is `add-country-domains.cjs`; its default does not mutate remote configuration.
