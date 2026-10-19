#!/usr/bin/env python3
"""Assigns every math thinking task to one of four areas (2022 curriculum style):
number = 수와 연산, relations = 변화와 관계, geometry = 도형과 측정, data = 자료와 가능성.
Output lib/think/math-areas.json {taskId: area|null}. null = could not be placed (reported, shown only under 'all').
Rule order: per-task keyword rules on topic+title (first match wins), then the unit default. Re-run after adding math tasks."""
import json, glob, re, sys, collections
RULES = [
 ("geometry", r"모양 찾기"),
 ("relations", r"로그|지수함수|지수의 대소|밑에 따라|속력"),
 ("data", r"대푯값|산점도|모의실험|꺾은선|그림그래프|막대그래프|줄기와 잎|정규분포|비밀번호|여사건"),
 ("data", r"확률|통계|평균|분산|표준편차|표본|분포|상자그림|사분위|도수|히스토그램|경우의 수|순열|조합|가능성|분류|자료|조사|기댓값|데이터|편향|상관|추정|검정|표로|표와|표의|표만|그래프로|그림 크기|여론|비율의 변화|합의 법칙|곱의 법칙|중복조합|배반|사건|탐구 문제|모집단|이웃으로 분류|경사하강|예측"),
 ("geometry", r"도형|각도|각의|삼각형|사각형|평행사변형|평행선|합동|닮|넓이|부피|둘레|좌표|벡터|공간|포물선|타원|쌍곡선|이차곡선|원의|부채꼴|호의|시계|시각|바늘|축척|피타고라스|수직이등분|수직|작도|입체|정육면체|쌓기나무|무게|들이|길이|거리|각을|각이|모양|대칭|패턴|평행이동|접선의 방정식|준선|초점|마방진"),
 ("number", r"복소수|다항식|인수분해|곱셈공식|나머지|몫|항등식|행렬|집합|명제|필요조건|충분조건|진리집합|대우|증명|소인수|약수|배수|약분|분수|소수|순환|제곱근|근호|실수|정수|유리수|자릿값|세 자리|두 자리|큰 수|수 세기|가르기|모으기|덧셈|뺄셈|곱셈|나눗셈|어림|반올림|짝수|홀수|합성수|지수|거듭제곱|로그|이자|단리|복리|할인|환율|부가세|백분율|증감률|단위 환산|달력|윤년|절댓값|크기 비교|자리 수|수의 크기|이차방정식의 근과 계수|퍼센트"),
 ("relations", r"규칙|대응|비례|비와|비율|문자|식의|방정식|부등식|함수|그래프|수열|급수|극한|연속|미분|접선|적분|넓이.*적분|요금제|일차식|증가|감소|변화|합성|역함수|삼각함수|비교하기|경계|소득|구매력|수요|세금|기울기|배열"),
]
OVERRIDES = {  # tasks whose topic text carries no area word; decided one by one
 "m-01":"number","m-03":"data","m-04":"number","m-10":"relations","m-06":"relations",
 "y-m-01-04":"number","y-m-01-05":"number","y-m-01-13":"relations","y-m-02-03":"geometry","y-m-03-09":"data","y-m-08-10":"relations","y-m-09-02":"geometry",
 "y-m-11-07":"relations","y-m-12-12":"data","y-m-13-03":"number","y-m-13-12":"relations","y-m-17-09":"geometry","y-m-21-04":"geometry","y-m-21-08":"geometry",
 "y-m-22-03":"data","y-m-25-03":"relations","y-m-28-05":"number","y-m-30-02":"geometry","y-m-30-04":"geometry","y-m-35-03":"relations","y-m-37-10":"relations",
 "y-m-38-02":"data","y-m-38-03":"data","y-m-39-03":"data","y-m-41-02":"number","y-m-45-05":"geometry","y-m-45-07":"geometry","y-m-46-03":"geometry","y-m-46-06":"geometry",
 "y-m-54-07":"relations","y-m-54-10":"number","y-m-56-05":"geometry","y-m-59-08":"relations","y-m-62-03":"relations","y-m-62-06":"relations","y-m-63-09":"relations",
 "y-m-65-07":"data","y-m-72-02":"number","y-m-72-04":"relations","y-m-72-08":"number","y-m-72-12":"data","y-m-74-08":"data","y-m-74-09":"data","y-m-74-11":"data",
 "y-m-74-12":"data","y-m-74-13":"data","y-m-75-02":"data","y-m-75-03":"geometry","y-m-77-05":"number","y-m-78-10":"data","y-m-79-02":"data","y-m-80-05":"number","y-m-81-06":"geometry",
 "z-m-01-04":"number","z-m-01-05":"number","z-m-01-06":"number","z-m-01-08":"number","z-m-02-03":"relations","z-m-02-04":"relations","z-m-03-05":"geometry",
 "z-m-04-02":"number","z-m-04-07":"data","z-m-05-10":"number","z-m-07-09":"data","z-m-10-04":"geometry","z-m-14-06":"relations","z-m-20-05":"number","z-m-21-01":"number",
 "z-m-22-06":"number","z-m-25-13":"relations","z-m-26-03":"data","z-m-26-04":"data","z-m-27-01":"data","z-m-28-01":"data","z-m-28-09":"data","z-m-28-10":"data",
 "z-m-28-11":"data","z-m-28-12":"data","z-m-32-06":"geometry","y-m-82-12":"geometry","y-m-37-08":"relations","z-m-28-03":"data","y-m-77-03":"number","y-m-31-06":"data","y-m-31-07":"data","y-m-08-06":"relations","y-m-17-11":"geometry","y-m-21-02":"geometry","y-m-21-05":"geometry","y-m-40-08":"data","y-m-65-02":"data","y-m-72-09":"relations","y-m-80-09":"number","y-m-82-02":"relations","y-m-83-06":"number","z-m-06-09":"relations","z-m-22-10":"number",
}
UNIT = {  # fallback by id prefix (checked longest first)
 "n-m-h1-comb":"data","n-m-h1-eq":"relations","n-m-h1-func":"relations","n-m-h1-geo":"geometry","n-m-h1-ineq":"relations","n-m-h1-logic":"number","n-m-h1-mat":"number",
 "n-m-h2-diff":"relations","n-m-h2-explog":"relations","n-m-h2-integ":"relations","n-m-h2-limit":"relations","n-m-h2-seq":"relations","n-m-h2-trig":"relations",
 "n-m-h3-conic":"geometry","n-m-h3-diffc":"relations","n-m-h3-dist":"data","n-m-h3-est":"data","n-m-h3-integc":"relations","n-m-h3-prob":"data","n-m-h3-serieslim":"relations","n-m-h3-vec":"geometry",
 "x-m-fill-a":"data","x-m-fill-b":"data","x-m-h1":"number","x-m-h2":"relations","x-m-h3":"relations","x-m-m1":"number","x-m-m2":"number","x-m-m3":"number",
 "x-m-e1":"number","x-m-e2":"number","x-m-e3":"number","x-m-e4":"number","x-m-e5":"number","x-m-e6":"number",
 "x-m-el-ai":"data","x-m-el-cul":"relations","x-m-el-econ":"number","x-m-el-job":"number","x-m-el-res":"data","x-m-el-sta":"data",
}
def load():
    tasks = {}
    for f in glob.glob('lib/think/data/**/*.json', recursive=True):
        try: d = json.load(open(f))
        except Exception: continue
        if isinstance(d, list):
            for t in d:
                if isinstance(t, dict) and t.get('subject') == 'math': tasks[t['id']] = t
    return tasks
def unit_default(i):
    for k in sorted(UNIT, key=len, reverse=True):
        if i.startswith(k + '-'): return UNIT[k]
    return None
def classify(t):
    d0 = unit_default(t['id'])
    if t['id'].startswith('n-m-') and d0: return d0, 'unit'   # authored per unit: the unit decides
    if t.get('id') in OVERRIDES: return OVERRIDES[t['id']], 'override'
    s = t.get('topic') or t.get('title') or ''
    for area, rx in RULES:
        if re.search(rx, s): return area, 'kw'
    d = unit_default(t['id'])
    return (d, 'unit') if d else (None, 'none')
if __name__ == '__main__':
    tasks = load(); out = {}; how = collections.Counter(); cnt = collections.Counter(); dis = []
    for i, t in sorted(tasks.items()):
        a, h = classify(t); out[i] = a; how[h] += 1; cnt[a] += 1
        u = unit_default(i)
        if h == 'kw' and u and u != a: dis.append((i, a, u, (t.get('topic') or t['title'])[:60]))
    json.dump(out, open('lib/think/math-areas.json', 'w'), ensure_ascii=False, sort_keys=True, indent=0)
    print(len(out), dict(cnt), dict(how), 'kw-vs-unit disagreements', len(dis))
    if len(sys.argv) > 1: [print(*d, sep=' | ') for d in dis[:int(sys.argv[1])]]
