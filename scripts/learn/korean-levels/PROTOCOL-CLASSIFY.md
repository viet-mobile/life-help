# Protocol: classify Korean skills against the official 6-grade standards (AI classification, independent pass)

Inputs (read only these):
- Standards: the official 한국어 표준 교육과정 별책1 (문화체육관광부고시 제2020-54호), tables 2-6, extracted at DIR/standards-tables.txt. Grade = 급 1..6. Each skill area (듣기, 말하기, 읽기, 쓰기) has 5 numbered 성취기준 per grade.
- DIR/chunk-<N>.json: array of Korean learning skills (course K1..K10, lesson concept/example, bank item kinds and samples, hand-written questions).

Task, for EVERY skill in the chunk:
1. Decide which official grade (1..6) the CONTENT AND TASK DEMAND best match. Judge from the lesson concept, the real item samples and the question demands, not from the course number (K7-K10 are NOT automatically grade 5/6; do not assume K-number = 급, and do not assume any TOPIK relation).
2. List which of the four skill areas (듣기/말하기/읽기/쓰기) the app questions can actually exercise, given the item kinds (multiple choice, ordering, true/false, listening-by-TTS, etc.). Recognising an expression in a multiple-choice item is NOT speaking or writing performance; report it as reading/listening recognition only.
3. Cite the specific 성취기준 numbers that support the grade, e.g. "읽기3-1, 듣기3-2". If the content fits no standard (e.g. pure Hangul letter/sound knowledge below grade 1 items), say "pre-1급 / 문자·발음" and cite 읽기1-5 or 쓰기1-5 where relevant.
4. Give a confidence (high/medium/low) and one line of evidence taken from the lesson or items.
5. If the skill spans two grades (e.g. a lesson mixes 2급 and 3급 grammar), give primary and secondary grade.

Output: write DIR/classify-<N>-<who>.out.json (who = A or B) as
{"chunk":N,"who":"A","results":[{"skillId":"...","course":"K7","primaryGrade":3,"secondaryGrade":null,"areas":["읽기","듣기"],"standards":["읽기3-1","듣기3-2"],"confidence":"medium","evidence":"..."}]}
One result per skill, no skill skipped. Write the file with a script if it is large, then verify that every skillId in the chunk is present exactly once. Do not read any other repository file. Do not edit the repository. Reply with the count and the number of low-confidence items.
