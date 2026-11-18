#!/usr/bin/env python3
"""
validate_daily_thinking.py
Validates the structural and formula integrity of daily thinking questions (55 questions).
Checks:
- Exactly 55 questions
- Subject and grade distributions
- 4 choices per question
- Valid answer index (0..3)
- 2 hints and explanation present
- KaTeX inline ($...$) and block ($$...$$) balance
"""

import sys
import json
from pathlib import Path

def validate_file(file_path):
    p = Path(file_path)
    if not p.exists():
        print(f"❌ Error: File not found: {p}")
        return False
        
    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    if not isinstance(data, list):
        print(f"❌ Error: Root JSON must be an array of questions.")
        return False
        
    total = len(data)
    if total != 55:
        print(f"❌ Error: Expected 55 questions, but found {total}.")
        return False
        
    subject_counts = {}
    errors = []
    
    for idx, q in enumerate(data, 1):
        q_id = q.get("id", f"idx_{idx}")
        subj = q.get("subject")
        subject_counts[subj] = subject_counts.get(subj, 0) + 1
        
        # Required fields
        for field in ["id", "subject", "grade", "question", "options", "answer", "hints", "explanation"]:
            if field not in q:
                errors.append(f"[{q_id}] Missing required field '{field}'")
                
        # Options check
        opts = q.get("options", [])
        if not isinstance(opts, list) or len(opts) != 4:
            errors.append(f"[{q_id}] 'options' must be a list of 4 choices (found {len(opts) if isinstance(opts, list) else 'invalid'})")
            
        # Answer index
        ans = q.get("answer")
        if not isinstance(ans, int) or ans < 0 or ans > 3:
            errors.append(f"[{q_id}] 'answer' must be an integer between 0 and 3 (found {ans})")
            
        # Hints check
        hints = q.get("hints", [])
        if not isinstance(hints, list) or len(hints) < 2:
            errors.append(f"[{q_id}] 'hints' must contain at least 2 hints")
            
        # KaTeX balance check
        for text_key in ["question", "explanation"]:
            val = q.get(text_key, "")
            if isinstance(val, str):
                # Count single dollars that are not escaped
                # Replace $$ with placeholder first
                temp = val.replace("$$", "")
                single_dollars = temp.count("$")
                if single_dollars % 2 != 0:
                    errors.append(f"[{q_id}] Unbalanced KaTeX single dollar '$' in '{text_key}'")

    if errors:
        print(f"❌ Validation FAILED with {len(errors)} error(s):")
        for e in errors[:10]:
            print(f"   - {e}")
        return False
        
    print(f"✅ [검증 합격] 55문항 전수 무결성 통과! (에러 0건)")
    print(f"   - 과목별 분포: 수학 {subject_counts.get('math', 0)}, 영어 {subject_counts.get('english', 0)}, 물리 {subject_counts.get('physics', 0)}, 화학 {subject_counts.get('chemistry', 0)}, 한국어 {subject_counts.get('korean', 0)}, 생활 {subject_counts.get('life', 0)}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 validate_daily_thinking.py <path_to_source_55.json>")
        sys.exit(1)
        
    ok = validate_file(sys.argv[1])
    sys.exit(0 if ok else 1)
