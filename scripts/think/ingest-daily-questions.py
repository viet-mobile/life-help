#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-daily-questions.py
Converts daily authored questions from questions/daily/**/source_*.json
into production ThinkTask batches under lib/think/data/extra/ and their
corresponding translation overlays under lib/think/i18n/<lang>/<batchKey>.json.
"""

import os
import glob
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
BASE_QUESTIONS = ROOT.parent / "questions" / "daily"
if not BASE_QUESTIONS.exists():
    BASE_QUESTIONS = ROOT / "questions" / "daily"

EXTRA_DIR = ROOT / "lib/think/data/extra"
I18N_DIR = ROOT / "lib/think/i18n"
EXTRA_DIR.mkdir(parents=True, exist_ok=True)
I18N_DIR.mkdir(parents=True, exist_ok=True)

GRADE_TO_SCHOOL = {
    "G01": "E1", "G02": "E2", "G03": "E3", "G04": "E4", "G05": "E5", "G06": "E6",
    "G07": "M1", "G08": "M2", "G09": "M3", "G10": "H1", "G11": "H2", "G12": "H3"
}

GRADE_TO_KOREAN = {
    "G01": "K1", "G02": "K2", "G03": "K3", "G04": "K4", "G05": "K5", "G06": "K6",
    "G07": "K7", "G08": "K8", "G09": "K9", "G10": "K10", "G11": "K10", "G12": "K10"
}

def get_level(grade: str) -> tuple[int, str]:
    if grade.startswith("E") or grade in ["K1", "K2", "K3"]:
        return 1, "초등"
    elif grade.startswith("M") or grade in ["K4", "K5", "K6"]:
        return 2, "중등"
    else:
        return 3, "고등"

def clean_text(s: str) -> str:
    if not s:
        return ""
    return s.strip()

# 1. Collect all unique questions across all dates
all_source_files = sorted(glob.glob(str(BASE_QUESTIONS / "**/source_*.json"), recursive=True))
print(f"Found {len(all_source_files)} source files in {BASE_QUESTIONS}")

questions_by_id = {}
for sf in all_source_files:
    try:
        data = json.load(open(sf, "r", encoding="utf-8"))
        for item in data:
            qid = item.get("id")
            if qid and qid not in questions_by_id:
                questions_by_id[qid] = item
    except Exception as e:
        print(f"Error reading {sf}: {e}")

print(f"Loaded {len(questions_by_id)} unique daily questions.")

# 2. Also load all available translated language questions from questions/daily/<date>/<lang>/<date>.json
lang_translations = {}  # lang -> { qid: translated_dict }
for lang_dir in glob.glob(str(BASE_QUESTIONS / "*/*")):
    p = Path(lang_dir)
    if p.is_dir():
        lang = p.name
        for jf in p.glob("*.json"):
            try:
                t_list = json.load(open(jf, "r", encoding="utf-8"))
                if isinstance(t_list, list):
                    if lang not in lang_translations:
                        lang_translations[lang] = {}
                    for t_item in t_list:
                        tid = t_item.get("id")
                        if tid:
                            lang_translations[lang][tid] = t_item
            except Exception:
                pass

print(f"Loaded translations for {len(lang_translations)} languages.")

# 3. Group questions by subject
by_subject = {}
for qid, q in questions_by_id.items():
    subj = q.get("subject", "math").lower()
    if subj not in ["math", "physics", "chemistry", "english", "korean"]:
        continue
    by_subject.setdefault(subj, []).append(q)

for s, ql in by_subject.items():
    print(f"Subject '{s}': {len(ql)} questions")

# Sort questions by grade and id
for s in by_subject:
    by_subject[s].sort(key=lambda x: (x.get("grade", ""), x.get("id", "")))

# 4. Convert into ThinkTask batches (12 tasks per batch)
BATCH_PREFIXES = {
    "physics": "physics-d",
    "chemistry": "chemistry-d",
    "math": "math-d",
    "english": "english-d",
    "korean": "korean-d"
}

generated_batches = {} # batch_key -> list of ThinkTask
for subj, qlist in by_subject.items():
    prefix = BATCH_PREFIXES[subj]
    chunk_size = 12
    for i in range(0, len(qlist), chunk_size):
        chunk = qlist[i:i+chunk_size]
        batch_idx = (i // chunk_size) + 1
        batch_key = f"{prefix}{batch_idx:02d}"
        
        batch_tasks = []
        for q in chunk:
            raw_grade = q.get("grade", "G01")
            grade_code = GRADE_TO_KOREAN.get(raw_grade, "K1") if subj == "korean" else GRADE_TO_SCHOOL.get(raw_grade, "E1")
            lvl, lvl_lbl = get_level(grade_code)
            
            # Options
            raw_opts = q.get("options", ["A", "B", "C", "D"])
            options = []
            for opt_idx, opt_txt in enumerate(raw_opts):
                options.append({
                    "id": f"o{opt_idx}",
                    "text": clean_text(str(opt_txt))
                })
            
            ans_idx = q.get("answer", 0)
            if not isinstance(ans_idx, int) or ans_idx < 0 or ans_idx >= len(options):
                ans_idx = 0
            correct = [f"o{ans_idx}"]
            
            raw_hints = q.get("hints", [])
            hints = [clean_text(str(h)) for h in raw_hints if h]
            if not hints:
                hints = ["문제의 핵심 조건과 원리를 단계별로 적용해 보세요."]
                
            task = {
                "id": q["id"],
                "subject": subj,
                "grade": grade_code,
                "topic": q.get("concept", q.get("title", "")),
                "status": "reviewed-ai",
                "level": lvl,
                "levelLabel": lvl_lbl,
                "title": clean_text(q.get("title", "")),
                "uiLang": "ko",
                "format": "choose-needed-info",
                "generative": False,
                "goal": f"{q.get('title', '')}의 원리를 적용하여 주어진 조건을 분석하고 올바른 결론을 도출한다.",
                "thinking": [
                    f"{q.get('concept', '핵심 개념')} 원리 적용",
                    "주어진 조건 분석 및 논리적 추론"
                ],
                "differsFromPlain": "단순 계산이나 암기 위주 문항과 달리, 조건 간의 인과관계와 과학적/수학적 법칙을 추론하여 해결한다.",
                "prerequisites": [],
                "minutes": 8,
                "curriculum": None,
                "material": clean_text(q.get("question", "")),
                "steps": [
                    {
                        "id": "s1",
                        "kind": "choose",
                        "prompt": clean_text(q.get("question", "")),
                        "options": options,
                        "correct": correct,
                        "explain": clean_text(q.get("explanation", "")),
                        "hints": hints
                    }
                ],
                "rubric": [],
                "alternatives": [],
                "hardCases": [],
                "cautions": {"language": "", "culture": "", "accessibility": ""},
                "autoVsHuman": {"auto": ["정답 선택 일치"], "human": []}
            }
            batch_tasks.append(task)
            
        generated_batches[batch_key] = batch_tasks
        batch_file = EXTRA_DIR / f"{batch_key}.json"
        with open(batch_file, "w", encoding="utf-8") as f:
            json.dump(batch_tasks, f, ensure_ascii=False, indent=2)

print(f"Generated {len(generated_batches)} extra batches under {EXTRA_DIR}")

# 5. Generate translations for each batch in lib/think/i18n/<lang>/<batchKey>.json
# English fallback is mandatory for all tasks so non-Korean learners always see them!
# Also populate available languages (vi, zh-Hans, zh-Hant, ja, and all 86 daily langs)
CORE_THINK_LANGS = ["en", "zh-Hant", "zh-Hans", "vi", "ja"] + list(lang_translations.keys())
CORE_THINK_LANGS = sorted(list(set(CORE_THINK_LANGS)))

for lang in CORE_THINK_LANGS:
    lang_dir = I18N_DIR / lang
    lang_dir.mkdir(parents=True, exist_ok=True)
    
    for batch_key, tasks in generated_batches.items():
        overlay = {}
        for t in tasks:
            tid = t["id"]
            trans_item = lang_translations.get(lang, {}).get(tid)
            
            # If lang == 'en' or translations are missing, build clean fields
            if trans_item:
                t_title = clean_text(trans_item.get("title", t["title"]))
                t_topic = clean_text(trans_item.get("concept", t["topic"]))
                t_prompt = clean_text(trans_item.get("question", t["material"]))
                t_opts = trans_item.get("options", [])
                t_hints = trans_item.get("hints", [])
                t_exp = clean_text(trans_item.get("explanation", t["steps"][0]["explain"]))
            else:
                # English fallback formatting
                t_title = t["title"]
                t_topic = t["topic"]
                t_prompt = t["material"]
                t_opts = [o["text"] for o in t["steps"][0]["options"]]
                t_hints = t["steps"][0]["hints"]
                t_exp = t["steps"][0]["explain"]

            entry = {
                "title": t_title,
                "topic": t_topic,
                "goal": f"Apply principles of {t_title} to solve the reasoning problem.",
                "material": t_prompt,
                "steps.0.prompt": t_prompt,
                "steps.0.explain": t_exp,
            }
            for o_idx in range(len(t["steps"][0]["options"])):
                opt_text = t_opts[o_idx] if o_idx < len(t_opts) else t["steps"][0]["options"][o_idx]["text"]
                entry[f"steps.0.options.{o_idx}.text"] = clean_text(str(opt_text))
            for h_idx in range(len(t_hints)):
                entry[f"steps.0.hints.{h_idx}"] = clean_text(str(t_hints[h_idx]))
                
            overlay[tid] = entry

        out_file = lang_dir / f"{batch_key}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(overlay, f, ensure_ascii=False, indent=2)

print(f"Generated i18n overlays for {len(CORE_THINK_LANGS)} languages across all {len(generated_batches)} batches.")

