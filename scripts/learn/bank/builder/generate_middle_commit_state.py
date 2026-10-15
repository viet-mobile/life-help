import json
import sys
sys.path.append("/Users/juboklee/life-project/life-help/scripts/learn/bank/builder")
from build_elementary import get_elementary
from build_middle_expanded import get_middle_expanded
from build_high import get_high

elem = get_elementary()
mid = get_middle_expanded()
high = get_high()

all_qs = elem + mid + high
print(f"Total: {len(all_qs)} questions (Elem: {len(elem)}, Mid: {len(mid)}, High: {len(high)})")
assert len(all_qs) == 8325

grades_count = {}
for q in all_qs:
    g = q["id"].split("-")[2].upper()
    grades_count[g] = grades_count.get(g, 0) + 1

bank_data = {
    "format": 1,
    "site": "english",
    "count": len(all_qs),
    "grades": grades_count,
    "questions": all_qs
}

out_path = "/Users/juboklee/life-project/life-help/lib/learn/content/bank/english.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(bank_data, f, indent=1, ensure_ascii=False)

print(f"Wrote intermediate Middle bundle state ({len(all_qs)} questions) to {out_path}")
