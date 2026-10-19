#!/usr/bin/env python3
"""Merges the level assignment (id -> 1..6, from the Korean curriculum 급) into lib/think/korean-levels.json and computes `prior`:
the level a learner of the site's step K1-K10 starts on = the median level of that step's tasks, capped by the step order (K1-K2 -> 1, K3-K4 -> 2, K5-K6 -> 3, K7-K8 -> 4, K9 -> 5, K10 -> 6). Usage: korean-levels.py <levels.json>"""
import json, glob, sys, statistics, collections
lv = json.load(open(sys.argv[1]))
tasks = {}
for f in glob.glob('lib/think/data/**/*.json', recursive=True):
    try: d = json.load(open(f))
    except Exception: continue
    if isinstance(d, list):
        for t in d:
            if isinstance(t, dict) and 'steps' in t and t.get('subject') == 'korean': tasks[t['id']] = t
assert set(lv) == set(tasks), (len(set(tasks) - set(lv)), len(set(lv) - set(tasks)))
by = collections.defaultdict(list)
for i, t in tasks.items():
    if t.get('grade'): by[t['grade']].append(lv[i])
CEIL = {'K1':1,'K2':1,'K3':2,'K4':2,'K5':3,'K6':3,'K7':4,'K8':4,'K9':5,'K10':6}  # a learner never starts above the level the old step order implies
prior = {g: min(int(statistics.median_low(v)), CEIL[g]) for g, v in by.items()}
json.dump({"levels": dict(sorted(lv.items())), "prior": dict(sorted(prior.items()))}, open('lib/think/korean-levels.json', 'w'), ensure_ascii=False, indent=0)
print(collections.Counter(lv.values()), prior)
