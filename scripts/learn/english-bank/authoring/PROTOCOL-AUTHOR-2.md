# Protocol: author a "new learning goal" elementary packet (standalone m + s + w items)

Purpose: the official elementary band (E3~E6) is short of the 3,330-question goal. These packets add questions that practise GOALS AND CONTENT THE BANK DOES NOT YET HAVE (the brief lists them). They must not be rewordings, name/number swaps or option shuffles of existing questions: the existing-content file named in your brief lists what is already there — every item you write must test a different fact, word, rule, situation or function.

Read first, in this order: `scripts/learn/english-bank/SPEC.md` (item kinds `m`, `s`, `w`; quality rules; "Lessons from the pilot review" — all mandatory), your brief, the existing-content file.

Output: `scripts/learn/english-bank/pools/<packet>.json` = `{ "packet": "<packet>", "sections": [ { "skill": "<skill id>", "items": [ ... ] } ] }` (one section, your brief's skill). Look at `pools/E07-e3.json` for the exact shape of `m`, `s`, `w` items.

Hard rules (an independent reviewer who did not write the items checks every one, solving blind first):
1. Level: Korean elementary grade band named in the brief (2022 curriculum, E3-E4 = grades 3-4, E5-E6 = grades 5-6). Common vocabulary only; no grammar above the band. Original natural English; Korean in `why`/`rule`/stems is correct, natural Korean.
2. Exactly one defensible answer. Test every distractor against synonyms, alternative natural phrasings, US/UK variants and the item's own context. Plural answers / alternative word orders that are also correct are not allowed (rewrite the item).
3. Vary the position of the key (a-d), its length (the key must not be the longest in more than ~35% of your `m` items and must never be the only option with some feature), and the question type. Do not assign positions in a repeating pattern.
4. No answer leaks inside the packet: a stem or option of one item must not contain another item's key phrase (the build checks ≥4-word keys; also check by eye).
5. Each item has its own context and fact. At most 3 items of the packet may share a sentence frame; do NOT write drills like "철자가 바른 것은? (뜻: …)" or "What is the opposite of …?" more than a few times — the bank already has hundreds. Mix question types: best response in a short exchange, sign/notice/menu/schedule reading with a tiny text, picture-less description puzzles, odd-one-out, sentence completion with context, word-in-context, choose the question for a given answer, correct the mistake, order sentences of a mini-story (as `m` with options), etc.
6. Hints: every `m` item needs its own specific `hint` (a nudge about THIS question, never a generic phrase like "문제를 다시 읽어 보세요" and never repeating another item's hint). Explanations (`why`) must quote or paraphrase the key, never say "첫 번째 보기" or point to a position.
7. Content: no gender/age/relationship assumptions for unnamed speakers, no real persons/brands, politics, religion, violence, romance. Vary names, settings (school, home, shop, park, bus, zoo, kitchen, trip…) and topics.
8. Do not tag `std`.
9. Validate: `node scripts/learn/english-bank/build.mjs --only <packet> --no-write` must report no problem for your packet. Do NOT run build.mjs without `--only`/`--no-write` and do not edit any other file.

Final reply: file path, counts per kind, how many questions the packet will build, and any item you are unsure about.
