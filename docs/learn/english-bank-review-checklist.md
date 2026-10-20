# Review checklist for translated dialogue questions (q:/why:) - derived from the 2026-10-20 failures

Input every reviewer must get: passage, English question, Korean explanation, translated question and explanation, source/translation hashes. Output per item: verdict plus evidence fields (what trQ asks, which facts of the explanation are kept, negation/tense, quotes, number, genderAssumed, naturalness, fixText). A bare "ok" is not a review.

## String-checkable (scripts/learn/english-bank/qwhy-lint.ts, run by merge-qwhy; regressions in tests/learn/fixtures/qwhy-regressions.json)
- Hangul left, empty value, quoted English changed, English phrase changed, digits lost (merge-qwhy).
- A head-count word the source does not carry (ja 二人, en "both/two people", vi "hai người", ar dual words): flagged `count-added`.
- A gendered pronoun in the translation that the English question does not license (explanations: always flagged): `gender-added`. Acknowledge only with a written reason in docs/learn/english-bank-lint-ack.json.

## Needs a reader of the passage (semantic)
- Number: who "they" is (count it from the passage: Jun + brother + Sora = three, not two), one vs many objects (a big kite, not kites). Arabic dual/plural/singular and verb agreement are not string-checkable.
- Gender: a named person's gender is NOT a fact of the passage unless a pronoun/title says so. Languages that force gender in verbs (ar) must avoid committing, e.g. reuse the name or restructure; otherwise hold the item (kit-hold.json), do not convert the hold into a permanent discard. Grammatical gender is a language fact; the passage's facts are only what it states.
- Blank marker and sentence form of "X means ..." questions; reason in the explanation equals the reason that makes the key right; no hint added.

## What went wrong in the first pilot-8 review (record, not an excuse)
The review file held 32 bare "ok" with no per-item evidence and the reviewer was never given the passage, so number and gender could not be checked; the translators had not seen the passage either. Fixed by: passage in every packet, evidence fields, a second pass on every changed item, lint for what can be checked by string.
