# scripts/update_all_languages_full.py
import json
import os
import re

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

# Load all languages
langs = [f[:-5] for f in os.listdir(MESSAGES_DIR) if f.endswith('.json')]
print(f"Total languages to process: {len(langs)}")

# Load updates
exec(open(os.path.join(os.path.dirname(__file__), 'translation_dictionary.py'), encoding='utf-8').read())

