#!/usr/bin/env python3
"""Derives the zh-Hant overlays from the zh-Hans ones with OpenCC (s2twp: Taiwan standard characters and phrases).
   pip install opencc-python-reimplemented ; python3 scripts/think/tr-hant.py"""
import json, os, glob
import opencc
c = opencc.OpenCC("s2twp")
src, dst = "lib/think/i18n/zh-Hans", "lib/think/i18n/zh-Hant"
os.makedirs(dst, exist_ok=True)
n = 0
for f in sorted(glob.glob(src + "/*.json")):
    d = json.load(open(f))
    out = {tid: {k: c.convert(v) for k, v in m.items()} for tid, m in d.items()}
    json.dump(out, open(os.path.join(dst, os.path.basename(f)), "w"), ensure_ascii=False, separators=(",", ":"))
    n += sum(len(m) for m in out.values())
print("zh-Hant strings:", n)
