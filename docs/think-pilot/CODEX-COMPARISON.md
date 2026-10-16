# Codex/Claude review comparison

Review-only additions to Claude source a7c1a4a659a37a486604b71d865eaa9f0e95022d:

- `/comparison/index.html`: side-by-side entry to two sets; explicitly says 9 vs 36 and limits of the comparison. Gemini has not been received.
- `/codex-thinking/index.html`: Codex’s original nine self-contained tasks, with Korean/English instructions, staged judgment/revision and self-review. Responses stay in this browser; this is not automatic quality grading.
- `/think-pilot`: Claude’s 36 tasks. Original content is preserved.
- Fixed previous-prediction text in the reveal player. Reused option ids previously displayed a label from the current stage instead of the prior stage. Actual deployed m-09 reproduced the error (a former 80–90% estimate displayed as 20%); unit and browser checks cover the correction.

Only the dedicated `life-help-think-review` Worker is deployed from this branch. It has no production/staging secrets or DB. These pilot tasks are not part of the production question-bank totals. Deployment is for review, not a claim of educational effectiveness or final adoption. The 36 Claude tasks and nine Codex tasks still require content review; the most recent pilot changes have not had teacher/native-speaker validation.
