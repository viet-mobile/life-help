import json
import random

def make_q(grade, skill, idx, prompt, correct, distractors, difficulty, hints, explanation, expected_seconds=30):
    letters = ['a', 'b', 'c', 'd']
    pos = (idx - 1) % 4
    correct_letter = letters[pos]
    options = []
    d_idx = 0
    for i in range(4):
        if i == pos:
            options.append({"id": letters[i], "text": correct})
        else:
            options.append({"id": letters[i], "text": distractors[d_idx]})
            d_idx += 1
    slug = skill.replace('.', '-')
    return {
        "id": f"bk-en-{grade.lower()}-{slug}-{str(idx).zfill(3)}",
        "site": "english",
        "skillId": skill,
        "type": "multiple_choice",
        "difficulty": difficulty,
        "prompt": prompt.strip(),
        "options": options,
        "answer": {"kind": "choice", "id": correct_letter},
        "hints": [h.strip() for h in hints],
        "explanation": explanation.strip(),
        "family": f"bk-{slug}",
        "role": "variant",
        "expectedSeconds": expected_seconds,
        "tags": ["bank", "practice", grade.lower()],
        "status": "PUBLISHED"
    }

def build_questions_for_skill(grade, skill, items):
    # items is a list of 111 tuples: (prompt, correct, [d1, d2, d3], difficulty, explanation, [h1, h2])
    assert len(items) == 111, f"Skill {skill} has {len(items)} items, expected 111"
    qs = []
    for idx, (p, c, dists, diff, expl, hints) in enumerate(items, start=1):
        qs.append(make_q(grade, skill, idx, p, c, dists, diff, hints, expl))
    return qs
