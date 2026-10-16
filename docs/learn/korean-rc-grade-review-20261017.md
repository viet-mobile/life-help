# Korean RC: 공식 학년 판정 불일치 4건 분류 · K6 깊이 (2026-10-17, AI 판정 — 교사 검토 아님)

사용자에게 보이는 공식 학년(급)은 **스킬 단위** 판정(`lib/learn/content/korean/grade-map.json`, 99개)과 그 집계(`course-grades.json`)에서만 나온다. 항목 단위 판정(`item-grades.json`)은 어떤 화면·API에서도 읽지 않는다(코드 검색: 쓰는 곳은 검토 도구뿐). 따라서 항목 판정 불일치는 화면에 나타나는 급 표시를 바꾸지 못한다.

| 항목 | 스킬(공식 급 범위) | 작성자/검토자 | 분류 | 근거 |
|---|---|---|---|---|
| 48c2687c | k.k9.biz_stats (4~5) | 5 / 4 | METADATA_ONLY (+정책 결정 대기: 4-2 vs 5-2 "격식적인 글" 경계) | 두 판정 모두 스킬 범위 4~5 안 |
| 9512d04e | k.k10.culture_deep (4~5) | 5 / 4 | METADATA_ONLY | 4가 범위 안, 판정기가 스킬 이름으로 급 추정(독립 판정자 확인) |
| dbdd19d8 | k.k10.culture_deep (4~5) | 5 / 4 | METADATA_ONLY | 동일 |
| d6e43b05 | k.k10.review_k10 (5, 신뢰도 낮음) | 5 / 4 | METADATA_ONLY | 항목 1급 차이, 화면 영향 없음 |

- **USER_VISIBLE_GRADE_ERROR 0 · COURSE_PLACEMENT_ERROR 0 · TEST_EXPECTATION_ERROR 0 → GRADE_MISMATCH_BLOCKERS = 0.**
- 별도 관찰(4건에 속하지 않음, blocker 아님): 309b4d03(도서관 공지, 검토자 3급)이 5급 스킬 k.k10.media_article 안에 있음. 쉬운 쪽 이탈 1건이며 K10 범위(4~6) 안의 쉬운 연습 문항 → 후속 정리 대상.
- **K6_BLOCKER = NO**: 6급 검토자 판정 65항목을 6급 성취기준으로 감사 → 실질 55 / 너무 쉬움 6 / 불확실 4 / 어휘만 어려움 0. 명백한 학년 수준 오류(문항이 급 표시와 어긋나 학습자를 오도) 없음. 후속(blocker 아님): 6급은 읽기 65개뿐(듣기·말하기·쓰기 0), 통계·제목 비판 유형 편중, 문학·논문·전문 분야 지문 부족. 선택형은 실제 말하기·쓰기 평가가 아니다.
