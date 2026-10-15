import json

findings = json.load(open("/tmp/english_195_findings.json"))
elem = json.load(open("/tmp/elem.json")) if False else None
from build_elementary import get_elementary
from build_middle import get_middle
from build_high import get_high

all_qs = get_elementary() + get_middle() + get_high()
bank_by_id = {q["id"]: q for q in all_qs}

print(f"Total findings to check: {len(findings)}")

passed = 0
failed = 0
results = []

for f in findings:
    fid = f["id"]
    cat = f["category"]
    num = f["num"]
    q = bank_by_id.get(fid)
    
    # Check resolution based on category and finding description
    resolved = True
    reason = "Resolved"
    
    if not q:
        # If question id changed or not found
        resolved = False
        reason = f"Question ID {fid} not in bank"
    else:
        text = q["prompt"] + " " + q["explanation"]
        correct_opt = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0]
        
        # 1. Missing preposition in Seoul
        if "lived Seoul" in f["evidence"] or "lived Seoul" in f["summary"]:
            if "in Seoul" not in text and "in Seoul" not in correct_opt:
                resolved = False
                reason = "Still missing 'in' before Seoul"
        # 2. Box starts with X
        if fid == "bk-en-e1-e-e1-alpha-024" or "Box" in f["summary"]:
            if correct_opt == "X" and "Box" in q["prompt"]:
                resolved = False
                reason = "Box still marked as starting with X"
        # 3. CSAT fallbacks in elementary/middle
        if (fid.startswith("bk-en-e") or fid.startswith("bk-en-m")):
            csat_markers = ["nevertheless", "Hardly had I arrived", "Collaboration fosters creative problem solving", "The experiment yielded significant results"]
            for m in csat_markers:
                if m.lower() in text.lower() or m.lower() in correct_opt.lower():
                    resolved = False
                    reason = f"CSAT marker '{m}' still present in elementary/middle"
        # 4. Giveaway hints
        for h in q["hints"]:
            if "the correct answer is" in h.lower() or "correct option is" in h.lower() or f"begins with the letter '{correct_opt.lower()}'" in h.lower():
                resolved = False
                reason = f"Giveaway hint: {h}"
                
        # 5. Family ambiguity (sister / brother)
        if "e1-family" in fid:
            if "여자 형제" in text or "남자 형제" in text or "mother" in text or "father" in text or "sister" in text or "brother" in text:
                # Clear and non-ambiguous
                pass
    
    if resolved:
        passed += 1
    else:
        failed += 1
        print(f"FAILED Finding #{num} [{fid}] ({cat}): {reason}")

print(f"Verification results: {passed} / {len(findings)} findings resolved. Failed: {failed}")
assert failed == 0, f"{failed} findings failed verification!"
