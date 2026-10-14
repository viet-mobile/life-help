# 번역 감수 자료: km, kn, ml, sg, am, my

**원어민 감수가 아직 이뤄지지 않았습니다.** 이 시트에 적힌 번역은 AI가 만들었고, `auto_flags`는 기계적 검사일 뿐 감수가 아닙니다. 감수자는 `reviewed_translation`, `status`(예: ok / fix / reject), `notes`를 채웁니다.

## 시트

| 파일 | 내용 | 행 |
|---|---|---|
| `<locale>-math-bank.csv` | 수학 문항 은행 새 문구 80개 템플릿(지문·힌트 2·해설). 영어 원문과 대조. 첫 묶음 52개 템플릿은 별도 키트라 이번에 포함하지 않았습니다. | 320 |
| `<locale>-korean-k7-k10.csv` | Gemini의 K7~K10 스킬·레슨·문항(지문·힌트·해설·보기) | 2,080 |

기준 커밋: 수학 문구 `e6da450`, 한국어 `46cbf67`. 재생성: `python3 ../tools/export-review-sheets.py --korean-repo <46cbf67> --math-repo <e6da450> --out .`

## 먼저 알아야 할 점

- **K7~K10 레슨 제목·개념·스킬 제목과 예시는 6개 언어 모두 영어 원문 그대로입니다**(`IDENTICAL_TO_SOURCE`). 번역이 필요한 항목으로 봐야지 감수 대상이 아닙니다. 원문의 한국어 보기 중 번역이 비어 있는 행(`EMPTY`)은 학습 대상 한국어라 번역하지 않는 것이 의도일 수 있어 확인이 필요합니다.
- **보기와 영어 풀이 원문**("friend said coming" 등)이 기계 번역투라 번역 품질 이전에 원문부터 고쳐야 합니다(`../04-korean-k7-k10-findings.md`).
- 아래 위험 용어는 감수자가 우선 봐 주세요.
  - km·kn·ml: 역·이(converse/contrapositive)에 해당하는 명제 용어.
  - am: 판별식·등차수열·극한을 라틴 문자로 둔 부분.
  - sg: 프랑스어 차용어(chiffre, fraction, discriminant 등)로 대체한 부분.
  - my: 등차·등비수열을 미얀마어 뒤 괄호에 영어로 병기한 부분.

## 자동 검사 표시

`EMPTY` 번역 없음, `IDENTICAL_TO_SOURCE` 원문과 동일, `PLACEHOLDER_MISMATCH` `{x}` 자리표시자 불일치, `LATIN_WORDS` 비라틴 문자 언어에 남은 영어 단어, `LENGTH_RATIO` 길이 비율 이상.

수학 은행 시트의 표시된 행 수: km 5, kn 18, ml 18, sg 14, am 33, my 12
