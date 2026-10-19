#!/usr/bin/env python3
"""Picks the FINAL BOSS of every grade+semester (math), grade+semester slot (English: two per grade) and language level (Korean) = the hardest task.
Difficulty = 3 x steps + 2 x (write/build steps) + minutes (+5 when blind-reviewed). Output lib/think/bosses.json {key: taskId}.
Keys: math|E1|1 ... english|E1|2 ... korean|L4. A task is boss of one key at most. Re-run after adding tasks; the choice only changes when a harder task appears."""
import json, glob, collections
tasks = {}
for f in glob.glob('lib/think/data/**/*.json', recursive=True):
    try: d = json.load(open(f))
    except Exception: continue
    if isinstance(d, list):
        for t in d:
            if isinstance(t, dict) and 'steps' in t: tasks[t['id']] = t
sem = json.load(open('lib/think/semesters.json'))
kl = json.load(open('lib/think/korean-levels.json'))['levels']
def score(t):
    ks = [s['kind'] for s in t['steps']]
    return 3 * len(ks) + 2 * sum(k in ('write', 'build') for k in ks) + (t.get('minutes') or 10) + (5 if t.get('status') == 'reviewed-ai' else 0)
used = set(); out = {}
def pick(key, pool):
    pool = [t for t in pool if t['id'] not in used]
    if not pool: return
    best = sorted(pool, key=lambda t: (-score(t), t['id']))[0]
    out[key] = best['id']; used.add(best['id'])
for g in ['E1','E2','E3','E4','E5','E6','M1','M2','M3','H1','H2','H3']:
    for s in (1, 2):
        pick(f'math|{g}|{s}', [t for t in tasks.values() if t['subject']=='math' and t.get('grade')==g and sem.get(t['id'], 0)==s])
    # English tasks carry no semester yet: the two hardest of the grade are the 1st / 2nd semester bosses
    for s in (1, 2):
        pick(f'english|{g}|{s}', [t for t in tasks.values() if t['subject']=='english' and t.get('grade')==g and sem.get(t['id'], 0) in (0, s)])
for n in range(1, 7):
    pick(f'korean|L{n}', [t for t in tasks.values() if t['subject']=='korean' and kl.get(t['id'])==n])
json.dump(out, open('lib/think/bosses.json', 'w'), sort_keys=True, indent=0)
print(len(out), sorted(set(k.split('|')[0] for k in out)), [k for k in ['korean|L6','math|E1|1','math|E1|2'] if k not in out])
