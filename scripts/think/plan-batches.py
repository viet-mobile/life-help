#!/usr/bin/env python3
"""Plans the authoring batches that close the gap between mapping.json and 10 tasks per allocation cell.
  python3 scripts/think/plan-batches.py <mapping.json> <outDir>   -> <outDir>/batches.json, <outDir>/prompt-NN.txt, <outDir>/existing-titles.json"""
import json, sys, os, collections
mp = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
meta = {t["id"]: t for t in json.load(open("/tmp/all-meta.json"))}
MATH_DOM = {"number": "수와 연산", "relation": "변화와 관계(규칙·대응·비·비례)", "space": "도형과 측정", "data": "자료와 가능성",
            "algebra": "문자와 식", "function": "함수", "geometry": "기하", "statistics": "확률과 통계"}
H_DOM = {"polynomial": "다항식", "equations": "방정식과 부등식", "counting": "경우의 수", "matrix": "행렬", "coordinate": "도형의 방정식", "logic": "집합과 명제", "function": "함수와 그래프"}
COURSE_HINT = {
 "기본수학1": "고교 기본수학1 계열(기초 수·식·방정식의 의미를 되짚는 수준; 학교 편성은 다양함)", "기본수학2": "고교 기본수학2 계열(함수·도형·자료의 기초 의미)",
 "대수": "대수(지수·로그, 삼각함수, 수열)", "미적분Ⅰ": "미적분Ⅰ(함수의 극한과 연속, 미분)", "확률과 통계": "확률과 통계(경우의 수, 확률, 통계)",
 "미적분Ⅱ": "미적분Ⅱ(수열의 극한, 여러 가지 미분법, 적분법)", "기하": "기하(이차곡선, 평면벡터, 공간도형과 공간좌표)",
 "경제 수학": "경제 수학", "인공지능 수학": "인공지능 수학", "직무 수학": "직무 수학", "실용 통계": "실용 통계", "수학과 문화": "수학과 문화", "수학과제 탐구": "수학과제 탐구(설명·탐구·설계형 활동을 반드시 포함)"}
EL_GRADE = {"경제 수학": "EL-econ", "인공지능 수학": "EL-ai", "직무 수학": "EL-job", "실용 통계": "EL-sta", "수학과 문화": "EL-cul", "수학과제 탐구": "EL-res"}
L2K = {"L1": "K1", "L2": "K3", "L3": "K5", "L4": "K7", "L5": "K9", "L6": "K10"}
LV = {"E": (1, "초등"), "M": (2, "중등"), "H": (3, "고등")}
KLV = {"L1": (1, "Beginner"), "L2": (1, "Beginner"), "L3": (2, "Intermediate"), "L4": (2, "Intermediate"), "L5": (3, "Advanced"), "L6": (3, "Advanced")}
def cell_info(cell):
    subj, g, dom = cell.split("|")
    if subj == "math":
        if dom in MATH_DOM and g[0] in "EM": desc, grade, topic_hint = MATH_DOM[dom], g, MATH_DOM[dom]
        elif dom in H_DOM: desc, grade, topic_hint = "고교 공통수학 하위 분야: " + H_DOM[dom], g, H_DOM[dom]
        else: desc, grade, topic_hint = "고교 과목: " + COURSE_HINT[dom], EL_GRADE.get(dom, g), dom
        lv, lab = LV[g[0]]
    elif subj == "english": desc, grade, lv, lab, topic_hint = "영어 " + g + (" (공식 초등 영어 교육과정 밖의 확장 영역; levelLabel을 '초등(확장)'으로)" if g in ("E1", "E2") else ""), g, *LV[g[0]], "language"
    else: desc, grade = "한국어 공식 " + g[1] + "급 수준(잠정 연결)", L2K[g]; lv, lab = KLV[g]; topic_hint = "communication"
    return dict(desc=desc, grade=grade, level=lv, levelLabel=lab, topic=topic_hint)
need = [(c, 10 - len(v)) for c, v in mp["cells"].items() if len(v) < 10]
batches, cur, cnt, key = [], [], 0, None
def grp(c):
    s, g, d = c.split("|")
    return (s, g if (s != "math" or d in MATH_DOM or d in H_DOM) else d)
for c, n in need:
    while n > 0:
        take = min(n, 10)
        if cur and (grp(c) != key or cnt + take > 14): batches.append(cur); cur, cnt = [], 0
        key = grp(c)
        cur.append([c, take]); cnt += take; n -= take
if cur: batches.append(cur)
tot = sum(n for b in batches for _, n in b); print(len(batches), "batches", tot, "tasks")
exist = collections.defaultdict(list)
for cell, ids in mp["cells"].items():
    for i in ids: exist[cell].append(f"{i}: {meta[i]['title']}")
json.dump(exist, open(f"{out}/existing-titles.json", "w"), ensure_ascii=False, indent=0)
plan = []
for k, b in enumerate(batches, 1):
    subj = b[0][0].split("|")[0]; pre = {"math": "m", "english": "e", "korean": "k"}[subj]
    lines = []
    for c, n in b:
        i = cell_info(c); lines.append(dict(cell=c, n=n, **i))
    plan.append(dict(batch=k, subject=subj, file=f"lib/think/data/extra/y-{pre}-{k:02d}.json", prefix=f"y-{pre}-{k:02d}", cells=lines))
json.dump(plan, open(f"{out}/batches.json", "w"), ensure_ascii=False, indent=1)
