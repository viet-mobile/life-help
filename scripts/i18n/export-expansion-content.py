"""Hash-bound source inventory for the seven-language expansion. Exports no student-visible answer keys.
No English text is relabeled as a translation; output files are authoring INPUTS only.
"""
from pathlib import Path
import json,hashlib,argparse,collections
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--out',required=True);args=parser.parse_args();OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
read=lambda rel:json.loads((ROOT/rel).read_text())
files={}; stats={}
def save(name,obj):
 text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n';(OUT/name).write_text(text);files[name]=sha(text)
def flat(x,path=()):
 if isinstance(x,dict):
  for k,v in x.items():yield from flat(v,path+(k,))
 elif isinstance(x,list):
  for i,v in enumerate(x):yield from flat(v,path+(i,))
 elif isinstance(x,str) and x.strip():yield path,x

def table(name,obj,context):
 rows=[{'path':list(p),'source':s,'sourceHash':sha(s)} for p,s in flat(obj)]
 save(name+'.json',{'purpose':'TRANSLATION_SOURCE_NOT_TRANSLATION','context':context,'rows':rows})
 stats[name]={'positions':len(rows),'uniqueSourceStrings':len(set(r['source'] for r in rows)),'characters':sum(len(s) for s in set(r['source'] for r in rows))}
for site in ['math','english']:
 ov=read('content/learn-overlays/en/'+site+'.json');ov.pop('bank',None)
 table(site+'-course',ov,{'referenceLanguage':'en','mustReadCanonical':True,'canonicalFiles':['lib/learn/content/'+d+'/'+site+'.json' for d in ['elementary','demo','secondary']],'policy':'Translate instructions and meaning choices; preserve mathematical notation and language-learning target text. English reference is not gender evidence.'})
 save(site+'-canonical-context.json',[read('lib/learn/content/'+d+'/'+site+'.json') for d in ['elementary','demo','secondary']])
k=read('lib/learn/content/korean/korean.json');ov={z:{} for z in ['skills','courses','units','lessons','questions']}
for s in k['catalog']['skills']:ov['skills'][s['id']]=s['title']
for c in k['catalog']['courses']:
 ov['courses'][c['id']]={'title':c['title'],'world':{z:c['world'][z] for z in ['name','tagline']}}
 for u in c['units']:
  ov['units'][u['id']]=u['title']
  for l in u['lessons']:ov['lessons'][l['id']]={z:l[z] for z in ['title','concept','example']}
for q in k['questions']:
 ov['questions'][q['id']]={z:q[z] for z in ['prompt','hints','explanation']};ov['questions'][q['id']]['options']={o['id']:o['text'] for o in q.get('options',[])}
table('korean-course',ov,{'referenceLanguage':'en','policy':'Preserve target Korean spelling, sentences and grammar examples. Translate instructions, meanings, hints and explanations. Level4+ Korean-first policy is unchanged.'})
save('korean-canonical-context.json',k)
mb=read('content/learn-overlays/en/math.json')['bank'];table('math-bank',mb,{'referenceLanguage':'en','canonical':'lib/learn/content/bank/math.json','policy':'Formula, placeholders, units and numeric values are protected. No currency conversion.'})
hs=read('lib/learn/content/bank/math-hs-kit.en.json')['q'];hs={key:{'prompt':v['prompt'],'hints':v['hints'],'explanation':v['expl']} for key,v in hs.items()}
table('math-hs-bank',{'templates':hs}, {'referenceLanguage':'en','canonical':'lib/learn/content/bank/math-hs.json','policy':'All high-school modules, including electives. Preserve formula and constraints.'})
kb=read('lib/learn/content/bank/korean.json');texts={}
for sid,sk in kb['skills'].items():
 for item in sk['items']:
  if item['c']!='syl':texts['g:'+item['id']]=item['g']
  if item.get('s'):texts['s:'+item['id']]=item['s']
  if item.get('n'):texts['n:'+sid+':'+item['n']]=sk['notes'][item['n']]
table('korean-bank',{'templates':read('lib/learn/content/bank/korean-kit.en.json')['templates'],'texts':texts},{'referenceLanguage':'en','canonical':'lib/learn/content/bank/korean.json','policy':'Meaning/situation/note text is localized. Korean target expressions are preserved; notes may include protected Korean examples.'})
save('korean-bank-canonical-context.json',kb)
# The English kit alone is incomplete even in existing locales: include discrete questions as context, not fake placeholder translations.
e=read('lib/learn/content/bank/english-draft.json');qs=e['questions'];safe=[]
for q in qs:
 safe.append({z:q[z] for z in ['id','skillId','prompt','options','hints','explanation','tags'] if z in q})
save('english-bank-canonical-context.json',safe)
table('english-kit-existing',read('scripts/learn/english-bank/kit/en.json')['texts'],{'referenceLanguage':'en','policy':'Existing English kit is a reference subset, NOT the full requirement. Word meanings must not leak the exact answer.'})
save('english-kit-ko-source.json',read('scripts/learn/english-bank/kit-source.json'))
stats['english-bank-context']={'questions':len(qs),'note':'Question part/option/hint/explanation keys require role-aware authoring, including missing English-reference keys. No claim of full key coverage.'}
save('inventory.json',{'format':1,'locales':['pcm','tl','ro','fi','cs','hu','af'],'scope':'ALL_GENERAL_AND_THINKING_BEFORE_RELEASE','englishFallbackAllowed':False,'sourceFiles':files,'counts':stats,'meaningReview':'NOT_DONE','translationCompletion':'NOT_CLAIMED','policy':'Existing-source gender remains unspecified unless explicit in canonical passage. Other questions and translations are not independent evidence.'})
print(json.dumps(stats,ensure_ascii=False,indent=2))
