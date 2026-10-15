import json, os, sys
from scripts.learn.bank.data_e1_e2 import get_e1_e2_item
from scripts.learn.bank.data_e3_e4 import get_e3_e4_item
from scripts.learn.bank.data_e5_e6 import get_e5_e6_item
from scripts.learn.bank.data_m1_m3 import get_m1_m3_item
from scripts.learn.bank.data_h1_h3 import get_h1_h3_item

GRADE_SKILLS = {
    "E1": ["e.e1.alpha", "e.e1.greet", "e.e1.numcol", "e.e1.family", "e.e1.class"],
    "E2": ["e.e2.noun", "e.e2.verb", "e.e2.like", "e.e2.sent", "e.e2.read"],
    "E3": ["e.e3.build", "e.e3.pron", "e.e3.tense", "e.e3.routine", "e.e3.read"],
    "E4": ["e.e4.tense", "e.e4.qneg", "e.e4.adj", "e.e4.prep", "e.e4.read"],
    "E5": ["e.e5.gram", "e.e5.comp", "e.e5.future", "e.e5.transform", "e.e5.read"],
    "E6": ["e.e6.tense", "e.e6.modal", "e.e6.vocab", "e.e6.clause", "e.e6.read"],
    "M1": ["e.vocab", "e.be", "e.pres", "e.plural", "e.order"],
    "M2": ["e.m2.perf", "e.m2.pass", "e.m2.inf", "e.m2.comp", "e.m2.read"],
    "M3": ["e.m3.rel", "e.m3.cond", "e.m3.ques", "e.m3.part", "e.m3.read"],
    "H1": ["e.h1.tense", "e.h1.clause", "e.h1.partc", "e.h1.conn", "e.h1.main"],
    "H2": ["e.h2.inv", "e.h2.subj", "e.h2.wh", "e.h2.vocab", "e.h2.logic"],
    "H3": ["e.h3.par", "e.h3.tone", "e.h3.ins", "e.h3.col", "e.h3.sum"]
}

OPT_IDS = ["a", "b", "c", "d"]

def get_item(skill_id, i):
    if skill_id.startswith("e.e1.") or skill_id.startswith("e.e2."):
        return get_e1_e2_item(skill_id, i)
    elif skill_id.startswith("e.e3.") or skill_id.startswith("e.e4."):
        return get_e3_e4_item(skill_id, i)
    elif skill_id.startswith("e.e5.") or skill_id.startswith("e.e6."):
        return get_e5_e6_item(skill_id, i)
    elif skill_id.startswith("e.m") or skill_id in ["e.vocab", "e.be", "e.pres", "e.plural", "e.order"]:
        return get_m1_m3_item(skill_id, i)
    elif skill_id.startswith("e.h"):
        return get_h1_h3_item(skill_id, i)
    raise ValueError(f"Unknown skill {skill_id}")

questions = []
summaryByGrade = {}
QUESTIONS_PER_SKILL = 111

for grade, skills in GRADE_SKILLS.items():
    summaryByGrade[grade] = 0
    for skill_id in skills:
        for i in range(QUESTIONS_PER_SKILL):
            prompt, ans, dists, h1, h2, exp = get_item(skill_id, i)
            qid = f"bk-en-{grade.lower()}-{skill_id.replace('.', '-')}-{str(i + 1).zfill(3)}"

            # Deterministic option rotation
            raw_options = [ans] + dists
            rot = (i * 7 + 3) % 4
            rotated = [raw_options[(idx + rot) % 4] for idx in range(4)]
            correct_opt_id = OPT_IDS[(4 - rot) % 4]

            # Difficulty mapping
            diff = 1 + (i % 5)
            if grade in ["E1", "E2"]:
                diff = 1 + (i % 2) # 1..2
            elif grade in ["E3", "E4"]:
                diff = 2 + (i % 2) # 2..3
            elif grade in ["E5", "E6"]:
                diff = 2 + (i % 3) # 2..4
            elif grade in ["M1", "M2", "M3"]:
                diff = 2 + (i % 3) # 2..4
            else:
                diff = 3 + (i % 3) # 3..5

            questions.append({
                "id": qid,
                "site": "english",
                "skillId": skill_id,
                "type": "multiple_choice",
                "difficulty": diff,
                "prompt": prompt,
                "options": [{"id": OPT_IDS[idx], "text": rotated[idx]} for idx in range(4)],
                "answer": {"kind": "choice", "id": correct_opt_id},
                "hints": [h1, h2],
                "explanation": exp,
                "family": f"bk-{skill_id.replace('.', '-')}",
                "role": "variant",
                "expectedSeconds": 30 if grade in ["E1", "E2"] else 45 if grade in ["E3", "E4", "E5", "E6"] else 60,
                "tags": ["bank", "practice", grade.lower()],
                "status": "PUBLISHED"
            })
            summaryByGrade[grade] += 1

out_file = "lib/learn/content/bank/english.json"
payload = {
    "format": 1,
    "site": "english",
    "count": len(questions),
    "grades": summaryByGrade,
    "questions": questions
}

with open(out_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=1, ensure_ascii=False)
    f.write("\n")

print(f"Generated {len(questions)} questions across {len(GRADE_SKILLS)} grades.")
print("Summary by grade:", summaryByGrade)
