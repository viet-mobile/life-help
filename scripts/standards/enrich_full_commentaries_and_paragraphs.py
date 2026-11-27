import json
import re
import os

BASE_DIR = "/Users/juboklee/life-project/life-help"

# Load base raw norms for full official commentary
with open(os.path.join(BASE_DIR, "lib/standards/data/korean_norms.json"), "r", encoding="utf-8") as f:
    raw_norms = json.load(f)

raw_commentaries = {}
for item in raw_norms:
    comm = item.get("commentary", "")
    comm = re.sub(r'[\s\n\r]*(?:연\s*북|북\s*연|연|북)[\s\n\r]*$', '', comm).strip()
    comm = re.sub(r'\s*국립국어원\s*우\)\s*07511.*$', '', comm).strip()
    raw_commentaries[item["id"]] = comm

# Load anchor norms
with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "r", encoding="utf-8") as f:
    anchor_norms = json.load(f)

# Load word meanings and note translations
with open(os.path.join(BASE_DIR, "public/standards/word_meanings.json"), "r", encoding="utf-8") as f:
    word_meanings = json.load(f)

with open(os.path.join(BASE_DIR, "public/standards/note_translations.json"), "r", encoding="utf-8") as f:
    note_translations = json.load(f)

# Update each article
for art in anchor_norms:
    art_id = art["id"]
    
    # 1. Update Korean explanation to full official commentary
    if art_id in raw_commentaries and raw_commentaries[art_id]:
        art["i18n"]["ko"]["explanation"] = raw_commentaries[art_id]

    # Clean 07511 if any
    for lang, trans in art["i18n"].items():
        if "explanation" in trans and trans["explanation"]:
            trans["explanation"] = re.sub(r'\s*국립국어원\s*우\)\s*07511.*$', '', trans["explanation"]).strip()

    # 2. Update structured tables with fresh meanings and note translations
    if "structuredExamples" in art:
        # Filter out standalone (1), (2), (3) text blocks
        filtered_ex = []
        for block in art["structuredExamples"]:
            if block.get("type") == "text":
                c = block.get("content", "").strip()
                if re.match(r'^\(\d+\)$', c):
                    # redundant empty index header, omit it!
                    continue
            filtered_ex.append(block)
        art["structuredExamples"] = filtered_ex

        for block in art["structuredExamples"]:
            if block.get("type") == "table":
                block["meanings"] = {}
                block["notesI18n"] = {}
                is_comp = "ㄱ" in block.get("headers", [])
                for row in block.get("rows", []):
                    if len(row) > 0 and row[0].strip():
                        w = row[0].strip()
                        clean_w = w.replace("-", "").strip()
                        if w in word_meanings:
                            block["meanings"][w] = word_meanings[w]
                        elif clean_w in word_meanings:
                            block["meanings"][clean_w] = word_meanings[clean_w]
                    
                    note_text = ""
                    if is_comp and len(row) > 2 and row[2].strip():
                        note_text = row[2].strip()
                    elif not is_comp and len(row) > 1 and row[1].strip():
                        note_text = row[1].strip()
                    
                    if note_text and note_text in note_translations:
                        block["notesI18n"][note_text] = note_translations[note_text]

# Save to public and lib
with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "w", encoding="utf-8") as f:
    json.dump(anchor_norms, f, ensure_ascii=False, indent=2)

with open(os.path.join(BASE_DIR, "lib/standards/data/korean_norms_anchor.json"), "w", encoding="utf-8") as f:
    json.dump(anchor_norms, f, ensure_ascii=False, indent=2)

print(f"Enriched all {len(anchor_norms)} articles in public and lib.")
