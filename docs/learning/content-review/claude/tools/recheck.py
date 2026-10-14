#!/usr/bin/env python3
"""Read-only re-check of Gemini content against the baseline review commit.
usage: recheck.py --repo <checkout of the new commit> --baseline 46cbf67eefaa6314646fc51b3f0e4a365d2e7a61 --registry findings/finding-registry.json --out <recheck dir>
Per finding it reports: item_missing | unchanged | changed (+ before/after text). 'unchanged' => still unresolved; 'changed'/'missing' need an independent semantic re-review (the agents in the review procedure).
It also recomputes question counts and repetition (distinct grade+skill+prompt+correct) per grade/level."""
import argparse,json,subprocess,re,collections,os,hashlib
ap=argparse.ArgumentParser();[ap.add_argument(x) for x in("--repo","--baseline","--registry","--out")];a=ap.parse_args()
def git(rev,path):
    try:return subprocess.check_output(["git","-C",a.repo,"show",f"{rev}:{path}"],stderr=subprocess.DEVNULL).decode()
    except subprocess.CalledProcessError:return None
def load(rev,path):
    s=git(rev,path);return json.loads(s) if s else None
head=subprocess.check_output(["git","-C",a.repo,"rev-parse","HEAD"]).decode().strip()
def qmap(rev):
    m={}
    for site in("english","korean"):
        b=load(rev,f"lib/learn/content/bank/{site}.json")
        for q in (b or {}).get("questions",[]):m[q["id"]]=(site,q)
    r=load(rev,"lib/learn/content/reading/english.json")
    for q in (r or {}).get("questions",[]):m[q["id"]]=("reading",q)
    k=load(rev,"lib/learn/content/korean/korean.json")
    for q in (k or {}).get("questions",[]):m[q["id"]]=("korean-core",q)
    return m
def sig(q):
    opts={o["id"]:o["text"] for o in q.get("options",[])};ans=q.get("answer",{}).get("id")
    return json.dumps({"p":q.get("prompt"),"c":opts.get(ans),"h":q.get("hints"),"e":q.get("explanation"),"d":q.get("difficulty"),"o":sorted(opts.values())},ensure_ascii=False,sort_keys=True)
old,new=qmap(a.baseline),qmap("HEAD")
reg=json.load(open(a.registry))
res=[];cnt=collections.Counter()
for f in reg:
    iid=f.get("item_id")
    if not iid or iid not in old:
        st="no_item_id (lesson/level-level finding: needs semantic re-review)"
    elif iid not in new:st="item_missing"
    elif sig(old[iid][1])==sig(new[iid][1]):st="unchanged"
    else:st="changed"
    cnt[st.split(" ")[0]]+=1
    res.append({"id":f["id"],"item_id":iid,"state":st,"category":f["category"],"severity":f["severity"]})
os.makedirs(a.out,exist_ok=True)
def metrics(rev):
    out={}
    for site in("english","korean"):
        b=load(rev,f"lib/learn/content/bank/{site}.json")
        if not b:continue
        per=collections.defaultdict(lambda:[0,set()])
        for q in b["questions"]:
            g=re.match(r"bk-(?:en|ko)-([a-z0-9]+)-",q["id"]).group(1).upper()
            ans=q["answer"]["id"];t={o["id"]:o["text"] for o in q["options"]}[ans]
            per[g][0]+=1;per[g][1].add((q["skillId"],q["prompt"],t))
        out[site]={g:{"questions":v[0],"distinct":len(v[1]),"distinct_pct":round(100*len(v[1])/v[0],1)} for g,v in sorted(per.items())}
        out[site]["_total"]={"questions":sum(v[0] for v in per.values()),"distinct":sum(len(v[1]) for v in per.values())}
    r=load(rev,"lib/learn/content/reading/english.json")
    if r:
        qs=r["questions"];out["reading"]={"questions":len(qs),"answer_positions":dict(collections.Counter(q["answer"]["id"] for q in qs)),"difficulties":dict(collections.Counter(q["difficulty"] for q in qs))}
    return out
json.dump({"baseline":a.baseline,"head":head,"states":dict(cnt),"findings":res,"metrics_baseline":metrics(a.baseline),"metrics_head":metrics("HEAD")},open(f"{a.out}/recheck-{head[:7]}.json","w"),ensure_ascii=False,indent=1)
print(head[:7],dict(cnt))
