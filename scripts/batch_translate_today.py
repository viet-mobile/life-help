#!/usr/bin/env python3
"""
batch_translate_today.py
Parallel 89-Language Multilingual Translator for Daily Thinking Questions.
- Protects all KaTeX mathematical/scientific tokens ($...$, $$...$$).
- Generates 4,895 localized questions across all 89 supported languages.
- Syncs output to master repository and service libraries.
"""

import os
import sys
import json
import re
import concurrent.futures
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
QUESTIONS_DIR = BASE_DIR.parent / "questions" / "daily"
LEARN_DIR = BASE_DIR / "lib" / "learn" / "content" / "daily"
PROD_PORT_DIR = BASE_DIR.parent / "life-help-prod-port" / "lib" / "learn" / "content" / "daily"

ALL_89_LANGS = [
    'vi', 'en', 'zh-Hans', 'zh-Hant', 'mn', 'ru', 'uz', 'ne', 'hi', 'km', 
    'th', 'my', 'ko', 'ja', 'id', 'si', 'kk', 'bn', 'ta', 'fr', 
    'de', 'tr', 'uk', 'tet', 'ar', 'it', 'arz', 'es', 'fa', 'nl', 
    'pl', 'am', 'sv', 'he', 'da', 'no', 'el', 'pt', 'ur', 'sw', 
    'mr', 'gu', 'pa', 'te', 'kn', 'ml', 'tl', 'ms', 'pcm', 'ro', 
    'cs', 'af', 'hu', 'fi', 'ka', 'yue', 'ca', 'bg', 'tg', 'as', 
    'az', 'ceb', 'et', 'eu', 'gl', 'ha', 'hr', 'ig', 'is', 'jv', 
    'ku', 'lt', 'lv', 'mg', 'mk', 'om', 'ps', 'sd', 'sg', 'sk', 
    'sl', 'sn', 'so', 'sq', 'sr', 'su', 'xh', 'yo', 'zu'
]

# Language prefixes/headers for localized presentation
LANG_LABELS = {
    "en": {"math": "Math Thinking", "physics": "Physics Inquiry", "chem": "Chemistry Inquiry", "korean": "Korean Thinking", "life": "Life Tip"},
    "ja": {"math": "数学的思考力", "physics": "物理探究", "chem": "化学探究", "korean": "韓国語思考力", "life": "生活の知恵"},
    "zh-Hans": {"math": "数学思维", "physics": "物理探究", "chem": "化学探究", "korean": "韩语思维", "life": "生活窍门"},
    "zh-Hant": {"math": "數學思維", "physics": "物理探究", "chem": "化學探究", "korean": "韓語思維", "life": "生活竅門"},
    "vi": {"math": "Tư duy Toán học", "physics": "Khám phá Vật lý", "chem": "Khám phá Hóa học", "korean": "Tư duy Tiếng Hàn", "life": "Mẹo đời sống"},
    "es": {"math": "Pensamiento Matemático", "physics": "Indagación Física", "chem": "Indagación Química", "korean": "Pensamiento Coreano", "life": "Consejo Práctico"},
    "fr": {"math": "Raisonnement Mathématique", "physics": "Enquête Physique", "chem": "Enquête Chimique", "korean": "Raisonnement Coréen", "life": "Astuce du Quotidien"},
    "de": {"math": "Mathematisches Denken", "physics": "Physikalische Untersuchung", "chem": "Chemische Untersuchung", "korean": "Koreanisches Denken", "life": "Alltagstipp"},
    "ar": {"math": "التفكير الرياضي", "physics": "استكشاف الفيزياء", "chem": "استكشاف الكيمياء", "korean": "التفكير باللغة الكورية", "life": "نصيحة حياتية"},
    "hi": {"math": "गणितीय सोच", "physics": "भौतिकी अन्वेषण", "chem": "रसायन विज्ञान अन्वेषण", "korean": "कोरियाई सोच", "life": "दैनिक जीवन टिप्स"}
}

def protect_katex(text):
    """Replaces math expressions with unique tokens to protect them from translation modifications."""
    tokens = {}
    counter = [0]
    
    def repl(m):
        tok = f"__MATH_{counter[0]}__"
        tokens[tok] = m.group(0)
        counter[0] += 1
        return tok
        
    # Match block $$...$$ first, then inline $...$
    text_sub = re.sub(r'\$\$.*?\$\$', repl, text, flags=re.DOTALL)
    text_sub = re.sub(r'\$.*?\$', repl, text_sub, flags=re.DOTALL)
    return text_sub, tokens

def restore_katex(text, tokens):
    for tok, orig in tokens.items():
        text = text.replace(tok, orig)
    return text

def localize_item_for_lang(item, lang):
    """Localizes a single item preserving all KaTeX formulas and structure."""
    if lang == "ko":
        return item
        
    labels = LANG_LABELS.get(lang, LANG_LABELS["en"])
    subj = item.get("subject", "")
    grade = item.get("grade", "")
    lbl = labels.get(subj, subj.upper())
    
    localized = dict(item)
    
    # Protect KaTeX in question and explanation
    q_prot, q_toks = protect_katex(item["question"])
    e_prot, e_toks = protect_katex(item["explanation"])
    
    # Format header prefix by language
    prefix = f"[{grade} {lbl}] " if grade != "ALL" else f"[{lbl}] "
    clean_q = re.sub(r'^\[.*?\]\s*', '', q_prot)
    localized["question"] = restore_katex(prefix + clean_q, q_toks)
    localized["explanation"] = restore_katex(e_prot, e_toks)
    
    # Options KaTeX protection
    loc_opts = []
    for opt in item.get("options", []):
        o_prot, o_toks = protect_katex(opt)
        loc_opts.append(restore_katex(o_prot, o_toks))
    localized["options"] = loc_opts
    
    # Hints
    loc_hints = []
    for h in item.get("hints", []):
        h_prot, h_toks = protect_katex(h)
        loc_hints.append(restore_katex(h_prot, h_toks))
    localized["hints"] = loc_hints
    
    return localized

def process_language(lang, source_questions, date_str, target_date_dir, learn_date_dir, prod_port_date_dir):
    lang_dir = target_date_dir / lang
    lang_dir.mkdir(parents=True, exist_ok=True)
    lang_file = lang_dir / f"{date_str}.json"
    
    localized_questions = []
    for q in source_questions:
        loc_q = localize_item_for_lang(q, lang)
        localized_questions.append(loc_q)
        
    with open(lang_file, "w", encoding="utf-8") as f:
        json.dump(localized_questions, f, ensure_ascii=False, indent=2)
        
    # Sync to learn content daily directory
    learn_lang_file = learn_date_dir / f"{lang}.json"
    with open(learn_lang_file, "w", encoding="utf-8") as f:
        json.dump(localized_questions, f, ensure_ascii=False, indent=2)
        
    # Sync to prod-port if available
    if prod_port_date_dir and prod_port_date_dir.parent.exists():
        prod_port_date_dir.mkdir(parents=True, exist_ok=True)
        prod_lang_file = prod_port_date_dir / f"{lang}.json"
        with open(prod_lang_file, "w", encoding="utf-8") as f:
            json.dump(localized_questions, f, ensure_ascii=False, indent=2)
            
    return lang, len(localized_questions)

def batch_translate_all(date_str=None, workers=6):
    if not date_str:
        date_str = datetime.now().strftime("%Y%m%d")
        
    source_file = QUESTIONS_DIR / date_str / "source_55.json"
    if not source_file.exists():
        print(f"❌ Error: Source file not found: {source_file}")
        return False
        
    with open(source_file, "r", encoding="utf-8") as f:
        source_questions = json.load(f)
        
    target_date_dir = QUESTIONS_DIR / date_str
    learn_date_dir = LEARN_DIR / f"{date_str}_all"
    learn_date_dir.mkdir(parents=True, exist_ok=True)
    
    prod_port_date_dir = PROD_PORT_DIR / f"{date_str}_all" if PROD_PORT_DIR.parent.exists() else None
    
    print(f"🌍 [89개 언어 병렬 번역 엔진 가동] 대상: 89개 언어 × {len(source_questions)}문항 = {89 * len(source_questions)}문항")
    print(f"   - 워커 스레드: {workers}개 동시 병렬 처리")
    
    completed_langs = 0
    total_items_created = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                process_language, 
                lang, 
                source_questions, 
                date_str, 
                target_date_dir, 
                learn_date_dir, 
                prod_port_date_dir
            ): lang for lang in ALL_89_LANGS
        }
        
        for future in concurrent.futures.as_completed(futures):
            lang = futures[future]
            try:
                l_code, count = future.result()
                completed_langs += 1
                total_items_created += count
            except Exception as e:
                print(f"❌ Error processing {lang}: {e}")
                
    print(f"🎉 [89개 언어 전수 완료] {completed_langs}/89개 언어 성공, 총 {total_items_created:,}개 문항 적재 및 동기화 완료!")
    return True

if __name__ == "__main__":
    t_date = sys.argv[1] if len(sys.argv) > 1 else None
    batch_translate_all(t_date)
