import json
import sys
from build_elementary import get_elementary
from build_middle import get_middle
from build_high import get_high

print("Loading questions from all bands...")
elem = get_elementary()
mid = get_middle()
high = get_high()

all_qs = elem + mid + high
print(f"Total: {len(all_qs)} questions (Elem: {len(elem)}, Mid: {len(mid)}, High: {len(high)})")
assert len(all_qs) == 6660

# Check unique IDs
ids = set(q["id"] for q in all_qs)
assert len(ids) == 6660, f"Duplicate IDs found! Unique: {len(ids)}"

# Check strict deduplication key
seen_keys = set()
duplicates = []
for q in all_qs:
    correct = [o["text"] for o in q["options"] if o["id"] == q["answer"]["id"]][0].strip()
    sorted_opts = " || ".join(sorted([o["text"].strip() for o in q["options"]]))
    key = f"{q['skillId']} ::: {q['prompt'].strip()} ::: {correct} ::: {sorted_opts}"
    if key in seen_keys:
        duplicates.append((q["id"], key))
    seen_keys.add(key)

print(f"Unique deduplicated keys count: {len(seen_keys)}")
print(f"Duplicates count: {len(duplicates)}")
if duplicates:
    print("Sample duplicate:", duplicates[0])
assert len(seen_keys) == 6660, f"Deduplication failed! Only {len(seen_keys)} unique items."

print("SUCCESS: Full 6,660 bank is 100% UNIQUE with ZERO duplicates!")
