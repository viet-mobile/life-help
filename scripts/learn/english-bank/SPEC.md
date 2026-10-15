# English practice bank: authoring spec (DRAFT, unpublished)

The English bank is rebuilt from scratch. The earlier discrete bank claimed 4,345 questions but held about 128 distinct ones (prompt+answer) — it is NOT used. Target: at least 12,000 questions, each of elementary (E1~E6), middle (M1~M3) and high (H1~H3) at least 3,330, the rest by curriculum gaps. IDs, option order, hints or explanations that differ do not make a new question; a re-tagged copy under another skill is a duplicate too.

Counting classes (reported separately): **learning items** (distinct words / sentences / passages / dialogues / standalone questions); **format variants** (the same item asked another way: meaning→word, word→meaning, cloze, spelling, sentence choice, ordering, per-passage questions); **substitution variants** (the same frame with other words) — keep these rare (tag `"sub":true`, capped at 5% of a skill).

## Files you write
One JSON file per packet: `scripts/learn/english-bank/pools/<packetId>.json` = `{ "packet": "<packetId>", "skill": "<skill id>", "items": [ ... ] }`. Nothing else. The builder validates, de-duplicates and expands; read `build.mjs` for the exact rules.

## Item kinds
Common optional fields: `std` (array of OFFICIAL standard codes from your brief, only if the item really practises it — a main-idea code only if a question really asks for the main idea), `d` (difficulty 1..5 inside the level; default 3 = typical for the level), `note` (a short Korean note for the explanation). For `s` items add an optional `hint` (one short Korean sentence that guides without naming the answer form); `rule` is shown ONLY in the explanation, never as a hint.

1. **Vocabulary `w`** (builds 3-4 questions)
   `{ "k":"w", "en":"apple", "pos":"n", "ko":"사과", "ex":"I eat an apple every day.", "exko":"나는 매일 사과를 먹어요.", "z":["pear","grape","milk"], "syn":[], "sp":["appel","aple","appple"] }`
   - `pos`: n v adj adv prep conj pron det interj phr. `ko`: the Korean meaning (one natural gloss, no parentheses). `ex` contains `en` as a whole word (exact spelling) in a natural sentence at the level. `z`: exactly 3 English words that do NOT fit the blank of `ex` (wrong in meaning or grammar) but are the same part of speech. `syn`: other English words that would also be correct meanings (so the builder never offers them as distractors). `sp` (optional, 3 plausible misspellings) adds a spelling question.
   - Forms: en→ko (distractor meanings come from other items of the same pos), ko→en, cloze, spelling.
2. **Sentence / grammar `s`** (builds 3 questions)
   `{ "k":"s", "good":"She goes to school.", "ko":"그녀는 학교에 가요.", "bad":["She go to school.","She goes to schools.","She going to school."], "cz":{"st":"She ___ to school.","ok":"goes","wr":["go","going","gone"]}, "rule":"주어가 3인칭 단수이면 동사에 -s를 붙여요." }`
   - `bad`: 3 sentences that are definitely wrong (grammar/usage), each different from `good` and from each other. `cz.st` has one `___`; filling `ok` gives exactly `good`; `wr`: 3 forms that make the sentence wrong. `rule`: Korean grammar note (what is tested, why). Optional `"ord":false` when the word order of `good` is not unique (the ordering question is then not built).
   - Forms: choose the correct sentence, cloze, word ordering (from `good`).
3. **Reading `r`** (authored questions, 4-6 per passage) and **dialogue `d`** (same, lines "A: ...\nB: ...")
   `{ "k":"r", "title":"My Cat", "text":"...", "ko":"(optional Korean translation)", "qs":[ { "q":"What is the passage mainly about?", "o":["...","...","...","..."], "a":1, "why":"..." } ] }`
   - Passages are original, level-appropriate, 25-60 words (E3-E4), 50-90 (E5-E6), 80-150 (M), 120-250 (H); a dialogue has 6-12 lines. Each question tests a different aspect (main idea, detail, inference, vocabulary in context, reference, purpose/tone, order, true/false statement); exactly one option is correct (`a` = index 0-3); wrong options are plausible but clearly wrong given the text; no question can be answered without reading the text; no two questions give each other's answer away; the question text is English for M/H and may be Korean or English at E (keep a single language per passage).
4. **Standalone `m`** (one question)
   `{ "k":"m", "q":"Which word begins with the sound /b/?", "o":["cat","bat","sun","dog"], "a":1, "why":"...", "cat":"phonics" }` — for phonics, letters, punctuation, word order, functions, collocations, idioms, etc. Exactly one correct option; `q` may be Korean (instructions to the learner) with English content.

## Quality rules (checked by an independent reviewer)
1. Exactly ONE defensible correct answer: check every distractor really is wrong (a synonym, an alternative natural phrasing, a variety difference (US/UK) or a context-dependent reading can make it right).
2. Natural, correct English with correct spelling and punctuation; Korean glosses and notes in natural, correct Korean; explanations true for the item.
3. Level fit: vocabulary and grammar belong to the named level of the 2022 Korean curriculum (E1-E2 very basic, E3-E4 = grades 3-4 band, E5-E6 = grades 5-6 band, M1-M3, H1-H3); do not use content of a higher level; do not repeat the same sentence frame with other words.
4. No answer leak: the stem/option wording must not give the answer away; no option is longer/more detailed just because it is correct; correct answers must not always be the same position or length.
5. Only the target language of the site is English; instructions for the learner are Korean (canonical) — never write other languages. No real persons, brands, politics, religion, violence, romance, or anything unsuitable for children/students.
6. Items for the same skill must differ in concept, context and difficulty; vary topics (school, family, food, hobbies, travel, nature, technology, health, society, culture), names and sentence types.
7. Count: write exactly the number of items asked; do not pad with near-duplicates.

## Lessons from the pilot review (mandatory for every packet)
1. A distractor must be wrong for every reading: test each against synonyms, alternative natural phrasings, US/UK variants (collective nouns with plural verbs, `have/has got`, `haven't`), two connectives that both fit, "since X" ambiguity about whether the first event counts.
2. Spelling distractors (`sp`) are misspellings of THIS word: never real words or inflections (ran, rite, hose), never pasted from another item. `z` words must be wrong in meaning AND grammar in the blank, including odd readings.
3. Do not teach above the level (E1-E2: words, a/an, this/that, simple plurals, imperatives; third-person -s, 3인칭 단수, There is/are belong to E3-E4 or later). Examples: 3-6 words at E2. Every item has its own context sentence; gloss and example must show the same sense.
4. Never make a generic stem (e.g. "Which sentence is correct?") for several `m` items without the blank/content in the stem; ids come from the content and must differ.
5. Vary the position AND the LENGTH of the correct option. In reading/standalone questions the correct option must be the longest in at most ~35% of the questions: make distractors as long and specific as the key, and keep keys short; never let the key be the only detailed option.
6. Passage questions must not reveal each other and each must need the text; cover different aspects (detail, inference, vocabulary in context, reference, purpose/tone, main idea) and tag `std` honestly.
7. Minimum passage length (words): E3-E4 25, E5-E6 40, M 60, H1 70, H2 90, H3 110; keep a single language for explanations (Korean). Vary genres and topics (family, food, body, places, weather, school, hobbies, travel, nature, technology, health, society, culture); do not make a whole packet about one narrow topic or one text type.
8. Repetition: at most a handful of sentence items may share one frame ("has/have + irregular participle" etc.); tag any substitution drill `"sub":true`; practise one contrast (been/gone, since/for...) through different contexts and formats a few times, not 5-20 re-skins. No standalone `m` item may merely restate a vocabulary item's own question.
9. Do not invent facts about real places/people; no controversial content.
