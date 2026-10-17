#!/usr/bin/env python3
"""Maps every existing task ID to at most ONE of the 117 allocation cells (docs/think-pilot/expansion-1170/ALLOCATION.md) and prints the fill table.
  python3 scripts/think/map-cells.py <all-meta.json> [--write docs/think-pilot/expansion-1170/mapping.json]
all-meta.json: [{id, subject, grade, topic, title, ...}] dumped from the task loaders. A task is counted once, in the first cell that still has room (cap 10).
Unclassifiable or surplus tasks are listed as "unassigned"; they stay in the bank but are not counted toward the 1,170 target."""
import json, re, sys, collections
meta = json.load(open(sys.argv[1]))
alloc = [l.split("|")[1:5] for l in open("docs/think-pilot/expansion-1170/ALLOCATION.md", encoding="utf8") if l.startswith("| math") or l.startswith("| english") or l.startswith("| korean")]
cells = [f"{a[0].strip()}|{a[1].strip()}|{a[2].strip()}" for a in alloc]
assert len(cells) == 117, len(cells)
CAP = 10

def has(s, words): return any(w in s for w in words)
def e_cell(topic):
    if has(topic, ["자료", "그래프", "평균", "가능성"]): return "data"
    if has(topic, ["규칙", "대응", "비와", "비례"]): return "relation"
    if has(topic, ["모양", "길이", "시각", "시간", "원", "도형", "각도", "삼각형", "다각형", "들이", "무게", "직육면체", "쌓기나무", "넓이", "부피"]): return "space"
    return "number"
def m_cell(topic):
    if topic.startswith("자료와 가능성") or has(topic, ["자료", "확률", "통계", "분산"]): return "statistics"
    if has(topic, ["좌표평면", "일차함수", "이차함수"]): return "function"
    if has(topic, ["작도", "합동", "기본 도형", "피타고라스", "삼각형·사각형", "닮음", "삼각비", "원의 성질"]): return "geometry"
    if has(topic, ["문자와 식", "일차방정식", "식의 계산", "일차부등식", "연립", "다항식", "이차방정식", "인수분해"]): return "algebra"
    return "number"
H_TOPIC = [  # high-school topic -> course/domain cell name (the grade stays the task's own)
    ("다항식", "polynomial"), ("방정식과 부등식", "equations"), ("경우의 수와 확률", "확률과 통계"), ("경우의 수(순열", "counting"), ("경우의 수", "counting"), ("행렬", "matrix"),
    ("도형의 방정식", "coordinate"), ("집합과 명제", "logic"), ("함수와 그래프", "function"),
    ("지수와 로그", "대수"), ("삼각함수", "대수"), ("수열", "대수"), ("함수의 극한", "미적분Ⅰ"), ("미분", "미적분Ⅰ"), ("적분", "미적분Ⅱ"), ("급수", "미적분Ⅱ"),
    ("확률의 곱셈", "확률과 통계"), ("정규분포", "확률과 통계"), ("확률분포", "확률과 통계"), ("통계적 추정", "확률과 통계"), ("조건부확률", "확률과 통계"), ("벡터", "기하"),
]
EL = {"EL-ai": "인공지능 수학", "EL-cul": "수학과 문화", "EL-econ": "경제 수학", "EL-job": "직무 수학", "EL-res": "수학과제 탐구", "EL-sta": "실용 통계"}
K2L = {"K1": "L1", "K2": "L2", "K3": "L2", "K4": "L3", "K5": "L3", "K6": "L4", "K7": "L4", "K8": "L5", "K9": "L5", "K10": "L6"}  # PROVISIONAL, see mapping notes

fill = collections.OrderedDict((c, []) for c in cells)
unassigned = []
def put(tid, cell):
    if cell in fill and len(fill[cell]) < CAP: fill[cell].append(tid); return True
    return False
el_seen = collections.Counter()
for t in sorted(meta, key=lambda t: t["id"]):
    g, tid, s, topic = t.get("grade"), t["id"], t["subject"], t.get("topic") or ""
    cell = None
    if s == "math" and g in EL:  # elective tasks carry no grade: spread in id order 4/3/3 over H1/H2/H3 (provisional, difficulty not verified)
        n = el_seen[g]; el_seen[g] += 1
        cell = f"math|{('H1','H2','H3')[0 if n < 4 else 1 if n < 7 else 2]}|{EL[g]}"
    elif s == "math" and g and g[0] == "E": cell = f"math|{g}|{e_cell(topic)}"
    elif s == "math" and g and g[0] == "M": cell = f"math|{g}|{m_cell(topic)}"
    elif s == "math" and g and g[0] == "H":
        dom = next((d for k, d in H_TOPIC if k in topic), None)
        cell = f"math|{g}|{dom}" if dom else None
    elif s == "english" and g: cell = f"english|{g}|language"
    elif s == "korean" and g in K2L: cell = f"korean|{K2L[g]}|communication"
    if not (cell and put(tid, cell)): unassigned.append(tid)
rows = [(c, len(v)) for c, v in fill.items()]
need = sum(CAP - n for _, n in rows)
print(f"cells {len(cells)}; mapped {sum(n for _, n in rows)}; unassigned {len(unassigned)}; new needed to reach {CAP}/cell: {need}")
for c, n in rows:
    if n < CAP: print(f"  {c}: {n} -> need {CAP - n}")
if "--write" in sys.argv:
    json.dump({"cap": CAP, "cells": {c: v for c, v in fill.items()}, "unassigned": unassigned, "note": "korean K->L and elective H1-3 spreads are provisional"}, open(sys.argv[sys.argv.index("--write") + 1], "w"), ensure_ascii=False, indent=1)
