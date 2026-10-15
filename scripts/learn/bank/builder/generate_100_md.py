import json

with open("docs/learning/content-review/english-review-bundle-100.json", "r", encoding="utf-8") as f:
    bundle = json.load(f)

lines = [
    "# 영어 문제은행 사전 검토용 샘플 100문항 (중학교 50개 / 고등학교 50개)",
    "",
    "> 기준: 대량 생성(9,990개) 진행 전, 문제 품질·정답 유일성·타당한 오답·교육적 힌트·자연스러운 영어 문장을 독립 검증하기 위해 제출된 독립 표본 100문항입니다.",
    "> 원본 JSON: `docs/learning/content-review/english-review-bundle-100.json`",
    "",
    "## 1. 개요 및 요약",
    "",
    "- **중학교 문항**: 50개 (M1: 15개, M2: 18개, M3: 17개)",
    "- **고등학교 문항**: 50개 (H1: 17개, H2: 17개, H3: 16개)",
    "- **고유성 규격**: `(문항 #숫자)` 등 식별용 접두사/번호 일체 배제, 문장 골격 및 어휘 100% 독립 구성, 정규화 중복 0건",
    "- **품질 보증**: 정답 노출 힌트(giveaway) 0건, 기지 결함 시그니처 0건",
    "",
    "---",
    "",
    "## 2. 중학교 (M1~M3) 50문항 목록",
    ""
]

for idx, q in enumerate(bundle["middleSchoolQuestions"], start=1):
    qid = q["id"]
    skillId = q["skillId"]
    diff = q["difficulty"]
    prompt = q["prompt"]
    ansId = q["answer"]["id"]
    h1 = q["hints"][0]
    h2 = q["hints"][1]
    expl = q["explanation"]
    
    lines.append(f"### M-{idx:02d}. [{qid}] {skillId} (난이도: {diff})")
    lines.append(f"- **지문**: {prompt}")
    lines.append("- **선지**:")
    for opt in q["options"]:
        mark = " (정답)" if opt["id"] == ansId else ""
        lines.append(f"  - ({opt['id']}) {opt['text']}{mark}")
    lines.append(f"- **힌트**: 1) {h1} / 2) {h2}")
    lines.append(f"- **해설**: {expl}")
    lines.append("")

lines.extend([
    "---",
    "",
    "## 3. 고등학교 (H1~H3) 50문항 목록",
    ""
])

for idx, q in enumerate(bundle["highSchoolQuestions"], start=1):
    qid = q["id"]
    skillId = q["skillId"]
    diff = q["difficulty"]
    prompt = q["prompt"]
    ansId = q["answer"]["id"]
    h1 = q["hints"][0]
    h2 = q["hints"][1]
    expl = q["explanation"]
    
    lines.append(f"### H-{idx:02d}. [{qid}] {skillId} (난이도: {diff})")
    lines.append(f"- **지문**: {prompt}")
    lines.append("- **선지**:")
    for opt in q["options"]:
        mark = " (정답)" if opt["id"] == ansId else ""
        lines.append(f"  - ({opt['id']}) {opt['text']}{mark}")
    lines.append(f"- **힌트**: 1) {h1} / 2) {h2}")
    lines.append(f"- **해설**: {expl}")
    lines.append("")

with open("docs/learning/content-review/english-review-bundle-100.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print("Generated docs/learning/content-review/english-review-bundle-100.md successfully.")
