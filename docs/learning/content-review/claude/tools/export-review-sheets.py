#!/usr/bin/env python3
"""Builds reviewer sheets (CSV) for km kn ml sg am my. Read-only on the repos; writes only under --out.
usage: export-review-sheets.py --korean-repo <46cbf67 checkout> --math-repo <e6da450 checkout> --out <dir>"""
import argparse,csv,json,os,re
ap=argparse.ArgumentParser();ap.add_argument("--korean-repo");ap.add_argument("--math-repo");ap.add_argument("--out");a=ap.parse_args()
LOCS=["km","kn","ml","sg","am","my"]
NON_LATIN={"km","kn","ml","am","my"}
os.makedirs(a.out,exist_ok=True)
def flags(src,tr,loc):
    f=[]
    if not tr.strip(): return ["EMPTY"]
    if tr.strip()==src.strip() and re.search("[A-Za-z]{4,}",src): f.append("IDENTICAL_TO_SOURCE")
    ph=lambda x:sorted(re.findall(r"\{\w+\}",x))
    if ph(src)!=ph(tr): f.append("PLACEHOLDER_MISMATCH")
    if loc in NON_LATIN:
        words=re.findall(r"[A-Za-z]{5,}",re.sub(r"\$[^$]*\$","",tr))
        if words: f.append("LATIN_WORDS:"+",".join(sorted(set(words))[:6]))
    if len(src)>20 and (len(tr)<0.25*len(src) or len(tr)>4*len(src)): f.append("LENGTH_RATIO")
    return f
HEAD=["id","field","source_en","source_ko_or_note","translation","auto_flags","reviewed_translation","status","notes"]
# --- Korean K7-K10 (Gemini content)
kor=json.load(open(f"{a.korean_repo}/lib/learn/content/korean/korean.json"))
lessons={l["id"]:l for c in kor["catalog"]["courses"] if c["id"] in {f"korean-k{i}" for i in range(7,11)} for u in c["units"] for l in u["lessons"]}
qs={q["id"]:q for q in kor["questions"] if re.match(r"k-k(7|8|9|10)-",q["id"])}
sk={s["id"]:s for s in kor["catalog"]["skills"] if re.match(r"k\.k(7|8|9|10)\.",s["id"])}
counts={}
for loc in LOCS:
    ov=json.load(open(f"{a.korean_repo}/content/learn-overlays/{loc}/korean.json"))
    rows=[]
    for sid,s in sk.items():
        rows.append([sid,"skill.title",s["title"],"",ov["skills"].get(sid,"")])
    for lid,l in lessons.items():
        t=ov["lessons"].get(lid,{})
        for fld in ("title","concept","example"):
            rows.append([lid,fld,l[fld],"",t.get(fld,"")])
    for qid,q in qs.items():
        t=ov["questions"].get(qid,{})
        tgt=(q.get("target") or {}).get("text","")
        rows.append([qid,"prompt",q["prompt"],tgt,t.get("prompt","")])
        for i,h in enumerate(q["hints"]):rows.append([qid,f"hint{i+1}",h,tgt,(t.get("hints") or ["",""])[i] if t.get("hints") and len(t["hints"])>i else ""])
        rows.append([qid,"explanation",q["explanation"],tgt,t.get("explanation","")])
        for o in q.get("options",[]):
            rows.append([qid,f"option.{o['id']}",o["text"],tgt,(t.get("options") or {}).get(o["id"],"")])
    with open(f"{a.out}/{loc}-korean-k7-k10.csv","w",newline="",encoding="utf-8-sig") as fh:
        w=csv.writer(fh);w.writerow(HEAD)
        for r in rows:w.writerow(r[:5]+[";".join(flags(r[2],r[4],loc)),"","",""])
    counts[(loc,"korean-k7-k10")]=(len(rows),sum(1 for r in rows if flags(r[2],r[4],loc)))
# --- Math bank wording (kit files), English source
base=f"{a.math_repo}/scripts/learn/bank/kit"
en=json.load(open(f"{base}/en.json"))["q"]
for loc in LOCS:
    kit=json.load(open(f"{base}/{loc}.json"))["q"]
    rows=[]
    for k,v in en.items():
        t=kit.get(k,{"prompt":"","hints":["",""],"expl":""})
        rows.append([k,"prompt",v["prompt"],"",t["prompt"]])
        for i in (0,1):rows.append([k,f"hint{i+1}",v["hints"][i],"",t["hints"][i]])
        rows.append([k,"explanation",v["expl"],"",t["expl"]])
    with open(f"{a.out}/{loc}-math-bank.csv","w",newline="",encoding="utf-8-sig") as fh:
        w=csv.writer(fh);w.writerow(HEAD)
        for r in rows:w.writerow(r[:5]+[";".join(flags(r[2],r[4],loc)),"","",""])
    counts[(loc,"math-bank")]=(len(rows),sum(1 for r in rows if flags(r[2],r[4],loc)))
json.dump({f"{k[0]}/{k[1]}":{"rows":v[0],"auto_flagged":v[1]} for k,v in counts.items()},open(f"{a.out}/counts.json","w"),indent=1)
for k,v in counts.items():print(k,v)
