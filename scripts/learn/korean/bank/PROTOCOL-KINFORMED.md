# Informed review protocol (Korean bank supplementary entries)

You review Korean practice questions written by another AI for a Korean-learning app (AI review only; not teacher/native). Read `<DIR>/full-<N>.json` = {batch, packet, questions[] (id, skillId, difficulty, prompt, options, answer key, hints[2], explanation, target, spoken), items{<8-hex item id>: {packet, skill, entry}}} (entry = the authored pool entry: ko, g, cloze, choose, order, read, grade, area, std ...). Question ids are `kb-<skill>-<itemId>-<form>`: forms meaning / toko / listen / tf / cloze / choose / order / passage / read. NOTE: the distractors of meaning/toko/listen/tf are drawn automatically from other items of the same skill, so check each question for a second defensible option (a distractor gloss that is also a correct meaning, a distractor sentence that is also a correct answer, a listening distractor identical in sound).
Also read the grade criteria `/tmp/claude-0/-home-user-life-help/a87be4d3-bc0f-588b-a37f-463c13f095d4/scratchpad/kcurr/standards-tables.txt` (한국어 표준 교육과정 별책1 Tables 2-6) for the grade check.

Check EVERY question:
1. Exactly one defensible answer; the key is right; distractors really wrong. Korean particles/endings/spacing correct and natural; register consistent; English glosses correct and natural.
2. Hint 1 must not give the answer; the explanation must be true and consistent. 
3. Answer-leak cues: the key stands out by length/form; a stem/option revealing the answer of another question of the same batch.
4. cloze: the blank forces ONE form; choose: exactly one correct sentence; order: exactly one natural order (Korean word order is flexible: if another order is equally natural the item must lose its `order` or be fixed) — an order item is reading/grammar practice, not free writing.
5. passage: the true statement is supported by the text and the three false ones are contradicted/unsupported; the statement is not a verbatim copy of a whole sentence; dialogue labelled correctly. A question that can be answered without reading the passage is a defect.
6. Level/grade: is `entry.grade` justified by the official criteria for the area (cite table + number, e.g. 읽기5-3)? A "6급" item must need a 6급 TASK (expert/academic text, implied meaning, argument evaluation, professional formal discourse), not just hard vocabulary. Give your own grade judgement per ITEM.
7. Safe content; no real persons/brands; nothing that claims speaking or writing performance is assessed.

Write ONE JSON file with the Write tool: `<DIR>/review-<N>.out.json` =
`{"verdicts":{"<EVERY question id>":"ok"|"defect"},"defects":[{"id","severity":"blocker|major|minor","problem","fix"}],"patches":[{"item":"<8-hex item id>","op":"set"|"drop","set":{<authored fields to replace, e.g. ko, g, cloze, choose, order, read, grade, area, std>},"why","severity"}],"grades":{"<8-hex item id>":{"grade":1-6,"agree":true|false,"std":"읽기3-2","note":"short reason"}}}`.
EVERY item of the batch needs an entry in `grades`. Every defect must be covered by a patch OR explained as not fixable at item level. Use op "drop" only if it cannot be fixed. To remove only the order form set `"order": null`. Changing `ko` changes the item id: say so in why. Final message: counts of verdicts/defects/patches and grade agreement.
