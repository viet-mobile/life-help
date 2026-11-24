# -*- coding: utf-8 -*-
"""
Injects all 35 Korean, 34 Life, 35 Math, and 35 English Nepali translations
into koreanTopics89.json, lifeTopics89.json, studyTopics89.json,
and content/learn-overlays/ne/daily-tips-pc.json.
"""

import json
import os
from scripts.build_nepali_korean_topics import NEPALI_KOREAN_TOPICS
from scripts.build_nepali_life_topics import NEPALI_LIFE_TOPICS
from scripts.build_nepali_study_topics import NEPALI_MATH_TOPICS, NEPALI_ENGLISH_TOPICS

ROOT = "/Users/juboklee/life-project/life-help"

# 1. Inject into koreanTopics89.json
k_path = os.path.join(ROOT, "lib/learn/dailyInsights/koreanTopics89.json")
with open(k_path, "r", encoding="utf-8") as f:
    k_data = json.load(f)

k_injected = 0
for topic_id, trans in NEPALI_KOREAN_TOPICS.items():
    if topic_id in k_data:
        for field in ["title", "summary", "principle", "example", "actionItem"]:
            if field in trans:
                if field not in k_data[topic_id]:
                    k_data[topic_id][field] = {}
                k_data[topic_id][field]["ne"] = trans[field]
        k_injected += 1

with open(k_path, "w", encoding="utf-8") as f:
    json.dump(k_data, f, ensure_ascii=False, indent=2)

print(f"1. Injected Nepali into {k_injected} Korean topics in koreanTopics89.json (Total now: {sum(1 for v in k_data.values() if 'ne' in v.get('title', {}))}/36)")

# 2. Inject into lifeTopics89.json
l_path = os.path.join(ROOT, "lib/learn/dailyInsights/lifeTopics89.json")
with open(l_path, "r", encoding="utf-8") as f:
    l_data = json.load(f)

l_injected = 0
for raw_title, trans in NEPALI_LIFE_TOPICS.items():
    if raw_title in l_data:
        for field in ["title", "summary", "principle", "example", "actionItem"]:
            if field in trans:
                if field not in l_data[raw_title]:
                    l_data[raw_title][field] = {}
                l_data[raw_title][field]["ne"] = trans[field]
        l_injected += 1

with open(l_path, "w", encoding="utf-8") as f:
    json.dump(l_data, f, ensure_ascii=False, indent=2)

print(f"2. Injected Nepali into {l_injected} Life topics in lifeTopics89.json (Total now: {sum(1 for v in l_data.values() if 'ne' in v.get('title', {}))}/36)")

# 3. Inject into studyTopics89.json (Math & English)
s_path = os.path.join(ROOT, "lib/learn/dailyInsights/studyTopics89.json")
with open(s_path, "r", encoding="utf-8") as f:
    s_data = json.load(f)

m_injected = 0
for topic_id, trans in NEPALI_MATH_TOPICS.items():
    if topic_id in s_data:
        for field in ["title", "summary", "principle", "example", "actionItem"]:
            if field in trans:
                if field not in s_data[topic_id]:
                    s_data[topic_id][field] = {}
                s_data[topic_id][field]["ne"] = trans[field]
        m_injected += 1

e_injected = 0
for topic_id, trans in NEPALI_ENGLISH_TOPICS.items():
    if topic_id in s_data:
        for field in ["title", "summary", "principle", "example", "actionItem"]:
            if field in trans:
                if field not in s_data[topic_id]:
                    s_data[topic_id][field] = {}
                s_data[topic_id][field]["ne"] = trans[field]
        e_injected += 1

with open(s_path, "w", encoding="utf-8") as f:
    json.dump(s_data, f, ensure_ascii=False, indent=2)

print(f"3. Injected Nepali into {m_injected} Math and {e_injected} English topics in studyTopics89.json (Total now: {sum(1 for v in s_data.values() if 'ne' in v.get('title', {}))}/96)")

# 4. Inject all into content/learn-overlays/ne/daily-tips-pc.json
pc_path = os.path.join(ROOT, "content/learn-overlays/ne/daily-tips-pc.json")
with open(pc_path, "r", encoding="utf-8") as f:
    ne_pc = json.load(f)

# Korean topics k-001..k-036
for topic_id, trans in NEPALI_KOREAN_TOPICS.items():
    ne_pc[topic_id] = trans
if "k-003" in k_data:
    ne_pc["k-003"] = {f: k_data["k-003"][f]["ne"] for f in ["title", "summary", "principle", "example", "actionItem"] if "ne" in k_data["k-003"][f]}

# Life topics: map insight-001..insight-036
life_data_path = os.path.join(ROOT, "lib/learn/dailyInsights/data/life.json")
with open(life_data_path, "r", encoding="utf-8") as f:
    life_json = json.load(f)

for item in life_json:
    it_id = item.get("id")
    raw_t = item.get("title")
    clean_t = raw_t.replace(" (시즌 1 심화 가이드)", "").strip()
    if clean_t in l_data and "ne" in l_data[clean_t].get("title", {}):
        ne_pc[it_id] = {
            field: l_data[clean_t][field]["ne"]
            for field in ["title", "summary", "principle", "example", "actionItem"]
            if "ne" in l_data[clean_t].get(field, {})
        }

# Math topics m-001..m-036
for topic_id, trans in NEPALI_MATH_TOPICS.items():
    ne_pc[topic_id] = trans
if "m-003" in s_data and "ne" in s_data["m-003"].get("title", {}):
    ne_pc["m-003"] = {f: s_data["m-003"][f]["ne"] for f in ["title", "summary", "principle", "example", "actionItem"] if "ne" in s_data["m-003"][f]}

# English topics e-001..e-036
for topic_id, trans in NEPALI_ENGLISH_TOPICS.items():
    ne_pc[topic_id] = trans
if "e-003" in s_data and "ne" in s_data["e-003"].get("title", {}):
    ne_pc["e-003"] = {f: s_data["e-003"][f]["ne"] for f in ["title", "summary", "principle", "example", "actionItem"] if "ne" in s_data["e-003"][f]}

with open(pc_path, "w", encoding="utf-8") as f:
    json.dump(ne_pc, f, ensure_ascii=False, indent=2)

print(f"4. Updated {pc_path} (Total items now: {len(ne_pc)})")
