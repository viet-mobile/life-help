"""Check private Korean bank authoring chunks. Completeness/meaning approval stay separate."""
import argparse,collections,json,re,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--workspace',required=True);p.add_argument('--checkpoint',action='store_true');a=p.parse_args();w=Path(a.workspace);root=Path(__file__).resolve().parents[2]
sources=json.loads((w/'catalog/korean-bank-unique.json').read_text());report={};pending=[]
for locale in ['pcm','tl','ro','fi','cs','hu','af']:
 rows={};files=sorted(f for f in (w/'translations').glob(f'korean-bank-{locale}-[0-9]*.json') if re.fullmatch(rf'korean-bank-{locale}-\d{{4}}-\d{{4}}\.json',f.name))
 for file in files:
  m=re.fullmatch(rf'korean-bank-{locale}-(\d{{4}})-(\d{{4}})\.json',file.name);assert m,file
  data=json.loads(file.read_text());assert set(map(int,data))==set(range(int(m[1]),int(m[2])+1)),('range',file)
  for index,row in data.items():
   i=int(index);assert i not in rows and 0<=i<len(sources),('duplicate/unknown',locale,index)
   source=sources[i];s=row['translation'];assert row['sourceHash']==source['sourceHash'],('stale',locale,i)
   assert isinstance(s,str) and s.strip(),('empty',locale,i)
   assert row['role'] in ['localized_instruction_or_meaning','preserved_learning_target'],('role',locale,i)
   for pattern in [r'\{\w+\}',r'\d+(?:\.\d+)?',r'[가-힣ㄱ-ㆎ]+']:
    assert collections.Counter(re.findall(pattern,s))==collections.Counter(re.findall(pattern,source['source'])),('protected tokens',locale,i,pattern)
   rows[i]=row
 report[locale]={'authoredSourceStrings':len(rows),'requiredSourceStrings':len(sources),'remaining':len(sources)-len(rows),'structuralChecks':'PASS','meaningApproval':'SEPARATE_REQUIRED','runtimeActivated':False}
 pending.append((locale,files))
if a.checkpoint:
 for locale,files in pending:
  dest=root/f'content/learn-translation-work/{locale}/korean-bank';dest.mkdir(parents=True,exist_ok=True)
  for file in files:shutil.copy2(file,dest/file.name)
 shutil.copy2(w/'catalog/korean-bank-unique.json',root/'content/learn-translation-work/source-catalogs/korean-bank-unique.json')
 (root/'release-records/language-expansion-20261020/korean-bank-progress.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
