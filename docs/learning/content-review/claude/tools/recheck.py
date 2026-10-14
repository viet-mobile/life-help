#!/usr/bin/env python3
"""Read-only re-check of Gemini content against the baseline review commit.
usage: recheck.py --repo <checkout of the new commit> --baseline 46cbf67eefaa6314646fc51b3f0e4a365d2e7a61 --registry findings/finding-registry.json --out <recheck dir>
Per finding it reports: item_missing | unchanged | content_changed | removed | unpublished (removal and unpublishing are reported separately from answer fixes, with a learner_path check). 'unchanged' => still unresolved; 'content_changed'/'removed'/'unpublished' need an independent semantic re-review (the agents in the review procedure).
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
def lesson_refs(rev):
    refs=collections.defaultdict(list)
    for path in("lib/learn/content/korean/korean.json","lib/learn/content/reading/english.json","lib/learn/content/elementary/english.json","lib/learn/content/secondary/english.json","lib/learn/content/demo/english.json"):
        d=load(rev,path)
        if not d:continue
        for c in d["catalog"]["courses"]:
            for u in c["units"]:
                for l in u["lessons"]:
                    for q in l.get("questionIds",[])+([l["challengeId"]] if l.get("challengeId") else []):refs[q].append(l["id"])
    return refs
new_refs=lesson_refs("HEAD")
def reach(iid):
    q=new.get(iid,(None,None))[1]
    return {"present_in_content": q is not None,"status": q.get("status") if q else None,"still_referenced_by_lessons": new_refs.get(iid,[]),"dangling_lesson_reference": q is None and bool(new_refs.get(iid)),"excluded_from_learner_path": q is None or q.get("status")!="PUBLISHED"}
res=[];cnt=collections.Counter()
for f in reg:
    iid=f.get("item_id")
    if not iid or iid not in old:
        st="no_item_id (lesson/level-level finding: needs semantic re-review)"
    elif iid not in new:st="removed"
    elif new[iid][1].get("status")!="PUBLISHED":st="unpublished"
    elif sig(old[iid][1])==sig(new[iid][1]):st="unchanged"
    else:st="content_changed"
    cnt[st.split(" ")[0]]+=1
    row={"id":f["id"],"item_id":iid,"state":st,"category":f["category"],"severity":f["severity"]}
    if st in("removed","unpublished"):
        # removal/unpublishing is NOT a content fix: check the learner path. Only PUBLISHED, non-diagnostic questions reach students (lib/learn/server/service.ts, content/indexer.ts).
        row["learner_path"]=reach(iid)
    res.append(row)
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
            if q.get('status')!='PUBLISHED':continue
            per[g][0]+=1;per[g][1].add((q["skillId"],q["prompt"],t))
        out[site]={g:{"questions":v[0],"distinct":len(v[1]),"distinct_pct":round(100*len(v[1])/v[0],1)} for g,v in sorted(per.items())}
        out[site]["_total"]={"questions":sum(v[0] for v in per.values()),"distinct":sum(len(v[1]) for v in per.values())}
    r=load(rev,"lib/learn/content/reading/english.json")
    if r:
        qs=r["questions"];out["reading"]={"questions":len(qs),"answer_positions":dict(collections.Counter(q["answer"]["id"] for q in qs)),"difficulties":dict(collections.Counter(q["difficulty"] for q in qs))}
    return out
json.dump({"baseline":a.baseline,"head":head,"states":dict(cnt),"findings":res,"metrics_baseline":metrics(a.baseline),"metrics_head":metrics("HEAD")},open(f"{a.out}/recheck-{head[:7]}.json","w"),ensure_ascii=False,indent=1)
print(head[:7],dict(cnt))
