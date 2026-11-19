# -*- coding: utf-8 -*-
import os
import sys
import time
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAIMS_DIR = os.path.join(BASE_DIR, 'scripts', 'copilot_topics_queue', 'claims')
OUT_DIR = os.path.join(BASE_DIR, 'scripts', 'copilot_topics_queue', 'out')
TARGET_FILE = os.path.join(BASE_DIR, 'lib', 'learn', 'dailyInsights', 'lifeTopics89.json')
REGISTRY_FILE = os.path.join(BASE_DIR, 'messages', 'registry.ts')
TTL_SECONDS = 30 * 60
ASSIGNMENTS_FILE = os.path.join(BASE_DIR, '..', 'release-records', 'handoff', 'chatgpt', 'translate', 'assignments.json')
REMAINING_FILE = os.path.join(BASE_DIR, 'scripts', 'remaining_35_topics.json')

os.makedirs(CLAIMS_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

# Follow the Copilot language pipeline rather than claiming unrelated locales.
with open(ASSIGNMENTS_FILE, 'r', encoding='utf-8') as f:
    assignments = json.load(f)
with open(REMAINING_FILE, 'r', encoding='utf-8') as f:
    topic_keys = set(json.load(f))

pipeline = assignments.get('pipeline_flow', {}).get('파', [])
owners = assignments.get('owners', {})
target_langs = [lang for lang in pipeline if owners.get(lang) == 'copilot']
if not target_langs:
    raise RuntimeError('No Copilot languages found in assignments.json pipeline_flow[파].')
REQUIRED_FIELDS = {'title', 'summary', 'principle', 'example', 'actionItem'}

# Check completed languages
def is_lang_complete(lang):
    out_path = os.path.join(OUT_DIR, f"{lang}.json")
    if os.path.exists(out_path):
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                d = json.load(f)
            if set(d) == topic_keys and all(
                isinstance(d.get(topic), dict)
                and set(d[topic]) == REQUIRED_FIELDS
                and all(isinstance(d[topic][field], str) and d[topic][field].strip() for field in REQUIRED_FIELDS)
                for topic in topic_keys
            ):
                return True
        except Exception:
            pass
    return False

def is_locked(lang):
    lock_file = os.path.join(CLAIMS_DIR, f"{lang}.lock")
    if not os.path.exists(lock_file):
        return False
    try:
        mtime = os.path.getmtime(lock_file)
        if time.time() - mtime > TTL_SECONDS:
            os.remove(lock_file)
            return False
        return True
    except Exception:
        return False

def claim_next():
    for lang in target_langs:
        if is_lang_complete(lang):
            continue
        if is_locked(lang):
            continue
        lock_file = os.path.join(CLAIMS_DIR, f"{lang}.lock")
        try:
            # Atomic file creation
            fd = os.open(lock_file, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            with os.fdopen(fd, 'w') as f:
                f.write(f"claimed_at={time.time()}\npid={os.getpid()}\n")
            print(f"CLAIM {lang}")
            return
        except FileExistsError:
            continue
    print("NONE")

def release(lang):
    lock_file = os.path.join(CLAIMS_DIR, f"{lang}.lock")
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
            print(f"RELEASED {lang}")
        except Exception as e:
            print(f"Error releasing {lang}: {e}")
    else:
        print(f"No active lock for {lang}")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--release':
        if len(sys.argv) > 2:
            release(sys.argv[2])
        else:
            print("Usage: claim_life_topic.py --release <LANG>")
    elif len(sys.argv) > 1 and sys.argv[1] == '--status':
        completed = [l for l in target_langs if is_lang_complete(l)]
        locked = [l for l in target_langs if is_locked(l) and not is_lang_complete(l)]
        pending = [l for l in target_langs if not is_lang_complete(l) and not is_locked(l)]
        print(f"Status: Total {len(target_langs)} langs | Complete: {len(completed)} | Locked: {len(locked)} | Pending: {len(pending)}")
    else:
        claim_next()
