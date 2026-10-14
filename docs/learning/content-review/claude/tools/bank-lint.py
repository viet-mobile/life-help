#!/usr/bin/env python3
"""Read-only structural lint of the English/Korean practice banks. Usage: bank-lint.py <repo> <out.json>"""
import json,sys,collections,re,statistics
repo,out=sys.argv[1],sys.argv[2]
res={}
for site,key in (("english","skillId"),("korean","skillId")):
    b=json.load(open(f"{repo}/lib/learn/content/bank/{site}.json"))
    qs=b["questions"];grp="grades" if site=="english" else "levels"
    def grade(q):
        m=re.match(r"bk-(?:en|ko)-([a-z0-9]+)-",q["id"]);return m.group(1).upper()
    issues=collections.defaultdict(list)
    ids=collections.Counter(q["id"] for q in qs)
    for i,c in ids.items():
        if c>1: issues["duplicate_id"].append(i)
    pos=collections.Counter();per=collections.defaultdict(lambda:{"n":0,"prompts":set(),"pc":set(),"ans":collections.Counter()})
    for q in qs:
        g=grade(q);k=(g,q["skillId"]);p=per[k];p["n"]+=1;p["prompts"].add(q["prompt"])
        opts=q.get("options") or []
        texts=[o["text"] for o in opts]
        ans=q["answer"].get("id") if isinstance(q["answer"],dict) else None
        ids_=[o["id"] for o in opts]
        if len(opts)!=4: issues["option_count_not_4"].append(q["id"])
        if len(set(t.strip().lower() for t in texts))!=len(texts): issues["duplicate_option_text"].append(q["id"])
        if ans not in ids_: issues["answer_id_missing"].append(q["id"]); continue
        ct=next(o["text"] for o in opts if o["id"]==ans)
        pos[ids_.index(ans)]+=1;p["pc"].add((q["prompt"],ct));p["ans"][ct]+=1
        if len(q.get("hints",[]))!=2 or not all(h.strip() for h in q.get("hints",[])): issues["hints_not_2"].append(q["id"])
        if not q.get("explanation","").strip(): issues["empty_explanation"].append(q["id"])
        if ct.lower() in q["prompt"].lower() and len(ct)>3: issues["answer_text_appears_in_prompt"].append(q["id"])
        if any(t.strip()=="" for t in texts): issues["blank_option"].append(q["id"])
        if re.search(r"undefined|NaN|\{\{|\[object",json.dumps(q,ensure_ascii=False)): issues["template_leak"].append(q["id"])
    rows=[]
    for (g,s),p in sorted(per.items()):
        rows.append({"grade":g,"skill":s,"n":p["n"],"distinct_prompts":len(p["prompts"]),"distinct_prompt_answer":len(p["pc"]),"distinct_correct_texts":len(p["ans"])})
    res[site]={"questions":len(qs),"answer_position_counts":dict(pos),"issue_counts":{k:len(v) for k,v in issues.items()},"issue_examples":{k:v[:8] for k,v in issues.items()},"by_grade_skill":rows}
json.dump(res,open(out,"w"),ensure_ascii=False,indent=1)
for s,r in res.items():
    print(s,r["questions"],r["answer_position_counts"],r["issue_counts"])
    bad=[x for x in r["by_grade_skill"] if x["distinct_prompt_answer"]<x["n"]*0.5]
    print(" low-diversity groups (<50% distinct prompt+answer):",len(bad),"of",len(r["by_grade_skill"]))
