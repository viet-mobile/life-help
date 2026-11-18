#!/usr/bin/env python3
"""Splits authored tasks into BLIND packets (no answers) and KEY packets for independent review.
Usage: make-review-packets.py <outDir> <chunkSize> <authoredDir> [<authoredDir> ...]
 <authoredDir>/*.json = {taskId: task}. Writes <outDir>/blind/r-N.json and <outDir>/key/r-N.json (N from 1)."""
import json, glob, copy, os, sys
out, size, dirs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tasks = []
for d in dirs:
    for f in sorted(glob.glob(d + '/*.json')): tasks += list(json.load(open(f)).values())
TOP = {'id','grade','level','title','uiLang','goal','prerequisites','minutes','material','steps'}
ANS = {'explain','correct','acceptable','reveals','checks','modelAnswers','badAnswers','selfAssess','humanReview','modelRows','badRows','distinctBy','wrong','reflect','placeholder'}
def blind(t):
    o = {k: t[k] for k in TOP if k in t}; st = []
    for s in t['steps']:
        s = copy.deepcopy(s)
        for k in list(s):
            if k in ANS: del s[k]
        for opt in s.get('options', []): opt.pop('reveals', None)
        for g in s.get('stages', []):
            for opt in g.get('options', []): opt.pop('reveals', None)
            for k in ('correct', 'acceptable', 'explain'): g.pop(k, None)
        st.append(s)
    o['steps'] = st; return o
def key(t):
    return {'id': t['id'], 'format': t.get('format'), 'steps': [{k: v for k, v in s.items() if k not in ('prompt','hints','vars','need','constraints','minChars','lines') or k in ('kind','id')} for s in t['steps']],
            'rubric': t.get('rubric'), 'alternatives': t.get('alternatives'), 'hardCases': t.get('hardCases'), 'autoVsHuman': t.get('autoVsHuman')}
os.makedirs(out + '/blind', exist_ok=True); os.makedirs(out + '/key', exist_ok=True)
for n in range(0, len(tasks), size):
    c = tasks[n:n + size]; i = n // size + 1
    json.dump([blind(t) for t in c], open(f'{out}/blind/r-{i}.json', 'w'), ensure_ascii=False, indent=1)
    json.dump([key(t) for t in c], open(f'{out}/key/r-{i}.json', 'w'), ensure_ascii=False, indent=1)
print(len(tasks), 'tasks ->', (len(tasks) + size - 1) // size, 'packets')
