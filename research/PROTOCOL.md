# 비자 서류 정보 조사 프로토콜 (LIFE.HELP 비자 서류 정보 페이지용)
오늘 날짜: 2026-10-21. 입력: research/batch-NN-assignment.json (조사할 목적지 국가 목록: slug, iso2, nameEn). 출력: lib/visa/data/batches/batch-NN.json 에 **DestinationVisaInfo 배열**(스키마는 lib/visa/types.ts 를 읽고 그대로 따를 것)을 쓴다. 용도: 해당 국가에 사는/입국하려는 외국인이 자기 비자 유형의 필요 서류와 신청 링크를 찾는 **정보 제공** 페이지. 서비스 신청이 아니다.

## 절대 규칙
1. **공식 출처만**: 해당 국가 정부·출입국·외교부·공식 e-Visa 포털(예: .gov, .go.kr, .gouv.fr 등 해당 국가 정부 도메인)의 페이지만 링크한다. 블로그·행정사·대행업체·위키백과·여행사·비공식 요약 링크 금지. 확실히 공식 도메인인지 모르면 넣지 말고 비워 둔다.
2. **지어내지 말 것**: 열어서(WebFetch) 실제로 확인한 URL·비자 유형명·서류 항목·체류일수만 기록한다. 확인 못 한 것은 생략하고(빈 배열/null) status를 "partial"로 둔다. 추측·기억 기반 URL 금지. 모든 URL은 실제로 열어 보고 verifiedAt에 2026-10-21을 쓴다. 링크가 404이거나 로그인 벽이면 제외.
3. **저작권**: 공식 페이지 문장을 길게 복사하지 말고 서류 항목은 짧은 사실 항목(예: "Passport valid for 6 months", "Photo")으로 요약해 docs[].text에 영어로 쓰고 그 출처 페이지 URL을 sourceUrl에 둔다(조항 문구 그대로 길게 인용 금지).
4. 비자 유형명(visaTypes)은 당국이 부르는 공식 명칭 그대로(예: D-2, "Student visa (subclass 500)", "Tier 4").
5. 개인정보·신청 대행·수수료 안내를 하지 않는다(요금은 공식 링크만, 금액 단정 금지).

## 조사할 내용 (목적지 국가마다)
- officialPortals: 출입국/비자 주무 부처 공식 포털 1~3개(kind "info"), 공식 e-Visa/ETA/전자여행허가 신청 포털이 있으면 kind "evisa", 신청 양식 다운로드(PDF/양식 페이지)가 있으면 kind "form", 서류 체크리스트 공식 페이지는 kind "checklist". 각 링크에 title(공식 제목), langs(해당 페이지 언어 코드).
- purposes: 7개 목적 각각 — marriage(결혼·배우자/가족 결합), work(근로·취업), travel(여행·관광), study(유학), business(사업·투자·출장), visit(방문·친지/초청 방문), other(기타: 주재, 연수, 의료, 종교 등 주요 비자). 해당 국가에 그 목적 비자가 없거나 확인 못 하면 그 키를 생략. 각 목적: visaTypes[], links[](해당 비자의 공식 안내·양식·e-Visa 링크), docs[](공식 페이지에 나온 핵심 제출서류 5~12개 짧은 항목, 출처 sourceUrl).
- entryRules: 국적별 무비자/전자허가/비자필요 규정. **공식 페이지가 국적 목록을 제시하는 경우에만** 구조화한다: nationalities(ISO 3166-1 alpha-2 목록), status(visa_free / eta_or_evisa / visa_required / unknown), days(최대 체류일수, 모르면 null), note(조건: 여권 유효기간·목적 제한 등 짧게), sourceUrl. 국적 수가 많아도 같은 조건끼리 묶는다. 공식 목록을 읽을 수 없거나 너무 불분명하면 entryRules는 비워 두고 entryRulesSource에 그 공식 목록 페이지 URL만 적는다. 다른 나라 위키/데이터셋으로 채우지 말 것.
- status: 모든 항목 확인 완료 "verified", 일부만 "partial", 아무것도 못 구하면 "pending". verifiedAt은 2026-10-21.

## 출력
JSON 하나(배열, 배정된 목적지 전부 1개씩, slug/iso2는 입력 그대로). python3 로 검증: 유효한 JSON, URL이 https, 목적 키는 marriage/work/travel/study/business/visit/other 중에서만, entryRules의 nationalities는 2글자 대문자. 마지막 답변은 한 줄: 목적지별 status 요약.
