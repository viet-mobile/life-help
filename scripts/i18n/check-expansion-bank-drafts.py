"""Validate and checkpoint shared English bank drafts; never activate runtime kits.
This subset is not the complete bank and structural checks are not meaning review.
"""
import argparse,collections,json,re,shutil,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--workspace',required=True);p.add_argument('--checkpoint',action='store_true');a=p.parse_args()
w=Path(a.workspace);root=Path(__file__).resolve().parents[2]
templates=json.loads((w/'catalog/english-bank-template-source.json').read_text())
vocab=json.loads((w/'catalog/english-bank-vocabulary-unique.json').read_text())
report={};pending=[]
def tokens(pattern,text):return collections.Counter(re.findall(pattern,text))
for locale in ['pcm','tl','ro','fi','cs','hu','af']:
 f=w/f'translations/english-bank-{locale}-templates.json';t=json.loads(f.read_text())
 assert set(t)=={x['key'] for x in templates},('template key mismatch',locale)
 texts={}
 for source in templates:
  row=t[source['key']];s=row['translation'];assert row['sourceHash']==source['sourceHash'],('stale template',locale,source['key'])
  assert isinstance(s,str) and s.strip() and not re.search('[가-힣]',s),('empty/Korean',locale,source['key'])
  for pattern in [r'\{\w+\}',r'\d+(?:\.\d+)?']:
   assert tokens(pattern,s)==tokens(pattern,source['source']),('template token changed',locale,source['key'])
  texts[source['key']]=s
 v={};files=sorted(f for f in (w/'translations').glob(f'english-bank-vocabulary-{locale}-[0-9]*.json') if re.fullmatch(rf'english-bank-vocabulary-{locale}-\d{{4}}-\d{{4}}\.json',f.name))
 for file in files:
  for index,row in json.loads(file.read_text()).items():
   assert int(index) not in v,('duplicate vocabulary',locale,index)
   v[int(index)]=row
 assert set(v)==set(range(len(vocab))),('vocabulary coverage',locale,len(v))
 for source in vocab:
  row=v[source['index']];s=row['translation'];assert row['sourceHash']==source['sourceHash'],('stale context',locale,source['index'])
  assert row['role']=='localized_meaning' and isinstance(s,str) and s.strip() and not re.search('[가-힣]',s),('invalid meaning',locale,source['index'])
  assert tokens(r'\{\w+\}',s)==tokens(r'\{\w+\}',source['source']),('placeholder',locale,source['index'])
  for key in source['keys']:
   assert key not in texts,('duplicate mapped key',locale,key)
   texts[key]=s
 extra=w/f'translations/english-bank-{locale}-option-glosses.json'
 extra_count=0
 if extra.exists():
  extra_rows=json.loads(extra.read_text())
  option_sources={o['text'] for q in json.loads((w/'catalog/english-bank-canonical-context.json').read_text()) for o in q.get('options',[])}
  for key,row in extra_rows.items():
   assert key=='w:'+row['source'] and row['source'] in option_sources,('unknown option source',locale,key)
   assert row['sourceHash']==hashlib.sha256(row['source'].encode()).hexdigest(),('stale option source',locale,key)
   value=row['translation'];assert row['role']=='localized_meaning' and isinstance(value,str) and value.strip() and not re.search('[가-힣]',value),('invalid option meaning',locale,key)
   assert key not in texts,('existing key overwritten',locale,key)
   texts[key]=value
  extra_count=len(extra_rows);files.append(extra)
 sentence_counts={}
 for category,role in [('rules','localized_grammar_explanation'),('meanings','localized_sentence_meaning')]:
  catalog=json.loads((w/f'catalog/english-bank-sentence-{category}.json').read_text())
  sentence_files=sorted(f for f in (w/'translations').glob(f'english-bank-sentence-{category}-{locale}-*.json') if re.fullmatch(rf'english-bank-sentence-{category}-{locale}-\d{{4}}-\d{{4}}\.json',f.name))
  seen=set()
  for file in sentence_files:
   match=re.search(r'-(\d{4})-(\d{4})\.json$',file.name);data=json.loads(file.read_text());assert set(map(int,data))==set(range(int(match[1]),int(match[2])+1)),('sentence range',locale,file.name)
   for index,row in data.items():
    i=int(index);assert i not in seen and 0<=i<len(catalog),('sentence duplicate/unknown',locale,i)
    seen.add(i);source=catalog[i];value=row['translation']
    assert row['sourceHash']==source['sourceHash'] and row['contextHash']==source['contextHash'],('sentence stale',locale,i)
    assert row['role']==role and isinstance(value,str) and value.strip() and not re.search('[가-힣]',value),('sentence invalid',locale,i)
    for pattern in [r'\{\w+\}',r'\d+(?:\.\d+)?']:
     assert tokens(pattern,value)==tokens(pattern,source['source']),('sentence token change',locale,i)
    for key in source['keys']:
     assert key not in texts,('sentence key collision',locale,key)
     texts[key]=value
   files.append(file)
  sentence_counts[category]={'authored':len(seen),'required':len(catalog)}
 report[locale]={'sentenceDrafts':sentence_counts,'additionalOptionGlosses':extra_count,'templates':len(t),'contextBoundVocabularyConcepts':len(v),'mappedKeys':len(texts),'structuralChecks':'PASS','meaningApproval':'SEPARATE_REQUIRED','completeBank':False,'runtimeActivated':False}
 pending.append((locale,[f,*files],texts))
if a.checkpoint:
 for locale,files,texts in pending:
  dest=root/f'content/learn-translation-work/{locale}/english-bank';dest.mkdir(parents=True,exist_ok=True)
  for file in files:shutil.copy2(file,dest/file.name)
  (dest/'shared-vocabulary-draft.json').write_text(json.dumps({'locale':locale,'scope':'SHARED_TEMPLATES_AND_VOCABULARY_SUBSET_ONLY','reviewStatus':'NOT_FULLY_INDEPENDENTLY_REVIEWED','texts':texts},ensure_ascii=False,indent=2)+'\n')
 catalog=root/'content/learn-translation-work/source-catalogs'
 for name in ['english-bank-template-source.json','english-bank-vocabulary-unique.json','english-bank-sentence-rules.json','english-bank-sentence-meanings.json']:shutil.copy2(w/'catalog'/name,catalog/name)
 (root/'release-records/language-expansion-20261020/english-bank-shared-drafts.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
