# Informed review protocol (independent reviewer, NOT the author)

You review AI-written English practice questions for Korean students (AI review only: this is not a teacher or native-speaker review). Review batch `<N>` thoroughly and propose concrete fixes.

Read: `<DIR>/full-<N>.json` = {batch, packet, questions[] (id, skillId, difficulty, prompt, options, answer key, hints[2], explanation, tags), items{<8-hex item id>: {packet, skill, item}}}. `items` are the authoring (pool) items the questions are generated from (question id = `eb-<itemId>-<form>`). Also read `scripts/learn/english-bank/SPEC.md` (quality rules and item formats: kinds w, s, r, d, m) first.

Check EVERY question:
1. Exactly one defensible correct answer and the key is right (re-solve it yourself); every distractor really wrong (synonyms, alternative natural phrasings, US/UK variants, a second reading of the passage or blank).
2. Natural, correct English (spelling, punctuation). Korean instructions/hints/explanations natural, correct, consistent with the key; hint 1 must not give the answer away; explanation must not contradict the answer; Korean particles (은/는, 이/가, 을/를, 으로/로) correct.
3. Level fit for the skill/level (E1-E2 = very basic extension; E3-E4 grade 3-4; E5-E6 grade 5-6; M middle school; H high school); no above-level content.
4. Answer-leak cues: the key uniquely longest/shortest or more specific than the distractors; options differing only by absolute words (always/never/only); the same position pattern. A cue is fixed by making the distractors as specific and plausible as the key — never by trimming or padding the key to a target length; a key that is the longest because the correct idea needs more words is not a defect.
5. Reading/dialogue: each question needs the text and tests a different ability (detail, inference, vocabulary in context, reference, purpose/tone, main idea, structure/insertion); questions must not reveal each other; sentence numbers cited in stems/explanations must be right; facts not wrong or invented about real people/places.
6. Nothing unsuitable for students. Near-duplicates inside the batch (same frame, other words) beyond a few.
Be strict but flag only REAL defects (no taste). Do not assume correctness: the author is an AI. Verify counts (e.g. "fourth sentence") by actually counting.

Write ONE JSON file with the Write tool to `<DIR>/review-<N>.out.json`:
`{"verdicts": {"<EVERY question id>": "ok"|"defect"}, "defects": [{"id","severity":"blocker|major|minor","problem","fix"}], "patches": [{"item":"<8-hex item id>","op":"set"|"drop","set":{...whole fields...},"why","severity"}]}`
A patch fixes the AUTHORING item (all its questions at once). op "set" replaces the listed fields of that pool item (kind m: {q,o,a,why}; kind s: {good,bad,cz,rule,ord}; kind w: {z,syn,sp,ex,exko,ko}; kind r/d: {qs:[...whole new qs array...]} and/or {text}); op "drop" only if it cannot be fixed. Changing an identity field (m: q/o; w: en; s: good; r/d: title) is allowed but say so in why. Every defect must be covered by a patch OR explained in `defects` as not fixable at item level. For length cues, lengthen the distractors (keep them specific and clearly wrong) rather than shortening the key to nonsense. Do not edit repository files. Final message: "done <N>" plus counts ok/defect/patches.
