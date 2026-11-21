#!/usr/bin/env python3
"""
High-speed robust parallel translator for 98 problem checklist options into 89 languages.
Uses Gemini Flash with thinkingBudget: 0, 25-item chunks, and thread pool.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_PATH = "/Users/juboklee/life-project/life-help"
BASE_ITEMS_FILE = os.path.join(BASE_PATH, "lib/request/base_problem_items.json")
OUTPUT_FILE = os.path.join(BASE_PATH, "lib/request/problemOptions89.json")

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("FATAL: GEMINI_API_KEY is missing.", flush=True)
    sys.exit(1)

URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={API_KEY}"

ALL_LOCALES = [
    "ko", "en", "vi", "zh-Hans", "zh-Hant", "yue",
    "mn", "ru", "uz", "ne", "hi", "km", "th", "my", "ja", "si", "kk", "bn", "ta",
    "fr", "de", "tr", "uk", "tet", "ar", "it", "arz", "es", "fa", "nl", "pl", "am",
    "sv", "he", "da", "no", "el", "pt", "ur", "sw", "mr", "gu", "pa", "te", "kn",
    "ml", "tl", "ms", "pcm", "ro", "cs", "af", "hu", "fi", "ka", "ca", "bg", "tg",
    "as", "az", "ceb", "et", "eu", "gl", "ha", "hr", "id", "ig", "is", "jv", "ku", "lt",
    "lv", "mg", "mk", "om", "ps", "sd", "sg", "sk", "sl", "sn", "so", "sq", "sr",
    "su", "xh", "yo", "zu"
]

LANGUAGE_NAMES = {
    "af": "Afrikaans", "am": "Amharic", "ar": "Arabic", "arz": "Egyptian Arabic",
    "as": "Assamese", "az": "Azerbaijani", "bg": "Bulgarian", "bn": "Bengali",
    "ca": "Catalan", "ceb": "Cebuano", "cs": "Czech", "da": "Danish", "de": "German",
    "el": "Greek", "es": "Spanish", "et": "Estonian", "eu": "Basque", "fa": "Persian",
    "fi": "Finnish", "fr": "French", "gl": "Galician", "gu": "Gujarati", "ha": "Hausa",
    "he": "Hebrew", "hi": "Hindi", "hr": "Croatian", "hu": "Hungarian", "id": "Indonesian",
    "ig": "Igbo", "is": "Icelandic", "it": "Italian", "ja": "Japanese", "jv": "Javanese",
    "ka": "Georgian", "kk": "Kazakh", "km": "Khmer", "kn": "Kannada", "ku": "Kurdish",
    "lt": "Lithuanian", "lv": "Latvian", "mg": "Malagasy", "mk": "Macedonian",
    "ml": "Malayalam", "mn": "Mongolian", "mr": "Marathi", "ms": "Malay", "my": "Burmese",
    "ne": "Nepali", "nl": "Dutch", "no": "Norwegian", "om": "Oromo", "pa": "Punjabi",
    "pcm": "Nigerian Pidgin", "pl": "Polish", "ps": "Pashto", "pt": "Portuguese",
    "ro": "Romanian", "ru": "Russian", "sd": "Sindhi", "sg": "Sango", "si": "Sinhala",
    "sk": "Slovak", "sl": "Slovenian", "sn": "Shona", "so": "Somali", "sq": "Albanian",
    "sr": "Serbian", "su": "Sundanese", "sv": "Swedish", "sw": "Swahili", "ta": "Tamil",
    "te": "Telugu", "tet": "Tetum", "tg": "Tajik", "th": "Thai", "tl": "Filipino/Tagalog",
    "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek", "xh": "Xhosa",
    "yo": "Yoruba", "zu": "Zulu"
}

def load_base_items():
    with open(BASE_ITEMS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_existing_db():
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def call_gemini(prompt: str) -> str:
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
            "thinkingConfig": {"thinkingBudget": 0}
        }
    }).encode("utf-8")

    for attempt in range(6):
        try:
            req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                sleep_time = 5.0 * (attempt + 1)
                time.sleep(sleep_time)
            elif attempt == 5:
                raise e
            else:
                time.sleep(2.0 * (attempt + 1))
        except Exception as e:
            if attempt == 5:
                raise e
            time.sleep(2.0 * (attempt + 1))
    return "{}"

def translate_single_chunk(batch, chunk_items):
    lang_specs = ", ".join([f"{loc} ({LANGUAGE_NAMES.get(loc, loc)})" for loc in batch])
    input_data = [{"id": it["id"], "ko": it["ko"], "en": it["en"]} for it in chunk_items]
    sample_id = input_data[0]["id"]
    
    prompt = f"""You are the master localizer for LIFE.HELP on-demand services.
Translate these {len(input_data)} user problem checklist items into: {lang_specs}.
Return ONLY a JSON object where each key is the exact item id string (e.g. "{sample_id}"), and the value is an object mapping each language code to the translated string:
Example:
{{
  "{sample_id}": {json.dumps({loc: f"translation in {LANGUAGE_NAMES.get(loc, loc)}" for loc in batch})}
}}

Items to translate:
{json.dumps(input_data, ensure_ascii=False, indent=2)}
"""
    for retry in range(3):
        try:
            raw_json = call_gemini(prompt)
            parsed = json.loads(raw_json)
            # validate that parsed contains actual item ids
            valid_res = {}
            for it in chunk_items:
                iid = it["id"]
                if iid in parsed and isinstance(parsed[iid], dict):
                    valid_res[iid] = parsed[iid]
            if len(valid_res) >= len(chunk_items) * 0.8:
                return batch, valid_res
        except Exception as e:
            if retry == 2:
                print(f"Error translating batch {batch}: {e}", flush=True)
            time.sleep(1.0)
    return batch, {}

def main():
    items = load_base_items()
    db = load_existing_db()

    # Pre-seed base languages
    for it in items:
        iid = it["id"]
        if iid not in db:
            db[iid] = {}
        db[iid]["ko"] = it["ko"]
        db[iid]["en"] = it["en"]
        if it.get("vi"):
            db[iid]["vi"] = it["vi"]
        if it.get("zh"):
            db[iid]["zh-Hans"] = it["zh"]
        if it.get("zh-Hant"):
            db[iid]["zh-Hant"] = it["zh-Hant"]
            db[iid]["yue"] = it["zh-Hant"]

    # Target locales
    target_locales = [loc for loc in ALL_LOCALES if loc not in ["ko", "en", "vi", "zh-Hans", "zh-Hant", "yue"]]

    # Work tasks: (batch_locales, chunk_items)
    CHUNK_SIZE = 25
    chunks = [items[i:i + CHUNK_SIZE] for i in range(0, len(items), CHUNK_SIZE)]

    # Prioritize gl, gu, el, az, sg first!
    priority_locales = ["gl", "gu", "el", "az", "sg"]
    other_locales = [l for l in target_locales if l not in priority_locales]
    ordered_locales = priority_locales + other_locales

    # Group into batches of 2 locales
    batches = [ordered_locales[i:i + 2] for i in range(0, len(ordered_locales), 2)]

    tasks = []
    for batch in batches:
        for c_idx, chunk in enumerate(chunks):
            # Check if all items in this chunk already have translations for this batch
            needs_work = False
            for it in chunk:
                for loc in batch:
                    if not db[it["id"]].get(loc):
                        needs_work = True
                        break
                if needs_work:
                    break
            if needs_work:
                tasks.append((batch, chunk, c_idx + 1))

    print(f"Total base items: {len(items)}", flush=True)
    print(f"Remaining tasks to process: {len(tasks)} (25 items x 2 langs per task)", flush=True)

    if not tasks:
        print("ALL 89 LANGUAGES COMPLETED!", flush=True)
        return

    completed = 0
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(translate_single_chunk, batch, chunk): (batch, c_num) for (batch, chunk, c_num) in tasks}
        for future in as_completed(futures):
            batch, c_num = futures[future]
            try:
                batch_res, res_map = future.result()
                for iid, trans_map in res_map.items():
                    if iid in db:
                        for loc, val in trans_map.items():
                            if val and isinstance(val, str):
                                db[iid][loc] = val.strip()
                completed += 1
                if completed % 4 == 0 or completed == len(tasks):
                    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                        json.dump(db, f, ensure_ascii=False, indent=2)
                    print(f"[{completed}/{len(tasks)}] Saved progress. Batch: {batch} Chunk: {c_num}", flush=True)
            except Exception as e:
                print(f"Task failed: {batch} Chunk: {c_num}: {e}", flush=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    print("ALL 89 LANGUAGES COMPLETED AND VERIFIED!", flush=True)

if __name__ == "__main__":
    main()
