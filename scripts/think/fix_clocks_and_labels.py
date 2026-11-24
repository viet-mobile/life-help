# -*- coding: utf-8 -*-
import os, glob, json, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
I18N_DIR = os.path.join(ROOT, "lib", "think", "i18n")

REPLACEMENTS = {
    "Clock 가": "Clock A",
    "Clock 나": "Clock B",
    "Clock 다": "Clock C",
    "Clock 라": "Clock D",
    "Clock 마": "Clock E",
    "钟表 가": "钟表 A",
    "钟表 나": "钟表 B",
    "钟表 다": "钟表 C",
    "钟表 라": "钟表 D",
    "鐘錶 가": "鐘錶 A",
    "鐘錶 나": "鐘錶 B",
    "鐘錶 다": "鐘錶 C",
    "鐘錶 라": "鐘錶 D",
    "時計 가": "時計 A",
    "時計 나": "時計 B",
    "時計 다": "時計 C",
    "時計 라": "時計 D",
    "時計가": "時計A",
    "時計나": "時計B",
    "時計다": "時計C",
    "時計라": "時計D",
    "Đồng hồ 가": "Đồng hồ A",
    "Đồng hồ 나": "Đồng hồ B",
    "Đồng hồ 다": "Đồng hồ C",
    "Đồng hồ 라": "Đồng hồ D",
}

for root, dirs, files in os.walk(I18N_DIR):
    if "/ko" in root:
        continue
    for f in files:
        if not f.endswith(".json") or "korean" in f:
            continue
        p = os.path.join(root, f)
        with open(p, "r", encoding="utf-8") as fp:
            content = fp.read()
        orig = content
        for k, v in REPLACEMENTS.items():
            content = content.replace(k, v)
        if content != orig:
            with open(p, "w", encoding="utf-8") as fp:
                fp.write(content)

print("Clock labels cleaned.")
