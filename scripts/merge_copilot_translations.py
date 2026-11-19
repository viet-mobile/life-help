# -*- coding: utf-8 -*-
import os
import sys
import json
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE_DIR = os.path.join(BASE_DIR, 'scripts', 'copilot_topics_queue', 'out')
TARGET_FILE = os.path.join(BASE_DIR, 'lib', 'learn', 'dailyInsights', 'lifeTopics89.json')
REMAINING_FILE = os.path.join(BASE_DIR, 'scripts', 'remaining_35_topics.json')

with open(REMAINING_FILE, 'r', encoding='utf-8') as f:
    remaining_topics = json.load(f)
topic_keys = set(remaining_topics.keys())

with open(TARGET_FILE, 'r', encoding='utf-8') as f:
    master_data = json.load(f)

target_lang = sys.argv[1] if len(sys.argv) > 1 else None

if target_lang:
    fpath = os.path.join(QUEUE_DIR, f"{target_lang}.json")
    if not os.path.exists(fpath):
        print(f"ERROR: {fpath} not found.")
        sys.exit(1)
    files = [fpath]
else:
    files = glob.glob(os.path.join(QUEUE_DIR, '*.json'))

updated_langs = 0
for fpath in files:
    lang = os.path.basename(fpath).replace('.json', '')
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        count = 0
        for k, v in data.items():
            if k in master_data and isinstance(v, dict):
                master_data[k]['title'][lang] = v.get('title', '')
                master_data[k]['summary'][lang] = v.get('summary', '')
                master_data[k]['principle'][lang] = v.get('principle', '')
                master_data[k]['example'][lang] = v.get('example', '')
                master_data[k]['actionItem'][lang] = v.get('actionItem', '')
                count += 1
        
        updated_langs += 1
    except Exception as e:
        print(f"[{lang}] Error merging: {e}")

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

print(f"VALIDATED & MERGED: {updated_langs} lang(s)")
