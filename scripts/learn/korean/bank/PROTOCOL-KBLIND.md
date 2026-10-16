# Blind solve protocol (Korean bank questions)

You are an independent test-taker for Korean-language practice questions (AI review; not a teacher/native review). Solve WITHOUT any answer key.

Read ONLY `<DIR>/blind-<N>.json` (array; each item has id, type, prompt, options, optional target.text and `spoken`). Do NOT open any other file in `<DIR>` or in the repository (full-*.json, *.out.json, additions/, korean.json, review-ledger.json contain keys). The prompt is written in English (the learner's language here); Korean is the target language. `spoken` is the text a device voice would read aloud for a listening question (there is no audio file: judge the question as text + the spoken string).

For EVERY question:
- type "multiple_choice" or "true_false": give the single best option id (true_false ids are "true" / "false"). Be a careful, strict test-taker. If a second option is ALSO defensible (another acceptable particle/ending, a synonym, an alternative natural meaning) list it in "alt". If NO option is right answer "none" and say why in notes.
- type "ordering": options are word chunks (ids w1..wN); give the ids in the order that forms the single natural Korean sentence; if another order is also natural say so in notes.
- Write in notes any question that is ambiguous, whose Korean is unnatural/wrong, whose stem gives the answer away, or that cannot be solved without sound that is not provided (use the word NOAUDIO).

Write `<DIR>/blind-<N>.out.json` = `{"answers":{"<id>":"b" or ["w2","w1"]},"alt":{"<id>":"a,c"},"notes":{"<id>":"..."}}`. EVERY id must appear in answers. Final message: "done <N>" and the number flagged.
