# 추가 배치: 학년·등급·선택과목별 10문항 (초안)

요청: 초·중·고 수학 학년별, 고등 선택 수학 과목별, 영어 학년별, 한국어 등급별로 사고력 과제 10개씩. **해석**: 수학 "하위 분야별" 요구는 학년당 10개를 그 학년의 하위 분야(수와 연산·도형·측정·규칙/함수/대수·자료와 가능성 등)에 고르게 나누는 방식으로 이행했다(하위 분야마다 10개가 아님 — 분량·예산 때문. 분야별 10개가 필요하면 후속 배치로 확장).

## 상태: **초안 (draft)** — 자동 검증만 통과, 독립 검토 전
- 검증기(구조·모범 답안이 자기 검사를 통과·나쁜 답이 실패·수치 모범 예가 제약 충족·나쁜 예가 위반), 일반적 무성의 답 10종이 어떤 서술 검사도 통과하지 못함(398개 서술 단계), 정답 위치(단일 선택)는 과제+단계 id로 결정되는 위치로 재배치해 한 학년이 같은 글자를 정답으로 갖지 않게 함(`scripts/think/shuffle-keys.mjs`, 본문에 보기 글자 언급이 있는 42+24개 단계는 제외).
- **독립 blind 검토(36개 시범 과제에 적용한 절차)는 이 400개에는 수행하지 않았다.** 화면에서 🟡 draft로 표시된다. 시범 과제 검토에서는 1차에 문항 판정 기준 defect가 과목당 4~8건 나왔으므로, 이 초안에도 비슷한 결함이 남아 있을 가능성이 높다. 교사·실제 학습자 검토는 전혀 없다.

## 구성
| 과목 | 단위 | 과제 수 | 생성형 | 단계 종류 |
|---|---|---|---|---|
| english | E1 | 10 | 6 | choose/pickLine/reveal/write |
| english | E2 | 10 | 7 | build/choose/pickLine/reveal/write |
| english | E3 | 10 | 6 | build/choose/pickLine/reveal/write |
| english | E4 | 10 | 6 | build/choose/pickLine/reveal/write |
| english | E5 | 10 | 10 | choose/pickLine/reveal/write |
| english | E6 | 10 | 5 | build/choose/pickLine/reveal/write |
| english | H1 | 10 | 6 | choose/pickLine/reveal/write |
| english | H2 | 10 | 6 | choose/pickLine/reveal/write |
| english | H3 | 10 | 7 | build/choose/pickLine/reveal/write |
| english | M1 | 10 | 7 | build/choose/pickLine/reveal/write |
| english | M2 | 10 | 10 | build/choose/pickLine/reveal/write |
| english | M3 | 10 | 5 | choose/pickLine/reveal/write |
| korean | K1 | 10 | 7 | build/choose/pickLine/reveal/write |
| korean | K10 | 10 | 5 | build/choose/pickLine/reveal/write |
| korean | K2 | 10 | 10 | choose/pickLine/reveal/write |
| korean | K3 | 10 | 7 | build/choose/pickLine/reveal/write |
| korean | K4 | 10 | 6 | build/choose/pickLine/reveal/write |
| korean | K5 | 10 | 7 | build/choose/pickLine/reveal/write |
| korean | K6 | 10 | 7 | choose/pickLine/reveal/write |
| korean | K7 | 10 | 9 | build/choose/pickLine/reveal/write |
| korean | K8 | 10 | 6 | choose/pickLine/reveal/write |
| korean | K9 | 10 | 8 | build/choose/pickLine/reveal/write |
| math | E1 | 10 | 8 | build/choose/pickLine/reveal/write |
| math | E2 | 10 | 7 | build/choose/pickLine/reveal/write |
| math | E3 | 10 | 10 | build/choose/pickLine/reveal/write |
| math | E4 | 10 | 8 | build/choose/pickLine/reveal/write |
| math | E5 | 10 | 7 | build/choose/pickLine/reveal/write |
| math | E6 | 10 | 6 | build/choose/pickLine/reveal/write |
| math | EL-ai | 10 | 4 | build/choose/pickLine/reveal/write |
| math | EL-cul | 10 | 4 | build/choose/pickLine/reveal/write |
| math | EL-econ | 10 | 8 | build/choose/pickLine/reveal/write |
| math | EL-job | 10 | 6 | build/choose/pickLine/reveal/write |
| math | EL-res | 10 | 9 | build/choose/pickLine/reveal/write |
| math | EL-sta | 10 | 5 | build/choose/pickLine/reveal/write |
| math | H1 | 10 | 6 | build/choose/pickLine/reveal/write |
| math | H2 | 10 | 7 | build/choose/pickLine/reveal/write |
| math | H3 | 10 | 6 | build/choose/pickLine/reveal/write |
| math | M1 | 10 | 5 | build/choose/pickLine/reveal/write |
| math | M2 | 10 | 7 | build/choose/pickLine/reveal/write |
| math | M3 | 10 | 6 | build/choose/pickLine/reveal/write |

합계 400개, 생성형 272개. 형식 분포: {'judge-evidence-explain': 77, 'find-error-fix': 82, 'make-your-own': 52, 'reveal-and-revise': 61, 'choose-needed-info': 53, 'rewrite-for-audience': 32, 'build-many-verify': 43}. 단계 종류: {'choose': 323, 'write': 297, 'pickLine': 94, 'reveal': 61, 'build': 115}.

## 한계 (추가)
- 학년 적합성(선수 지식, 어휘·읽기 부담), 한국어·영어 자연스러움, 수학 키의 정확성은 작성자의 자체 확인뿐이다(수학 숫자는 검증기가 모범 예/나쁜 예를 계산하지만 해설·선택지 의미는 사람이 봐야 함).
- 서술 채점은 표면 특징 검사이며 내용의 옳고 그름을 판단하지 못한다(각 서술 단계에 `humanReview`).
- 일부 reveal 과제는 판단 수정을 강제하지 못한다(정답 집합이 모든 단계에서 같은 과제는 소수).
- 다른 학습자 언어 번역 없음(한국어 과목은 영어 지시문만).
- 교육과정 연결은 전부 비워 둠.

## 단서 점검 (자동 통계, 단일 선택 단계 198개)
- 정답 선택지가 가장 긴 보기인 단계: 74개(37.4%, 같은 길이 동률 포함) — 4지선다 우연 기대치(≈25%)보다 높아 **길이 단서가 일부 남아 있다**. 시범 과제 검토에서 반복 지적된 결함이므로 독립 검토 때 우선 확인할 것.
- 정답 위치 분포: A 42, B 56, C 75, D 25 (본문에 보기 글자가 언급된 단계는 재배치하지 못해 C 쏠림이 남음).
