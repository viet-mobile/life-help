# -*- coding: utf-8 -*-
import os
import re
import sys
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib import request, error

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'lib', 'learn', 'dailyInsights')
CACHE_FILE = os.path.join(DATA_DIR, 'life_topics_89_cache.json')
OUT_FILE = os.path.join(DATA_DIR, 'lifeTopics89.json')

API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    print("FATAL: GEMINI_API_KEY environment variable not set.", flush=True)
    sys.exit(1)

MODEL = "gemini-3.8-flash"

# Load 36 Canonical Topics from data/life.json
with open(os.path.join(DATA_DIR, 'data', 'life.json'), 'r', encoding='utf-8') as f:
    life_items = json.load(f)

CANONICAL_TOPICS = {}
for item in life_items:
    clean = re.sub(r'\s*\(시즌\s*\d+\s*심화\s*가이드\)', '', item['title']).strip()
    if clean not in CANONICAL_TOPICS:
        CANONICAL_TOPICS[clean] = {
            'title': clean,
            'summary': item['summary'],
            'principle': item['principle'],
            'example': item['example'],
            'actionItem': item['actionItem'],
        }

TOPIC_KEYS = list(CANONICAL_TOPICS.keys())
print(f"Loaded {len(TOPIC_KEYS)} canonical topics.", flush=True)

# Load language metadata from messages/registry.ts
with open(os.path.join(BASE_DIR, 'messages', 'registry.ts'), 'r', encoding='utf-8') as f:
    reg_text = f.read()

matches = re.findall(r'\{\s*code:\s*\"([^\"]+)\",\s*name:\s*\"([^\"]+)\",\s*nativeName:\s*\"([^\"]+)\"', reg_text)
LANG_META = {}
for code, name, native_name in matches:
    LANG_META[code] = {'name': name, 'native': native_name}

# All locales
all_locales_match = re.search(r'export const locales = \[(.*?)\] as const;', reg_text, re.DOTALL)
if all_locales_match:
    for code in re.findall(r'\"([^\"]+)\"', all_locales_match.group(1)):
        if code not in LANG_META:
            LANG_META[code] = {'name': code, 'native': code}

print(f"Loaded {len(LANG_META)} languages metadata.", flush=True)

# Load existing cache
CACHE = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            CACHE = json.load(f)
        print(f"Resumed from cache: {len(CACHE)} languages loaded.", flush=True)
    except Exception as e:
        print("Failed to load cache:", e, flush=True)

# Korean source
CACHE['ko'] = {k: {
    'title': CANONICAL_TOPICS[k]['title'],
    'summary': CANONICAL_TOPICS[k]['summary'],
    'principle': CANONICAL_TOPICS[k]['principle'],
    'example': CANONICAL_TOPICS[k]['example'],
    'actionItem': CANONICAL_TOPICS[k]['actionItem'],
} for k in TOPIC_KEYS}

def call_gemini(lang_code, lang_desc, batch_topics):
    prompt = f"""You are a master localizer for LIFE.HELP, a global life assistance super-app.
Translate these {len(batch_topics)} practical life guide topics into {lang_desc}.

CRITICAL REQUIREMENTS:
1. Translate into natural, idiomatic, clear, learner-friendly {lang_desc}.
2. Ensure ZERO Korean Hangul characters remain in the translation (except specific acronyms like K-패스, ISA, IRP, CMA).
3. Return ONLY a valid JSON object where each key is the EXACT Korean topic key from input, mapping to an object with exact keys:
   "title", "summary", "principle", "example", "actionItem".

INPUT:
{json.dumps(batch_topics, ensure_ascii=False, indent=2)}
"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    req_body = {
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'generationConfig': {
            'responseMimeType': 'application/json',
            'thinkingConfig': {'thinkingBudget': 0}
        }
    }
    data = json.dumps(req_body).encode('utf-8')
    req = request.Request(url, data=data, headers={'Content-Type': 'application/json'})

    for attempt in range(5):
        try:
            with request.urlopen(req, timeout=45) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                txt = res['candidates'][0]['content']['parts'][0]['text']
                parsed = json.loads(txt)
                return parsed
        except error.HTTPError as e:
            if e.code == 429:
                sleep_time = (attempt + 1) * 12
                print(f"[{lang_code}] Rate limit (429), backing off for {sleep_time}s...", flush=True)
                time.sleep(sleep_time)
            elif attempt == 4:
                raise e
            else:
                time.sleep(3)
        except Exception as e:
            if attempt == 4:
                raise e
            time.sleep(3)
    return {}

def save_output():
    # Invert CACHE into final format: topic -> field -> lang -> text
    final_dataset = {}
    for topic_key in TOPIC_KEYS:
        final_dataset[topic_key] = {
            'title': {},
            'summary': {},
            'principle': {},
            'example': {},
            'actionItem': {},
        }
        for code, topics_map in CACHE.items():
            if topic_key in topics_map:
                t = topics_map[topic_key]
                if isinstance(t, dict):
                    final_dataset[topic_key]['title'][code] = t.get('title', '')
                    final_dataset[topic_key]['summary'][code] = t.get('summary', '')
                    final_dataset[topic_key]['principle'][code] = t.get('principle', '')
                    final_dataset[topic_key]['example'][code] = t.get('example', '')
                    final_dataset[topic_key]['actionItem'][code] = t.get('actionItem', '')

    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_dataset, f, ensure_ascii=False, indent=2)
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(CACHE, f, ensure_ascii=False, indent=2)

def translate_single_topic_for_lang(topic_key, code):
    if code in CACHE and topic_key in CACHE[code]:
        return code, True
    meta = LANG_META.get(code, {'name': code, 'native': code})
    desc = f"{meta['native']} ({meta['name']}, code: {code})"
    try:
        res = call_gemini(code, desc, {topic_key: CANONICAL_TOPICS[topic_key]})
        if topic_key in res:
            if code not in CACHE:
                CACHE[code] = {}
            CACHE[code][topic_key] = res[topic_key]
            return code, True
    except Exception as e:
        print(f"[{code}] error on {topic_key}: {e}", flush=True)
    return code, False

def translate_lang_full(code):
    missing_keys = [k for k in TOPIC_KEYS if code not in CACHE or k not in CACHE[code]]
    if not missing_keys:
        return code, True

    meta = LANG_META.get(code, {'name': code, 'native': code})
    desc = f"{meta['native']} ({meta['name']}, code: {code})"

    # Chunk missing keys in batches of 6
    chunk_size = 6
    for i in range(0, len(missing_keys), chunk_size):
        chunk = missing_keys[i:i + chunk_size]
        sub_batch = {k: CANONICAL_TOPICS[k] for k in chunk}
        try:
            res = call_gemini(code, desc, sub_batch)
            if code not in CACHE:
                CACHE[code] = {}
            CACHE[code].update(res)
        except Exception as e:
            print(f"[{code}] chunk error ({i}-{i+len(chunk)}): {e}", flush=True)
            # Try 1-by-1 fallback for this chunk
            for k in chunk:
                translate_single_topic_for_lang(k, code)

    print(f"[{code}] FULL TRANSLATION COMPLETE: {len(CACHE.get(code, {}))}/{len(TOPIC_KEYS)} topics", flush=True)
    return code, True

def main():
    target_codes = list(LANG_META.keys())
    today_key = "공항 라운지 무료 이용 PP카드/더라운지 혜택"

    print("==================================================", flush=True)
    print(f"PHASE 1: Translating TODAY'S TOPIC across all {len(target_codes)} languages", flush=True)
    print("==================================================", flush=True)

    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(translate_single_topic_for_lang, today_key, code): code for code in target_codes if code != 'ko'}
        for f in as_completed(futures):
            code = futures[f]
            try:
                f.result()
            except Exception as e:
                print(f"Error {code}: {e}", flush=True)

    save_output()
    print(f"✅ PHASE 1 COMPLETE: Today's topic saved for all languages. Output written to {OUT_FILE}", flush=True)

    # If --today-only flag is set, stop here
    if "--today-only" in sys.argv:
        return

    print("==================================================", flush=True)
    print("PHASE 2: Translating ALL 36 TOPICS across all languages", flush=True)
    print("==================================================", flush=True)

    # Greek first for full completion
    if 'el' in target_codes:
        print("Ensuring Greek (el) full completion first...", flush=True)
        translate_lang_full('el')
        save_output()

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(translate_lang_full, code): code for code in target_codes if code != 'ko'}
        done_cnt = 0
        total = len(futures)
        for f in as_completed(futures):
            code = futures[f]
            done_cnt += 1
            if done_cnt % 3 == 0 or done_cnt == total:
                save_output()
                print(f"Progress: {done_cnt}/{total} languages completed.", flush=True)

    save_output()
    print(f"🎉 ALL 89 LANGUAGES & 36 TOPICS TRANSLATED AND SAVED TO {OUT_FILE}!", flush=True)

if __name__ == '__main__':
    main()
