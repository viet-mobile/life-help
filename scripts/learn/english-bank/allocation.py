#!/usr/bin/env python3
"""Writes docs/english-bank/allocation.md from plan.json, the English catalog and the 2022 curriculum review.  python3 scripts/learn/english-bank/allocation.py"""
import json,collections
R='/home/user/life-help/'
plan=json.load(open(R+'scripts/learn/english-bank/plan.json'))
cat=set()
for f in ('elementary','secondary','demo'):
    for s in json.load(open(R+f'lib/learn/content/{f}/english.json'))['catalog']['skills']: cat.add(s['id'])
cur=json.load(open(R+'lib/learn/curriculum/kr/2022/english.json'))
crs={c['id']:c['title'] for c in cur['courses']}
rev={e['code']:e['status'] for e in json.load(open(R+'docs/learning/curriculum-mappings/reviewed.json'))['english']}
bank=json.load(open(R+'lib/learn/content/bank/english-draft.json'))['questions']
have=collections.Counter(q['skillId'] for q in bank)
band=lambda lv:{'E1':'E1-E2 (공식 교육과정 밖 확장)','E2':'E1-E2 (공식 교육과정 밖 확장)','E3':'E3-E4 (초 3~4학년)','E4':'E3-E4 (초 3~4학년)','E5':'E5-E6 (초 5~6학년)','E6':'E5-E6 (초 5~6학년)'}.get(lv,lv)
rows=collections.defaultdict(lambda:[0,0,0,0])
for s in plan['skills']:
    lv=s['level']; k=band(lv) if s['group']=='E' else ('중등 '+lv if s['group']=='M' else '고등 '+lv)
    r=rows[(s['group'],k)]
    r[0]+=1; r[1]+=s['target']; r[2]+=have[s['id']]; r[3]+= (0 if s['id'] in cat else s['target'])
out=['# 영어 문제은행 배분표 (잠정, 2026-10-15)','',
'생성: `python3 scripts/learn/english-bank/allocation.py`. 수량은 **계획 목표**(`plan.json`)와 **현재 저장소에 있는 초안**(`lib/learn/content/bank/english-draft.json`)을 구분합니다. 문항 수는 ID 기준이며 중복 제거·독립 항목·검토 수는 `docs/english-bank/status.md`에 따로 둡니다.','',
'## 1. 학교급별 목표와 현재 저장소 보유량','',
'| 학교급 | 구분 | 스킬 수 | 계획 목표(ID) | 저장소 초안(ID) | 카탈로그에 없는 스킬의 목표 |','|---|---|---:|---:|---:|---:|']
tot=collections.Counter()
for (g,k),r in sorted(rows.items(), key=lambda x:(x[0][0],x[0][1])):
    out.append(f'| {"초등" if g=="E" else "중등" if g=="M" else "고등"} | {k} | {r[0]} | {r[1]} | {r[2]} | {r[3]} |')
    tot[g+'t']+=r[1]; tot[g+'h']+=r[2]; tot[g+'o']+=r[3]
out+=['',f'합계(계획 목표): 초등 {tot["Et"]} · 중등 {tot["Mt"]} · 고등 {tot["Ht"]} = {tot["Et"]+tot["Mt"]+tot["Ht"]}. 저장소 초안: 초등 {tot["Eh"]} · 중등 {tot["Mh"]} · 고등 {tot["Hh"]} = {tot["Eh"]+tot["Mh"]+tot["Hh"]}.','',
'**카탈로그에 없는 스킬**(`proposed: true`)의 문항은 현재 런타임이 `skills.has(skillId)`로 걸러 내므로 **학생에게 나가지 않습니다.** 고등 선택과목 7개 스킬(목표 합 '+str(tot['Ho'])+')은 공용 카탈로그(`lib/learn/content/secondary/english.json`)에 스킬이 추가되어야 공개 수량에 넣을 수 있습니다. 이는 공용 파일 변경이라 패치로 인계합니다(`docs/handoff/20261015-english-shared-code-patches.md`).','',
'## 2. 2022 개정 영어과 성취기준(270개)과 현재 반영 상태','',
'`docs/learning/curriculum-mappings/reviewed.json`(정규 과정 기준, Claude 자동 검토; 교사·원어민 미검토)의 상태입니다. 은행 문항은 아직 이 매핑에 반영되지 않았습니다.','',
'| 학교급 | 과목 | 성취기준 수 | covered | partial | gap |','|---|---|---:|---:|---:|---:|']
t=collections.defaultdict(collections.Counter)
for x in cur['achievement_standards']: t[(x['school_level'],x['course_id'])][rev[x['code']]]+=1
lv={'elementary':'초등','middle':'중등','high':'고등'}
for (l,c),v in sorted(t.items()): out.append(f'| {lv[l]} | {crs[c]} | {sum(v.values())} | {v["covered"]} | {v["partial"]} | {v["gap"]} |')
tt=collections.Counter()
for v in t.values(): tt.update(v)
out+=['',f'합계: covered {tt["covered"]} · partial {tt["partial"]} · gap {tt["gap"]} (총 {sum(tt.values())}).','',
'## 3. 배분 원칙',
'- 목표: 정규 과정 문항을 제외한 공개 가능한 은행 문항 12,000개 이상, 초·중·고 각 3,330개 이상(중복·오류 제거 후). E1·E2는 공식 교육과정 밖 확장 콘텐츠로 구분해 따로 센다.',
'- 문법 빈칸만 늘리지 않는다. 대화·독해·듣기·문맥 속 어휘·정보 통합·추론 형식을 스킬마다 섞는다(스킬별 `mix`).',
'- gap이 많은 영역을 먼저 채운다: 초등 이해·표현 영역(gap 24), 중등 표현(gap 10), 고등 선택과목(직무 영어 8, 영어 발표와 토론 16, 영미 문학 읽기 8, 실생활 영어 회화 9, 미디어 영어 10, 세계 문화와 영어 10은 전부 gap).',
'- 듣기 문항은 실제 음성 제시(영어 TTS 문장)와 문항이 일치해야 하며, 선택형 인지 문제를 말하기·쓰기 수행 평가로 보고하지 않는다.',
'']
open(R+'docs/english-bank/allocation.md','w').write('\n'.join(out))
print('\n'.join(out))
