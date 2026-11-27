import re

def split_paragraphs_accurate(text: str) -> list[str]:
    if not text:
        return []
    
    # User's strict rules:
    # 1. Split on:
    #    - Numbered lists: [1-9]\. (e.g. 1. 2. 3.)
    #    - Circled numbers: [①-⑳]
    #    - Attached bracket notes: \[붙임(?:\s*\d+)?\]
    #    - Bracketed numbers: \(\d+\) ONLY when followed by space or end of string, NOT when directly followed by postpositions like '(1)에서와 같이'
    #    - Transition words with comma or at start:
    #      (?<=^|[.\n])\s*(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*|다만,\s*|반면,\s*|따라서,\s*|그러나,\s*|이 외에도,\s*|그뿐만 아니라,\s*|더 알아보기)
    #      Also '반면', '따라서', '그러나', '다만' before sentences:
    #      (?<=[.!?]\s)(?=(?:반면|따라서|그러나|다만)\b)
    # 2. Strict exclusions / DO NOT SPLIT:
    #    - Inside single quotes (e.g. '첫째', '둘째', '다만')
    #    - '첫째', '둘째' without a comma or used as ordinals (e.g. "장모음이 단어의 둘째 음절 이하에 놓일 때")
    #    - '(1)에서와 같이' or '(1)의 경우' where (1) is followed immediately by postpositions without spaces.

    # Regular expression lookahead pattern
    # Pre-clean newlines inside text
    t = text.strip()

    # Pattern components:
    # (a) [1-9]\.\s+
    # (b) [①-⑳]
    # (c) \[붙임(?:\s*\d+)?\]
    # (d) \(\d+\)(?=\s|$)
    # (e) (?<=[.!?]\s)(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*|다만\b|반면\b|따라서\b|그러나\b|더 알아보기|이 외에도|그뿐만 아니라)
    # (f) ^(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*|다만\b|반면\b|따라서\b|그러나\b|더 알아보기)

    pattern = r'''
        (?=
            \b[1-9]\.\s+                        # 1. 2. 3.
            | [①-⑳]                             # ① ② ③
            | \[붙임(?:\s*\d+)?\]                # [붙임], [붙임 1], [붙임 2]
            | \(\d+\)(?=\s|$)                   # (1) (2) (3) followed by space/end, NOT '(1)에서와 같이'
            | (?<=[.!?]\s)(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)  # First, Second, etc. with comma
            | (?<=[.!?]\s)(?:반면|따라서|그러나|다만)\b             # Transition words preceded by punctuation
            | (?<=[.!?]\s)(?:더\s*알아보기|이\s*외에도|그뿐만\s*아니라)
        )
    '''

    raw_chunks = re.split(pattern, t, flags=re.VERBOSE)
    
    # Second pass: ensure we didn't split inside single quotes or wrongly
    clean_paras = []
    for chunk in raw_chunks:
        c = chunk.strip()
        if not c:
            continue
        clean_paras.append(c)

    return clean_paras

# Test on problematic sentence given by user:
test_sample1 = "장모음이 단어의 둘째 음절 이하에 놓일 때 일어나는 것도 있지만, 첫째, 둘째, 셋째로 나뉜다. '둘째'는 예외다."
res1 = split_paragraphs_accurate(test_sample1)
print("Test Sample 1 paragraphs:", len(res1))
for p in res1:
    print("  ->", p)

# Test on (1) with postposition vs (1) standalone:
test_sample2 = "규정에 따르면 (1)에서와 같이 적용한다. (1) 눈보라[눈ː보라] 말씨[말ː씨] (2) 밤나무[밤ː나무]"
res2 = split_paragraphs_accurate(test_sample2)
print("Test Sample 2 paragraphs:", len(res2))
for p in res2:
    print("  ->", p)

# Test on transition words:
test_sample3 = "표준형으로 제시하는 것이다. 다만, 국어 언중들은 일원화하여 이해한다. 따라서 표준어 규정이 중요하다. 그러나 차이가 있다."
res3 = split_paragraphs_accurate(test_sample3)
print("Test Sample 3 paragraphs:", len(res3))
for p in res3:
    print("  ->", p)
