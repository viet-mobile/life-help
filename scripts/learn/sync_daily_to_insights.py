#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_daily_to_insights.py
Ingests daily authored questions (110 pipeline) from questions/daily/ into:
  - lib/learn/dailyInsights/data/{math,physics,chemistry,english,korean,life}.json
  - Updates dayOfYear, month, day sequentially past 366.
  - Dynamically calculates item count in DailyInsightsCatalog.tsx instead of hardcoded 366.
"""

import os
import sys
import glob
import json
from pathlib import Path

ROOT = Path("/Users/juboklee/life-project/life-help")
INSIGHTS_DATA = ROOT / "lib/learn/dailyInsights/data"
QUESTIONS_DAILY = ROOT.parent / "questions" / "daily"
if not QUESTIONS_DAILY.exists():
    QUESTIONS_DAILY = ROOT / "questions" / "daily"

SUBJ_MAP = {
    "math": "math",
    "physics": "physics",
    "chemistry": "chemistry",
    "english": "english",
    "korean": "korean",
    "life": "life"
}

def clean(text):
    return (text or "").strip()

def run():
    print("=== Step 1: Loading all authored questions from questions/daily/ ===")
    all_sources = sorted(glob.glob(str(QUESTIONS_DAILY / "**/source_*.json"), recursive=True))
    all_source_110 = [s for s in all_sources if "source_110.json" in s]
    if not all_source_110:
        all_source_110 = all_sources

    print(f"Found {len(all_source_110)} source files.")
    
    # Collect unique questions by id
    by_subject = {s: [] for s in SUBJ_MAP}
    seen_ids = set()
    
    for sf in all_source_110:
        try:
            items = json.load(open(sf, "r", encoding="utf-8"))
            for item in items:
                qid = item.get("id")
                subj = item.get("subject", "").lower()
                if qid and qid not in seen_ids and subj in by_subject:
                    seen_ids.add(qid)
                    by_subject[subj].append(item)
        except Exception as e:
            print(f"Error loading {sf}: {e}")

    for s, ql in by_subject.items():
        print(f"Subject '{s}': {len(ql)} unique daily questions to integrate")

    print("\n=== Step 2: Appending to dailyInsights data files ===")
    for subj in SUBJ_MAP:
        data_file = INSIGHTS_DATA / f"{subj}.json"
        existing_data = json.load(open(data_file, "r", encoding="utf-8"))
        existing_ids = {x["id"] for x in existing_data}
        
        # Base count before daily additions
        base_items = [x for x in existing_data if not str(x["id"]).startswith("202611")]
        
        current_list = list(existing_data)
        added_count = 0
        
        # Sort questions by date/id
        q_list = sorted(by_subject[subj], key=lambda x: x.get("id", ""))
        
        for q in q_list:
            qid = q.get("id")
            if qid in existing_ids:
                continue
                
            cur_idx = len(current_list)
            day_num = cur_idx + 1
            # Month/Day calculation past 366 (cycles through 1..12 and 1..28)
            month = ((cur_idx % 12) + 1)
            day = ((cur_idx % 28) + 1)
            
            title = clean(q.get("title", f"{subj.capitalize()} 탐구"))
            prompt = clean(q.get("question", ""))
            expl = clean(q.get("explanation", ""))
            hints = q.get("hints", [])
            hint_str = hints[0] if hints else expl
            
            # Form clean DailyInsight object
            insight_obj = {
                "id": qid,
                "category": "problem",
                "title": title,
                "summary": prompt,
                "principle": expl if expl else f"{title}의 핵심 원리 적용",
                "example": f"주요 힌트: {hint_str}",
                "actionItem": f"탐구 문제를 풀고 {title}의 원리를 일상과 연계해 보세요.",
            }
            
            current_list.append(insight_obj)
            existing_ids.add(qid)
            added_count += 1
            
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump(current_list, f, ensure_ascii=False, separators=(',', ':'))
            
        print(f"Updated {subj}.json: {len(existing_data)} -> {len(current_list)} items (+{added_count})")

    print("\n=== Step 3: Updating DailyInsightsCatalog.tsx to dynamically use actual domain lengths ===")
    catalog_tsx = ROOT / "components/insights/DailyInsightsCatalog.tsx"
    code = open(catalog_tsx, "r", encoding="utf-8").read()
    
    # 1. Update totalCount calculation
    # const totalCount = selectedDomain === "life" ? 569 : 366; -> const totalCount = INSIGHT_MAP[selectedDomain]?.length || 366;
    code = code.replace(
        'const totalCount = selectedDomain === "life" ? 569 : 366;',
        'const totalCount = INSIGHT_MAP[selectedDomain]?.length || 366;'
    )
    
    # 2. Update pill badge count from hardcoded 366 to dynamic length:
    # <span>{label}</span>
    # <span className={`text-[10px] px-1.5 py-0.2 droplet-pill font-bold ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
    #   366
    # </span>
    old_badge = '''                  <span className={`text-[10px] px-1.5 py-0.2 droplet-pill font-bold ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    366
                  </span>'''
    new_badge = '''                  <span className={`text-[10px] px-1.5 py-0.2 droplet-pill font-bold ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {INSIGHT_MAP[d.id]?.length || 366}
                  </span>'''
    code = code.replace(old_badge, new_badge)
    
    with open(catalog_tsx, "w", encoding="utf-8") as f:
        f.write(code)
    print("Updated DailyInsightsCatalog.tsx with dynamic counts!")

if __name__ == "__main__":
    run()
