"""Check incremental English/Korean course translations, keeping source and target-language roles distinct.
This preserves drafts outside runtime overlays; mechanical checks are not semantic approval.
"""
from pathlib import Path
import argparse, collections, hashlib, json, re, shutil

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser()
p.add_argument('--catalog', required=True)
p.add_argument('--translations', required=True)
p.add_argument('--subject', required=True, choices=['english', 'korean'])
p.add_argument('--checkpoint', action='store_true')
a = p.parse_args()
source = {r['index']: r for r in json.loads(Path(a.catalog).read_text())}
directory = Path(a.translations)
roles = {'localized_instruction_or_meaning','localized_shared_technical_term','preserved_learning_target'}
canonical = {section:{} for section in ['skills','courses','units','lessons','questions']}
if a.subject == 'english':
    for section in ['elementary','demo','secondary']:
        bundle = json.loads((ROOT/f'lib/learn/content/{section}/english.json').read_text())
        for skill in bundle['catalog']['skills']: canonical['skills'][skill['id']] = skill['title']
        for course in bundle['catalog']['courses']:
            canonical['courses'][course['id']] = course
            for unit in course['units']:
                canonical['units'][unit['id']] = unit['title']
                for lesson in unit['lessons']: canonical['lessons'][lesson['id']] = lesson
        for question in bundle['questions']:
            canonical['questions'][question['id']] = {**question,'options':{o['id']:o['text'] for o in question.get('options',[])}}
report = {}
checkpoint_files = []
for locale in ['pcm','tl','ro','fi','cs','hu','af']:
    records, files = {}, []
    for file in sorted(directory.glob(f'{a.subject}-course-{locale}-*.json')):
        match = re.fullmatch(rf'{a.subject}-course-{locale}-(\d{{4}})-(\d{{4}})\.json', file.name)
        if not match:
            continue
        rows = json.loads(file.read_text())
        assert set(map(int,rows)) == set(range(int(match[1]),int(match[2])+1)), (file,'range')
        for key, row in rows.items():
            index = int(key)
            assert index in source and index not in records, (file,index,'unknown/duplicate')
            reference = source[index]
            text = row['translation']
            assert row['sourceHash'] == reference['sourceHash'], (file,index,'stale source')
            assert isinstance(text,str) and text.strip(), (file,index,'empty')
            assert row['role'] in roles, (file,index,'unreviewed role')
            count = lambda pattern, value: collections.Counter(re.findall(pattern,value))
            for label, pattern in [('number',r'\d+(?:\.\d+)?'),('placeholder',r'\{\w+\}'),('math',r'\$[^$]+\$')]:
                assert count(pattern,reference['source']) == count(pattern,text), (file,index,label)
            if a.subject == 'english':
                assert not re.search('[가-힣]',text), (file,index,'Korean prose')
                if row['role'] == 'preserved_learning_target':
                    for path in reference['paths']:
                        original = canonical
                        for part in path: original = original[part]
                        assert not re.search('[가-힣]',original), (file,index,'English reference hides canonical meaning/instructions; role needs review')
            else:
                # Korean learning targets remain Korean; they must not be mistaken for untranslated instructions.
                assert count('[가-힣ㄱ-ㆎ]+',reference['source']) == count('[가-힣ㄱ-ㆎ]+',text), (file,index,'Korean target changed')
            records[index] = row
        files.append({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
        checkpoint_files.append((locale,file))
    report[locale] = {'authoredUniqueStrings':len(records),'requiredUniqueStrings':len(source),
                      'remaining':len(source)-len(records),'roles':dict(collections.Counter(r['role'] for r in records.values())),
                      'structuralChecks':'PASS','meaningApproval':'NOT_ESTABLISHED_BY_THIS_CHECK',
                      'runtimeOverlayCreated':False,'files':files}
if a.checkpoint:
    # A failure in a later locale must not leave newly copied, unchecked batches.
    for locale,file in checkpoint_files:
        dest = ROOT/'content/learn-translation-work'/locale/f'{a.subject}-course'
        dest.mkdir(parents=True,exist_ok=True)
        shutil.copy2(file,dest/file.name)
out = ROOT/'release-records/language-expansion-20261020'/f'{a.subject}-course-progress.json'
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({loc:{k:v for k,v in row.items() if k!='files'} for loc,row in report.items()},indent=2))
