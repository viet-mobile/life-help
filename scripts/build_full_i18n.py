# scripts/build_full_i18n.py
import json
import os
import re

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

def load_json(name):
    path = os.path.join(MESSAGES_DIR, name)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(name, data):
    path = os.path.join(MESSAGES_DIR, name)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

print("build_full_i18n module loaded.")

