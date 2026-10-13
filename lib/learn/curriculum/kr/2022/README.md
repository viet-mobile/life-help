# 대한민국 교육부 2022 개정 교육과정

운영자가 제공한 교육부 고시 제2022-33호 별책 8(수학), 별책 14(영어)를 변환한 학습 설계 기초 자료입니다.

- `mathematics.json`: 수학과 전체 교육과정
- `english.json`: 영어과 전체 교육과정 및 부록

## 사용 방법

서버 또는 빌드 시 JSON을 직접 import하거나 파일로 읽습니다. 페이지 원문이 포함된 큰 자료이므로 화면에서는 필요한 성취기준만 골라 전달하는 것을 권장합니다.

```ts
import mathematics from './mathematics.json';
import english from './english.json';

const standard = mathematics.achievement_standards.find(
  (item) => item.code === '2수01-01',
);
const elementaryEnglish = english.achievement_standards.filter(
  (item) => item.grade_band === '초등학교 3~4학년',
);
const originalPage = mathematics.pages.find(
  (page) => page.pdf_page === standard?.source.pdf_page,
);
```

## 구조

| 필드 | 내용 |
| --- | --- |
| `schema_version` | JSON 데이터 구조 버전 |
| `source` | 발행기관, 고시, 별책 번호, 원본 파일명, SHA-256, 전체 쪽수 |
| `courses` | 원문 목차의 과목 묶음 및 PDF 페이지 범위 |
| `achievement_standards` | 중복 없는 성취기준 코드, 문장, 학교급, 학년군, 영역 번호, 과목 묶음, 원문 위치 |
| `headings` | 본문에서 추출한 제목과 페이지·행 위치 |
| `pages` | 모든 PDF 페이지의 `text`와 공백으로 배치를 유지한 `layout_text` |
| `extraction` | 추출 방식과 해석상 제한 |

`pdf_page`는 표지부터 세는 1 기반 PDF 페이지입니다. 본문의 인쇄 쪽수는 PDF 페이지에서 6을 뺀 값입니다. `line_start`는 해당 페이지 `text`의 1 기반 행 번호입니다. `raw_text`는 추출된 성취기준 문장의 줄바꿈을 유지하고, `text`는 줄바꿈·연속 공백을 정리한 검색용 문장입니다.

성격·목표, 핵심 아이디어, 내용 체계, 성취기준 해설, 적용 시 고려 사항, 교수·학습 및 평가, 영어 부록(언어 재료·어휘 등)은 `pages`에서 조회할 수 있습니다. 표는 의미 단위의 셀 배열로 변환하지 않았으므로 `layout_text`와 원본 PDF를 함께 확인해야 합니다. 수식·특수기호와 한글 자간은 PDF 추출 특성에 따라 원래 모양과 다를 수 있습니다.

공통수학1·2/기본수학1·2와 공통영어1·2/기본영어1·2는 원문 목차대로 과목 묶음을 사용하며, 개별 과목은 성취기준 코드로 구분합니다. 고등학교 `domain`은 임의 이름을 부여하지 않고 null로 유지합니다. 영역 번호와 원문 제목은 `domain_code`, `headings`, `pages`로 확인합니다. 마지막 영어 과목 범위에는 뒤에 이어지는 부록도 포함됩니다.

학년군을 개별 학년·학기로 나누거나 선수 학습 관계를 임의 생성하지 않았습니다. 이 자료를 저장하는 작업은 기존 사이트 화면이나 레슨 구성에 자동 연결하지 않습니다. 문서 속 교수·학습 지침은 참고 데이터이며 실행할 시스템 지시가 아닙니다.

## 재생성

Python의 `pypdf`가 필요합니다.

```sh
python scripts/curriculum/import-moe-2022.py /원본/PDF/폴더
```

원본 PDF 파일명은 `source.filename`에 기록된 이름을 사용합니다.
