# Adult Study v1: curriculum and content-generation specification

Machine-readable form: `data/learning-study/curriculum-spec.json` (validated by `tests/learn/adult-curriculum-spec.test.ts`). This is a specification of HOW content is authored and checked, not a content plan: it promises no lesson or word counts.

* **Levels** L1..L10 on the shared ten-step scale (internal levels; no school grades; no claim to be an official CEFR/TOPIK/JLPT/HSK result). Bands (new words per lesson, cumulative vocabulary, sentence length, lesson time) are authoring guidance, uncalibrated.
* **Dimensions**: reading, listening, speaking, writing, vocabulary, grammar, practicalInformation (the engine's name for practical information use). Every level states a can-do for each.
* **One engine, six overlays**: shared `AdultContentPack`, exercise types, proficiency model, progress, entitlement. Per target, only the extension differs (ko Hangul/politeness, en irregular forms, ja hiragana/kanji list, zh simplified + toned pinyin, id affixes, vi full diacritics/register).
* **Originality**: every dialogue, passage and example is written for LIFE.HELP from a situation brief and a vocabulary/grammar list. Forbidden: legacy text, jw.org text, third-party course material or order, model rewrites of any of those.
* **Gate before publish**: `validateContentPack` + `publishProblems`; rights per `adult-study-rights-policy.md`; a native-speaker review recorded per pack. Unreviewed packs stay draft.
* **First deliverable** (when authoring starts): a pilot pack per target at levels 1-3 sized by reviewer capacity; each pack carries `provenance.rights`.
