# Protocol: author a supplementary English packet (fresh items, not copies)

You write ONE pool file of NEW learning items. Read, in this order: `scripts/learn/english-bank/SPEC.md` (item kinds, quality rules and "Lessons from the pilot review" — all mandatory), then your brief, then the existing-titles file named in the brief (do NOT write a passage on a topic/title/plot already listed there).

Output file: `scripts/learn/english-bank/pools/<packet>.json` = `{ "packet": "<packet>", "skill": "<skill id>", "items": [ ... ] }` (kinds `d` dialogue and `r` reading as the brief says; `m` only if the brief says).

Hard rules (a reviewer who did not write the items will check every one):
1. Every passage is original, natural, level-appropriate English of the stated length; every dialogue has 6-12 lines written `A: ...\nB: ...` with real turn-taking (requests, offers, invitations, directions, opinions, complaints, plans — functions of everyday interaction).
2. Each passage has the stated number of questions and each question tests a DIFFERENT ability (stated detail, inference, vocabulary in context, reference of a pronoun, purpose/tone, main idea, sequence, speaker's intention). Questions must need the text and must NOT reveal each other's answers: do not copy an answer into another question's stem or options.
3. Exactly one defensible answer per question. Test each distractor against synonyms, alternative natural phrasings and the text itself. Do not make the correct option the longest, the most detailed or the only one with a particular form; vary its position (a-d) freely; do not assign positions in a repeating pattern.
4. Do not assume the gender, age or relationship of an unnamed speaker or narrator; no real people, brands, politics, religion, violence, romance; Korean `why` explanations must be correct Korean, must not point to a position ("첫 번째 보기") and must quote or paraphrase the key.
5. Vary settings (school, home, shop, station, hospital, library, park, online, travel, workplace for H), names, and function. No two items of your file may share a plot.
6. Do not tag `std` unless your brief lists official codes.
7. Validate before you finish: `node scripts/learn/english-bank/build.mjs --only <packet> --no-write` must print no problems for your packet (it does not write any file). Fix every reported problem. Do NOT run build.mjs without `--only`/`--no-write`; do not edit any other file.

Final reply: the file path, item counts per kind, and any item you are unsure about.
