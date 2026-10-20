"""Validate authored math-bank drafts, then checkpoint them OUTSIDE runtime overlays.
A complete bank draft is not a complete locale. This tool never creates/fills missing course translations.
"""
from pathlib import Path
import argparse,json,re,hashlib,collections
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--source-dir',required=True);p.add_argument('--locales',nargs='+',required=True);a=p.parse_args();D=Path(a.source_dir)
source=json.loads((ROOT/'content/learn-overlays/en/math.json').read_text())['bank']
def flat(x,p=()):
 if isinstance(x,dict):
  for k,v in x.items():yield from flat(v,p+(k,))
 elif isinstance(x,list):
  for i,v in enumerate(x):yield from flat(v,p+(i,))
 elif isinstance(x,str):yield p,x
src=dict(flat(source));reports={}
for locale in a.locales:
 raw=(D/f'math-bank-{locale}.json').read_bytes();data=json.loads(raw);rows=dict(flat(data));assert set(src)==set(rows),(locale,'keys')
 for path,s in src.items():
  t=rows[path];assert t.strip(),(locale,path,'empty')
  assert collections.Counter(re.findall(r'\{\w+\}',s))==collections.Counter(re.findall(r'\{\w+\}',t)),(locale,path,'placeholder')
  assert collections.Counter(re.findall(r'\d+(?:\.\d+)?',s))==collections.Counter(re.findall(r'\d+(?:\.\d+)?',t)),(locale,path,'number')
  assert collections.Counter(re.findall(r'\$[^$]+\$',s))==collections.Counter(re.findall(r'\$[^$]+\$',t)),(locale,path,'formula')
  assert not re.search('[가-힣]',t),(locale,path,'Korean residue')
 dest=ROOT/'content/learn-translation-work'/locale;dest.mkdir(parents=True,exist_ok=True);(dest/'math-bank.json').write_bytes(raw)
 evidence=[]
 for reviewFile in D.glob('math-bank-independent-review*.json'):
  review=json.loads(reviewFile.read_text())
  evidence.extend(r for r in review.get('entries',[]) if r.get('locale',review.get('locale'))==locale)
 reports[locale]={'templates':len(data['templates']),'texts':len(data['texts']),'stringPositions':len(rows),'sha256':hashlib.sha256(raw).hexdigest(),'structuralChecks':'PASS','independentMeaningReview':'AI_REVIEW_PERFORMED_WITH_OPEN_FINDINGS' if evidence else 'NOT_DONE','reviewedFieldRecords':len(evidence),'allMeaningFindingsResolved':False,'runtimeOverlayCreated':False}
out=ROOT/'release-records/language-expansion-20261020/math-bank-progress.json';out.write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n');print(json.dumps(reports,ensure_ascii=False,indent=2))
