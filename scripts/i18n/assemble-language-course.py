"""Assemble a complete, hash-bound course draft. Never fill missing fields from English.
Output is private authoring work, not a runtime overlay or semantic-review approval.
"""
import argparse, json, re, hashlib, collections
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--catalog',required=True)
p.add_argument('--translations',required=True)
p.add_argument('--subject',required=True,choices=['english','korean'])
p.add_argument('--locale',required=True,choices=['pcm','tl','ro','fi','cs','hu','af'])
p.add_argument('--output',required=True)
a=p.parse_args()
sources=json.loads(Path(a.catalog).read_text())
rows={}
for file in sorted(Path(a.translations).glob(f'{a.subject}-course-{a.locale}-*.json')):
    if not re.fullmatch(rf'{a.subject}-course-{a.locale}-\d{{4}}-\d{{4}}\.json',file.name):continue
    for index,row in json.loads(file.read_text()).items():
        assert int(index) not in rows,('duplicate',index)
        rows[int(index)]=row
missing=[s['index'] for s in sources if s['index'] not in rows]
if missing:raise SystemExit(f'INCOMPLETE {a.locale}/{a.subject}: {len(missing)} unique strings missing; no overlay created')
assert len(rows)==len(sources),'unknown source indices'
overlay={section:{} for section in ['skills','courses','units','lessons','questions']}
for source in sources:
    row=rows[source['index']]
    assert row['sourceHash']==source['sourceHash'],('stale source',source['index'])
    value=row['translation']
    assert isinstance(value,str) and value.strip(),('empty',source['index'])
    assert row['role'] in ['preserved_learning_target','localized_instruction_or_meaning','localized_shared_technical_term'],('role',source['index'])
    count=lambda pattern,text: collections.Counter(re.findall(pattern,text))
    for kind,pattern in [('number',r'\d+(?:\.\d+)?'),('placeholder',r'\{\w+\}'),('math',r'\$[^$]+\$')]:
        assert count(pattern,value)==count(pattern,source['source']),(kind,source['index'])
    if a.subject=='korean':
        assert count('[가-힣ㄱ-ㆎ]+',value)==count('[가-힣ㄱ-ㆎ]+',source['source']),('protected Korean changed',source['index'])
    else:
        assert not re.search('[가-힣]',value),('Korean fallback',source['index'])
    for path in source['paths']:
        current=overlay
        for i,key in enumerate(path[:-1]):
            child=[] if isinstance(path[i+1],int) else {}
            if isinstance(current,list):
                while len(current)<=key:current.append(None)
                if current[key] is None:current[key]=child
                current=current[key]
            else:current=current.setdefault(key,child)
        last=path[-1]
        if isinstance(current,list):
            while len(current)<=last:current.append(None)
        current[last]=value
text=json.dumps(overlay,ensure_ascii=False,indent=2)+'\n'
output=Path(a.output);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(text)
print(json.dumps({'locale':a.locale,'subject':a.subject,'uniqueStrings':len(rows),'fieldPositions':sum(len(s['paths']) for s in sources),'sha256':hashlib.sha256(text.encode()).hexdigest(),'runtimeActivated':False,'semanticReview':'SEPARATE_REQUIRED'},indent=2))
