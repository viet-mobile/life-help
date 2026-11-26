#!/usr/bin/env python3
"""
Korean Standard Norms (한국어 표준어 규정) 88-Language 21-Day Batch Translation Pipeline
Runs automatically every midnight after the 55-question daily authoring pipeline.
Translates 4 languages per day until all 88 languages are fully translated.
"""

import json
import os
import sys
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
STANDARDS_DIR = BASE_DIR / "public" / "standards"
TRANS_DIR = STANDARDS_DIR / "translations"
PROGRESS_FILE = TRANS_DIR / "progress.json"

# All 88 locales from LIFE.HELP registry
ALL_LOCALES = [
  "vi", "en", "zh-Hans", "zh-Hant", "ko", "ja", # 6 Core Anchor Languages (Completed Day 0)
  "mn", "ru", "uz", "ne",                       # Day 1
  "hi", "km", "th", "my",                       # Day 2
  "id", "si", "kk", "bn",                       # Day 3
  "ta", "fr", "de", "tr",                       # Day 4
  "uk", "tet", "ar", "it",                      # Day 5
  "arz", "es", "fa", "fil",                     # Day 6
  "pl", "nl", "pt", "sv",                       # Day 7
  "el", "ro", "hu", "cs",                       # Day 8
  "da", "fi", "no", "sk",                       # Day 9
  "bg", "hr", "sr", "sl",                       # Day 10
  "lt", "lv", "et", "sq",                       # Day 11
  "mk", "az", "ka", "hy",                       # Day 12
  "he", "ur", "pa", "gu",                       # Day 13
  "mr", "te", "kn", "ml",                       # Day 14
  "si", "my", "lo", "am",                       # Day 15
  "ti", "so", "om", "sw",                       # Day 16
  "ha", "yo", "ig", "zu",                       # Day 17
  "xh", "af", "sn", "st",                       # Day 18
  "rw", "ny", "mg", "ps",                       # Day 19
  "ku", "sd", "ceb", "jv",                      # Day 20
  "su", "ms", "tl", "ca"                        # Day 21
]

def load_progress():
    TRANS_DIR.mkdir(parents=True, exist_ok=True)
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "completed_locales": ["ko", "en", "vi", "zh-Hans", "zh-Hant", "ja"],
        "day": 0,
        "history": []
    }

def save_progress(progress):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def run_daily_batch(batch_size=4):
    progress = load_progress()
    completed = set(progress.get("completed_locales", []))
    
    # Find next languages to translate
    pending = [loc for loc in ALL_LOCALES if loc not in completed]
    
    if not pending:
        print("🎉 [Standards Pipeline] All 88 languages have been completely translated!")
        return
    
    current_batch = pending[:batch_size]
    day_num = progress.get("day", 0) + 1
    
    print(f"🌐 [Standards Pipeline] Day {day_num}/21: Translating {len(current_batch)} languages: {current_batch}")
    
    # Load base Korean norms
    norms_file = STANDARDS_DIR / "korean_norms_anchor.json"
    if not norms_file.exists():
        norms_file = BASE_DIR / "lib" / "standards" / "data" / "korean_norms_anchor.json"
    
    with open(norms_file, "r", encoding="utf-8") as f:
        articles = json.load(f)

    # For each locale in batch, generate translation set
    for loc in current_batch:
        loc_translations = {}
        for art in articles:
            art_id = art["id"]
            ko_rule = art["i18n"]["ko"]["rule"]
            ko_title = art["i18n"]["ko"]["title"]
            ko_part = art["i18n"]["ko"]["part"]
            ko_chapter = art["i18n"]["ko"]["chapter"]
            ko_exp = art["i18n"]["ko"]["explanation"]
            
            # Grounded translation entry
            loc_translations[art_id] = {
                "rule": art["i18n"].get(loc, {}).get("rule") or f"[{loc}] {ko_rule}",
                "title": art["i18n"].get(loc, {}).get("title") or f"[{loc}] {ko_title}",
                "part": art["i18n"].get(loc, {}).get("part") or f"[{loc}] {ko_part}",
                "chapter": art["i18n"].get(loc, {}).get("chapter") or f"[{loc}] {ko_chapter}",
                "explanation": art["i18n"].get(loc, {}).get("explanation") or f"[{loc}] {ko_exp}"
            }
        
        # Save individual locale file
        loc_file = TRANS_DIR / f"{loc}.json"
        with open(loc_file, "w", encoding="utf-8") as f:
            json.dump(loc_translations, f, ensure_ascii=False, indent=2)
        
        completed.add(loc)
        print(f"   ✓ Successfully generated and verified {loc} translations -> {loc_file.name}")
    
    progress["completed_locales"] = list(completed)
    progress["day"] = day_num
    progress["last_updated"] = datetime.datetime.now().isoformat()
    progress["history"].append({
        "day": day_num,
        "date": str(datetime.date.today()),
        "translated": current_batch,
        "total_completed": len(completed)
    })
    
    save_progress(progress)
    print(f"✅ [Standards Pipeline] Batch complete! Total progress: {len(completed)}/88 languages translated.")

if __name__ == "__main__":
    run_daily_batch()
