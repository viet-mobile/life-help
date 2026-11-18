#!/usr/bin/env python3
"""Honest counts of the English bank -> docs/english-bank/status.md.    python3 scripts/learn/english-bank/status.py
All numbers come from the files: english-draft.json (served) + english-pending.json (authored, not served) + ledger.json + the catalog."""
import json,re,collections,hashlib
R='/home/user/life-help/'
B=R+'lib/learn/content/bank/'
served=json.load(open(B+'english-draft.json'))['questions']
pending=json.load(open(B+'english-pending.json'))['questions']
unlinked=json.load(open(B+'english-unlinked.json'))['questions']
led=json.load(open(R+'scripts/learn/english-bank/ledger.json'))
plan=json.load(open(R+'scripts/learn/english-bank/plan.json'))
cat=set()
for f in ('elementary','secondary','demo'):
    for s in json.load(open(R+f'lib/learn/content/{f}/english.json'))['catalog']['skills']: cat.add(s['id'])
cur={x['code'] for x in json.load(open(R+'lib/learn/curriculum/kr/2022/english.json'))['achievement_standards']}
sample=set(json.load(open(R+'scripts/learn/english-bank/reviews/sample-799-questions.json'))['questions'])
lv={s['id']:s['level'] for s in plan['skills']}
def grp(q):
    L=lv[q['skillId']]
    if L in('E1','E2'): return 'E1-E2 (공식 교육과정 밖 확장)'
    if L[0]=='E': return 'E3-E6 (초 3~6학년)'
    if L[0]=='M': return '중등 M1-M3'
    return '고등 H1-H3'
mask=lambda t: re.sub(r'\s+',' ',re.sub(r'[^\w가-힣 ]',' ',re.sub(r'\d+','#',t.lower()))).strip()
def exact(q): return (q['prompt'],tuple(sorted(o['text'] for o in q.get('options',[]))),json.dumps(q['answer'],sort_keys=True))
def norm(q): return (mask(q['prompt']),tuple(sorted(mask(o['text']) for o in q.get('options',[]))))
def frame(q):  # names / capitalised words masked: catches name and word substitution
    t=re.sub(r'\b[A-Z][a-z]+\b','<N>',q['prompt']); return (mask(t),)
item=lambda q:q['id'].split('-')[1]
def frame2(q):  # prompt + options, names masked: the choose-the-sentence stem is the same for 1,300+ questions, so the options carry the content
    nm_=lambda t: re.sub(r'\b[A-Z][a-z]+\b','<N>',t)
    return (mask(nm_(q['prompt'])),tuple(sorted(mask(nm_(o['text'])) for o in q.get('options',[]))))
def passage(q):
    return q['prompt'].split('\n\n')[0] if ('rq' in q['tags'] or 'dq' in q['tags']) else None
def row(qs):
    ex=len({exact(q) for q in qs}); nm=len({norm(q) for q in qs}); fr=len({frame(q) for q in qs}); fr2=len({frame2(q) for q in qs})
    it=len({item(q) for q in qs}); ps={passage(q) for q in qs}-{None}
    rq=sum('rq' in q['tags'] for q in qs); dq=sum('dq' in q['tags'] for q in qs)
    std=set()
    for q in qs:
        for c in q.get('standards') or []:
            if c in cur: std.add(c)
    return len(qs),ex,nm,fr,fr2,it,len(ps),rq+dq,len(std)
def table(title,qs):
    out=[f'### {title}','','| 구분 | ID 수 | 정확 고유 | 정규화 고유 | 문구 틀 고유(지시문만, 보기 제외) | 틀 고유(지시문+보기, 이름 가림) | 독립 학습 항목 | 고유 지문 | 지문 딸린 질문 | 연결된 성취기준 |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
    g=collections.defaultdict(list)
    for q in qs: g[grp(q)].append(q)
    order=['E1-E2 (공식 교육과정 밖 확장)','E3-E6 (초 3~6학년)','중등 M1-M3','고등 H1-H3']
    tot=[0]*8
    for k in order:
        if k in g:
            r=row(g[k]); out.append(f'| {k} | '+' | '.join(map(str,r))+' |')
    r=row(qs); out.append('| **합계** | '+' | '.join(f'**{x}**' for x in r)+' |')
    return out
allq=served+unlinked+pending
inCat=[q for q in allq if q['skillId'] in cat]; notCat=[q for q in allq if q['skillId'] not in cat]
state=lambda q:'reviewed' if led['reviewed'].get(item(q)) else ('carryOver' if q['id'] in set(led['carryOverQuestions']) else 'pending')
sc=collections.Counter(state(q) for q in allq)
out=['# 영어 문제은행 현황 (자동 생성)','',f'생성: `python3 scripts/learn/english-bank/status.py`. 원본: `english-draft.json`(런타임이 읽음) + `english-pending.json`(작성만 됨, 미공개) + `ledger.json`. 모두 **AI 작성·AI 검토**이며 교사·원어민 검토가 아닙니다.','',
'정의: **정확 고유** = 지문·보기·정답이 글자까지 같지 않은 수. **정규화 고유** = 대소문자·구두점·공백·숫자를 지운 뒤 고유한 수. **문구 틀 고유(지시문만)** = 지시문/지문에서 대문자 이름·낱말을 가린 뒤 고유한 수. 같은 지시문(예: ‘다음 중 문법적으로 옳은 문장은?’)을 쓰는 문장 고르기 문항 1,300여 개가 한 틀로 합쳐지므로 **엄격한 하한**일 뿐 중복 수가 아님. **틀 고유(지시문+보기)** = 보기까지 포함해 이름을 가린 뒤 고유한 수(이름만 바꾼 복제를 잡음). **독립 학습 항목** = 작성된 학습 단위(낱말·문장·지문·대화·독립 문항). **고유 지문** = 서로 다른 독해·대화 지문 수(질문 수와 따로 관리).','']
out+=table('A. 전체 작성분 (공개 여부 무관)',allq)+['']
out+=table('B. 현재 런타임이 읽는 파일(english-draft.json) = 공개 중',served)+['']
out+=table('C. 검토 통과했으나 카탈로그 스킬 없음, 미연결 (english-unlinked.json): 공개 가능 수에 넣지 않음',unlinked)+['']
out+=table('D. 작성만 됨, 미검토, 미공개 (english-pending.json)',pending)+['']
out+=['## 검토·공개 상태','',f'- 독립 검토 완료(strict, `ledger.reviewed` 항목 소속 질문): **{sc["reviewed"]}**',f'- 2026-10-15 운영에 이미 나간 4,031문항(검토 미완, `carryOverQuestions`): **{sc["carryOver"]}** (이 중 799문항은 표본 1회 검토를 받았음. 전수 검토가 아님: `reviews/sample-799-questions.json`)',f'- 작성만 됨, 미검토, 미공개: **{sc["pending"]}**','',
f'## 카탈로그 의존',f'- 공용 카탈로그(`lib/learn/content/{{elementary,secondary,demo}}/english.json`)에 스킬이 있는 질문: **{len(inCat)}**, 없는 질문: **{len(notCat)}** (고등 선택과목 `e.h.*` 7개 스킬). 카탈로그에 없으면 런타임 `skills.has(skillId)`에서 걸러져 학생에게 나가지 않습니다 → 공용 카탈로그 패치 필요(`docs/handoff/20261015-english-shared-code-patches.md`).','',
'## 언어별 제공 가능 수','','영어 은행의 지시·힌트·해설은 한국어로만 작성되어 있어 **한국어 학습자에게만** 제공됩니다(`bank.ts`의 `englishBankQuestions`는 사이트 정본 언어에서만 반환). 다른 46개 언어에는 이 은행의 번역이 없어 0문항입니다(다른 언어로 대체 표시하지 않음).','',
f'| 학습자 언어 | 공개 중 | 제공 가능(카탈로그 보유 + 검토 통과 시) |','|---|---:|---:|',f'| 한국어(ko) | {len(served)} | {len([q for q in inCat])} 작성분 중 검토 통과분만 |','| 나머지 46개 언어 | 0 | 0 (번역 없음) |','']
open(R+'docs/english-bank/status.md','w').write('\n'.join(out))
print('\n'.join(out))
