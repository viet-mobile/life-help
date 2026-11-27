import re

def split_paragraphs_accurate(text: str) -> list[str]:
    if not text:
        return []
    
    t = text.strip()

    pattern = r'''
        (?=
            \b[1-9]\.\s+                        # 1. 2. 3.
            | [①-⑳]                             # ① ② ③
            | \[붙임(?:\s*\d+)?\]                # [붙임], [붙임 1], [붙임 2]
            | \(\d+\)(?=\s|$)                   # (1) (2) (3) followed by space/end
            | (?<=[.!?]\s)(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)  # First, Second with comma preceded by punctuation
            | ^(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)              # First, Second with comma at paragraph start
            | (?<=[.!?]\s)(?:반면|따라서|그러나|다만)\b             # Transition words preceded by punctuation
            | ^(?:반면|따라서|그러나|다만)\b
            | (?<=[.!?]\s)(?:더\s*알아보기|이\s*외에도|그뿐만\s*아니라)
        )
    '''

    raw_chunks = re.split(pattern, t, flags=re.VERBOSE)
    
    clean_paras = []
    for chunk in raw_chunks:
        c = chunk.strip()
        if not c:
            continue
        # Also ensure not split inside quotes
        clean_paras.append(c)

    return clean_paras

test_sample1 = "이처럼 사이시옷을 발음하지 않는 쪽을 원칙으로 삼은 이유는 크게 두 가지이다. 첫째, 한글 맞춤법의 사이시옷 표기 규정에 따르면 그렇다. 둘째, 현실 발음에서 그렇다."
res1 = split_paragraphs_accurate(test_sample1)
print("Test Sample 1 paragraphs:", len(res1))
for p in res1:
    print("  ->", p)
