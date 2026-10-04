# Main-service canonical i18n (Study card + Aircon): `MAIN_SERVICE_I18N_READY = YES`

Separate from the frozen 301-key learning locale package (`lib/learn/i18n/*`): different files, different runtime, different translation job. Nothing here changes `en.ts` or `bank-api-1`.

## Canonical sources
* Korean: `messages/ko.json`; English: `messages/en.json`; Vietnamese (reviewed): `messages/vi.json`.
* Key list (single source of truth): `lib/home/mainServiceKeys.ts` (`MAIN_SERVICE_KEYS`, 21 keys). Tests: `tests/home/main-services.test.ts`.
* Other 35 locales: until the package is merged, `translate()` falls back to English (never Korean).

## Keys (dotted paths into the nested JSON), canonical Korean and English
| key | ko | en |
|---|---|---|
| service.study | 영어/수학 공부 | English & Math Study |
| serviceBadge.study | 학교 공부 | School study |
| study.chooser.aria | 공부 과목 선택 | Choose a study subject |
| study.chooser.title | 어떤 공부를 할까요? | What would you like to study? |
| study.chooser.subtitle | 초등 1학년부터 고등 3학년까지, 짧은 퀘스트와 힌트로 공부해요. | From Grade 1 to Grade 12, learn with short quests and hints. |
| study.chooser.math | 수학 공부 | Study Math |
| study.chooser.mathDesc | 학년에 맞는 수학 퀘스트 | Math quests for your grade |
| study.chooser.english | 영어 공부 | Study English |
| study.chooser.englishDesc | 단어, 문법, 문장 만들기 | Words, grammar and sentence building |
| study.chooser.goTo | {site} 열기 | Open {site} |
| study.chooser.close | 닫기 | Close |
| service.aircon | 에어컨 설치, 수리, 청소 | Air Conditioner Installation, Repair & Cleaning |
| serviceBadge.aircon | 에어컨 | Air conditioner |
| serviceDesc.aircon | 벽걸이·스탠드·시스템 에어컨의 설치와 이전 설치, 고장 점검과 수리, 분해 세척을 가까운 헬퍼가 도와드립니다. | A nearby helper installs or re-installs wall-mounted, floor-standing and ceiling-system units, inspects and repairs faults, and cleans them. |
| serviceProblems.aircon | 에어컨이 시원하지 않거나 물이 새고, 설치 또는 청소가 필요합니다. | My air conditioner does not cool or leaks water, or I need installation or cleaning. |
| serviceSubitems.aircon.aircon-install | 에어컨 설치 | Air conditioner installation |
| serviceSubitems.aircon.aircon-repair | 에어컨 수리 | Air conditioner repair |
| serviceSubitems.aircon.aircon-cleaning | 에어컨 청소 | Air conditioner cleaning |
| supportChecklist.aircon.0 | [설치] 벽걸이 에어컨 신규 설치 (실외기 포함) | [Install] New wall-mounted air conditioner installation (outdoor unit included) |
| supportChecklist.aircon.1 | [수리] 전원은 켜지지만 시원한 바람이 나오지 않음 | [Repair] It powers on but does not blow cold air |
| supportChecklist.aircon.2 | [청소] 벽걸이 에어컨 분해 세척 | [Cleaning] Wall-mounted air conditioner disassembly cleaning |

The request checklist (the existing request fields: selected options + free description + photos) holds 16 options in ko / en / vi / zh / zh-Hant (`lib/request/problemChecklists.ts`, ids `ac-1`..`ac-16`, tagged `[설치] [수리] [청소] [접근]` / `[Install] [Repair] [Cleaning] [Access]`). Other locales get the English text. These option strings are NOT part of the 21 keys; they are a second, later package (below).

## Placeholders and rules
Only `{site}` (in `study.chooser.goTo`; the app substitutes `math.life.help` or `english.life.help`). Copy it byte-identical; no other placeholder, no ICU syntax. Plain text: no markup, no line break, no `$`. Brand names and the host names stay as written. No price in any string. Study strings state only what exists (school math and English, grades 1-12, short quests, hints) and never mention payment, scholarship, certification, ranking or "official".

## Service ids and ordering (constraints the translation package and its tests must keep)
* Home card ids in order: `study, jobHelp, mobileHelp, aircon, boiler, housing, cleaning, hospitalHelp, clog, leakPlumbing, bankHelp, insuranceHelp` (Study immediately before job help; mobile -> aircon -> boiler). The order is the same in every locale: it never depends on the language.
* Marketplace service id `aircon` (11th core service); sub-service ids `aircon-install`, `aircon-repair`, `aircon-cleaning`. `study` is NOT a marketplace service.
* Study destinations are sub-domains (`math.life.help`, `english.life.help`; staging and local variants by environment), never `/study/*` on the main host.

## Translation package for the bulk track (package 4: `feat(i18n): localize new home services`)
Output: `messages/generated/main-services/<locale>.json`, one flat object per locale `{ "<dotted key>": "<string>" }` with EXACTLY the 21 keys, for the 35 locales other than ko / en / vi. Claude merges them with `node scripts/home/merge-main-service-i18n.mjs` (`--check` verifies), which rejects a whole file on a missing or extra key, an empty string, a changed placeholder, markup, Hangul, or an untranslated (all-English) file, never overwrites ko / en / vi, and preserves each file's line endings. Second package (later): the 16 request-checklist options per locale. Tests to generate: a service-order matrix (the same ids in the same order for every locale) and a leakage report.
