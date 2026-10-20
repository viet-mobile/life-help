"""Check hash-bound, incremental translation batches without inventing missing translations.
Only a complete locale can be assembled; incomplete drafts remain outside runtime content.
"""
from pathlib import Path
import argparse,json,re,hashlib,collections,shutil
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--catalog',required=True);p.add_argument('--translations',required=True);p.add_argument('--checkpoint',action='store_true');a=p.parse_args()
# Visible prose inside LaTeX \text{} is localized; the surrounding math structure stays protected.
normalize_math_labels=lambda text:re.sub(r'\\text\{[^{}]*\}',r'\\text{LOCALIZED_LABEL}',text)
source=json.loads(Path(a.catalog).read_text());src={r['index']:r for r in source};D=Path(a.translations);report={}
for loc in ['pcm','tl','ro','fi','cs','hu','af']:
 entries={};files=[]
 for f in sorted(D.glob('math-course-'+loc+'-*.json')):
  m=re.fullmatch('math-course-'+loc+r'-(\d{4})-(\d{4})\.json',f.name)
  if not m:continue
  data=json.loads(f.read_text());expected=set(range(int(m[1]),int(m[2])+1));assert {int(k) for k in data}==expected,(f,'range')
  for i,record in data.items():
   n=int(i);assert n in src and n not in entries,(f,n,'unknown/duplicate index')
   s=src[n]['source'];t=record['translation'];assert record['sourceHash']==src[n]['sourceHash'],(f,n,'stale source')
   assert isinstance(t,str) and t.strip(),(f,n,'empty')
   assert collections.Counter(re.findall(r'\{\w+\}',normalize_math_labels(s)))==collections.Counter(re.findall(r'\{\w+\}',normalize_math_labels(t))),(f,n,'placeholder')
   assert collections.Counter(re.findall(r'\d+(?:\.\d+)?',s))==collections.Counter(re.findall(r'\d+(?:\.\d+)?',t)),(f,n,'number')
   assert collections.Counter(re.findall(r'\$[^$]+\$',normalize_math_labels(s)))==collections.Counter(re.findall(r'\$[^$]+\$',normalize_math_labels(t))),(f,n,'LaTeX')
   assert not re.search('[가-힣]',t),(f,n,'unexpected Korean prose')
   entries[n]=record
  files.append({'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
  if a.checkpoint:
   target=ROOT/'content/learn-translation-work'/loc/'math-course';target.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target/f.name)
 report[loc]={'authoredUniqueStrings':len(entries),'requiredUniqueStrings':len(src),'remaining':len(src)-len(entries),'sourcePositionsCovered':sum(len(src[n]['paths']) for n in entries),'structuralChecks':'PASS','independentMeaningReview':'NOT_DONE','runtimeOverlayCreated':False,'files':files}
path=ROOT/'release-records/language-expansion-20261020/math-course-progress.json';path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({l:{k:v for k,v in r.items() if k!='files'} for l,r in report.items()},indent=2))
