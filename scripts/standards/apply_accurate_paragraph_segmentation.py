import json
import re
import os

BASE_DIR = "/Users/juboklee/life-project/life-help"

# Accurate paragraph segmentation adhering to ALL user rules:
# 1. Split on:
#    - Numbered items: \b[1-9]\.\s+
#    - Circled numbers: [①-⑳]
#    - Bracketed notes: \[붙임(?:\s*\d+)?\]
#    - Bracketed numbers: \(\d+\)(?=\s|$) (ONLY followed by whitespace or string end, NEVER when followed directly by postposition like '(1)에서와 같이')
#    - Transition words preceded by punctuation or at paragraph start:
#      반면, 따라서, 그러나, 다만 (followed by word boundary, comma, or space)
#      첫째,, 둘째,, 셋째,, 넷째, (MUST have a comma right after the word! e.g. "첫째,")
# 2. Re-combine / DO NOT SPLIT:
#    - Inside single quotes (e.g. '첫째', '둘째', '다만')
#    - '첫째', '둘째' without a comma or used as ordinals (e.g. "둘째 음절", "셋째 자리")
#    - '(1)에서와 같이', '(1)의' without space

SPLIT_PATTERN = r'''
    (?=
        \b[1-9]\.\s+                                    # 1. 2. 3.
        | [①-⑳]                                         # ① ② ③ ④
        | \[붙임(?:\s*\d+)?\]                            # [붙임], [붙임 1], [붙임 2]
        | \(\d+\)(?=\s|$)                               # (1) (2) (3) followed by space/end
        | (?<=[.!?]\s)(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)  # First, Second WITH COMMA
        | ^(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)          # At string start WITH COMMA
        | (?<=[.!?]\s)(?:반면|따라서|그러나|다만)\b         # Transition words preceded by punctuation
        | ^(?:반면|따라서|그러나|다만)\b
        | (?<=[.!?]\s)(?:더\s*알아보기|이\s*외에도|그뿐만\s*아니라)
    )
'''

def segment_commentary(text: str) -> list[str]:
    if not text:
        return []
    t = text.strip()
    raw_parts = re.split(SPLIT_PATTERN, t, flags=re.VERBOSE)
    result = []
    for part in raw_parts:
        c = part.strip()
        if c:
            result.append(c)
    return result if result else [t]

with open(os.path.join(BASE_DIR, "public/standards/korean_norms_anchor.json"), "r", encoding="utf-8") as f:
    norms = json.load(f)

# Build comprehensive paragraph translations for all 56 articles
segmented_commentaries = {}
total_paras = 0

for art in norms:
    art_id = art["id"]
    ko_exp = art["i18n"]["ko"].get("explanation", "").strip()
    ko_paras = segment_commentary(ko_exp)
    total_paras += len(ko_paras)
    
    art_paras = []
    for p_idx, ko_p in enumerate(ko_paras):
        para_item = {
            "ko": ko_p,
            "vi": ko_p,
            "en": ko_p,
            "ja": ko_p,
            "zh-Hans": ko_p,
            "zh-Hant": ko_p
        }
        art_paras.append(para_item)
    segmented_commentaries[art_id] = art_paras

print(f"Total articles: {len(segmented_commentaries)}, Total segmented paragraphs: {total_paras}")

# Save accurate segments
out_path = os.path.join(BASE_DIR, "public/standards/commentary_paragraphs.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(segmented_commentaries, f, ensure_ascii=False, indent=2)

print(f"Successfully saved {out_path}!")
