# 영어 힌트: 검토 결과와 남은 한계 (2026-10-17, AI 검토 — 교사·원어민 검토 아님)

## 무엇을 했나
- 대상: 반복 템플릿 힌트를 근거 단계형 힌트로 새로 쓴 3,999 단위(5,985문항). 전수를 독립 AI가 검토 → 480문항(8.0%) 결함 표시(정답 노출 317·잘못된 단서 129·반복 29·한국어 9) → 해당 힌트 제거 후 434단위 재작성 → 재작성분 544문항 재검토 → 45문항(8.3%) 재차 결함 → **그 45문항은 일반 힌트로 되돌림(개선 집계 제외)**.
- 최종 신규 표본 200문항(개선 힌트 150 + 일반 힌트 50, 무작위): 개선 힌트 150 중 결함 15문항(10.0%: 정답 노출 12·잘못된 단서 1·반복 2). 발견된 결함은 제거(개선 힌트 쪽 17건 중 해당 항목), 표본에 잡히지 않은 나머지에는 같은 비율의 결함이 남아 있을 수 있음.
- 일반(규칙 생성) 힌트 50 중 40문항에서 결함 표시(GENERIC 27, 정답 노출 11, 잘못된 단서 2, 반복 1). 즉 일반 힌트가 개선 힌트보다 나쁘다. 아직 일반 힌트로 남은 문항이 약 9,100개다.

## 현재 수치(최종 빌드)
- 서비스 영어 문항 14,981: 근거 단계형 힌트 사용 ≈5,850문항(전수 1회 + 재작성분 재검토를 통과한 것), 나머지 일반 힌트.
- 첫 힌트가 5개 이상 문항에서 똑같은 문항은 이전 10,778 → 6,881(여전히 많음: pick/cloze 의 1번 힌트는 템플릿).

## 남은 한계(완료 아님)
- 표본 검토는 완료 증명이 아니다. 개선 힌트의 표본 결함률 10%는 나머지에도 있을 것으로 본다. 정답 노출형 결함은 가장 위험하므로 운영 배포 전 추가 전수 점검 또는 힌트 비활성화 결정이 필요하다.
- 일반 힌트(약 9,100문항)의 정답 노출 표본 22%(11/50)는 규칙 생성기()의 한계다. 이 문항들은 이번에 고치지 않았다.
- 옵션 위치 참조는 lint R2로 기계 검사(0건).
- 아래 13건은 신규 힌트가 아니라 규칙 생성 힌트의 결함으로, 이번 표본에서 발견만 하고 고치지 않았다:

  - eb-d41bb5ae-dict LEAK: Hint 2 gives the first word "Who" of the dictation answer
  - eb-c37279db-order LEAK: Hint 2 gives the first word "How" of the correct order
  - eb-18ab9b34-order LEAK: Hint 2 gives the first word "The" of the correct order
  - eb-d5d446d8-spell LEAK: Hint 2 gives first letter "t" of key (uninformative, all options start with t)
  - eb-6f20e2c4-listen WRONG: Hint 2 cites -s/-ed endings, but options differ in willn't/to/don't will, not endings
  - eb-bd9b7c88-order LEAK: Hint2 gives first word "If" of the ordering key
  - eb-a316a818-dict LEAK: Hint2 gives first word "Born" of the dictation key
  - eb-89f9da26-spell RESTATE: Hint2 first letter "a" is shared by all options; adds nothing
  - eb-d5d446d8-koen LEAK: hint2 gives first letter t of the key
  - eb-c210716f-dict LEAK: Hint 2 gives the first word "My" of the dictation answer
  - eb-ecf9e352-order LEAK: Hint 2 gives first word "Two" of the key sentence
  - eb-9bf407e3-order LEAK: Hint 2 gives first word "The" of the key sentence
  - eb-97353c31-spell WRONG: Hint 1 says doubled letters but no option has double letters; hint 2 first letter s is common to all options
