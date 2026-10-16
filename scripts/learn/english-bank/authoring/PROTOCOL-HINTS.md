# Protocol: write step-by-step hints for English practice questions

You write Korean hints (for Korean learners of English) for existing, already-reviewed questions. Read ONLY your work file `<WORK>` (JSON array of units) and write `<OUT>` (JSON object). Do not edit any repository file.

Units:
- `k:"m"` {id, skill, q, o[4], a (index of the correct option), why}: a standalone question. Output `"<id>": {"m": ["<hint 1>", "<hint 2>"]}`.
- `k:"s"` {id, good, bad[3], cz{st,ok,wr}, rule, ko}: a sentence item that becomes (a) choose-the-correct-sentence and (b) fill-the-blank questions. Output `"<id>": {"s": "<one hint>"}` — a nudge about the tested point that works for both forms.
- `k:"r"|"d"` {id, title, text, qs:{"<n>": {q, o[4], a, why}}}: a passage/dialogue with the listed questions only. Output `"<id>": {"q": {"<n>": ["<hint 1>", "<hint 2>"], ...}}` for exactly the listed n.

What a good hint is (the learner sees hint 1 first, hint 2 only if still stuck):
1. Hint 1 = the STRATEGY for THIS question: what to look at or ask yourself (the tested grammar point named in words, what kind of information the question asks for, which part of the sentence/passage matters). Hint 2 = a NARROWER pointer to the evidence: which sentence/part of the text (say "두 번째 문장", "대화의 끝부분" or describe its topic; count the sentences/lines YOURSELF carefully), or how to compare the options for this exact rule.
2. A hint must NEVER state the correct option, quote or translate the correct option (or an unmistakable part of it), reveal the answer form (e.g. "-ed를 붙여요", "복수형 -s"), or single the key out among the options (e.g. "the only option with a verb", first/last letter, length). Do not rely on a quoted word that only the key contains.
3. Hints must be true for this question: re-solve it yourself first. For passages: the evidence you point to must really contain the answer; do not call a sentence "the first" unless it is. For inference/vocabulary-in-context questions point at the context clue's location, not its meaning.
4. Each hint is one or two short natural Korean sentences (about 15–70 characters), specific to the content (mention the topic/words of THIS question), not a template. Never write generic lines such as "보기를 하나씩 확인해 보세요" or "지문을 다시 읽어 보세요".
5. Within your file no two hints may be identical; vary the wording.
Quality bar: an independent reviewer checks a sample for leaks, wrong evidence pointers and Korean errors.

Write the JSON file with the Write tool (valid JSON, every unit id present, no extra keys). Final reply: "done", the number of units and any unit you could not write a safe hint for (list ids; omit them from the file).
