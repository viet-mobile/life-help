import sys
sys.path.append("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder")
from build_elementary import get_elementary
from build_middle_expanded import get_middle_expanded
from build_high_expanded import get_high_expanded

print("Loading all bands...")
elem = get_elementary()
mid = get_middle_expanded()
high = get_high_expanded()

all_qs = elem + mid + high
print(f"Total questions: {len(all_qs)} (Elem: {len(elem)}, Mid: {len(mid)}, High: {len(high)})")
assert len(all_qs) == 9990, f"Expected 9990, got {len(all_qs)}"

# Check unique IDs
ids = set(q["id"] for q in all_qs)
assert len(ids) == 9990, f"Duplicate IDs! Unique: {len(ids)}"

# Check global cross-skill deduplication
seen_global = {}
dups = []
for q in all_qs:
    c = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0].strip()
    s_opts = " || ".join(sorted([o["text"].strip() for o in q["options"]]))
    key = f"{q['prompt'].strip()} ::: {c} ::: {s_opts}"
    if key in seen_global:
        dups.append((q["id"], seen_global[key]))
    seen_global[key] = q["id"]

print("Global unique keys:", len(seen_global))
print("Global duplicates:", len(dups))
if dups:
    print("First duplicate:", dups[0])
assert len(dups) == 0, f"Found {len(dups)} global duplicates!"

# Tally simple substitutions vs independent learning items
templates = {}
independent = 0
substitutions = 0
for q in all_qs:
    import re
    pat = re.sub(r'[A-Z][a-z]+', '{NAME}', q['prompt'])
    pat = re.sub(r'\b\d+\b', '{NUM}', pat)
    pat = re.sub(r'\b(Seoul|Busan|London|Paris|Tokyo|New York)\b', '{PLACE}', pat)
    pat = f"{q['skillId']} ::: {' '.join(pat.split())}"
    if pat in templates:
        substitutions += 1
    else:
        templates[pat] = q['id']
        independent += 1

print(f"Typology: Independent items = {independent}, Simple substitutions = {substitutions}")
print("ALL 9,990 QUESTIONS ARE 100% GLOBALLY UNIQUE WITH ZERO DUPLICATES!")
