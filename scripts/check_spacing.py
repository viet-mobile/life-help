import json
import os
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

MESSAGES_DIR = "messages"
pattern = re.compile(r"(\d+)([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])")

collisions = []
for fn in sorted(os.listdir(MESSAGES_DIR)):
    if not fn.endswith(".json") or fn == "ko.json":
        continue
    loc = fn.replace(".json", "")
    with open(f"{MESSAGES_DIR}/{fn}", "r", encoding="utf-8") as f:
        d = json.load(f)
    
    def check_dict(path, obj):
        for k, v in obj.items():
            curr = f"{path}.{k}" if path else k
            if isinstance(v, dict):
                check_dict(curr, v)
            elif isinstance(v, str):
                matches = pattern.findall(v)
                # filter out 1st, 2nd, 3rd, 24h, 24/7, 30m, 1st Shift, etc.
                filtered = [
                    m for m in matches 
                    if not (m[0] in ["1", "2", "3"] and m[1].lower() in ["s", "n", "r", "t"])
                    and m[1].lower() not in ["h", "m", "s", "x"]
                ]
                if filtered:
                    collisions.append((loc, curr, v, filtered))

    check_dict("", d)

print(f"Total potential collisions found: {len(collisions)}")
for loc, path, val, matches in collisions[:20]:
    print(f"[{loc}] {path}: \"{val}\" -> matches: {matches}")

