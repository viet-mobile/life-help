# 영어 문제 작성 이관: Gemini → Claude (2026-10-15)

## 지시
영어 문제 작성은 이 시점부터 Claude가 맡습니다. **Gemini는 영어·한국어 콘텐츠, `lib/learn/content/**`, `scripts/learn/**`, 은행·독해 파일에 더 이상 커밋하거나 푸시하지 않습니다.** 진행 중이던 작업은 아래 방법으로 보존만 합니다. Claude는 별도 작업 공간(워크트리)과 새 브랜치에서만 작업하고, Gemini 브랜치를 수정·머지·force-push하지 않습니다.

## 보존된 Gemini 커밋 (읽기 전용 스냅샷, 이 세션이 확인한 모든 것)
| 스냅샷 브랜치 | SHA | 내용 |
|---|---|---|
| `snapshot/gemini-english-korean-i18n-46cbf67` | `46cbf67` | `work/english-korean-i18n` 끝: 영어 심화 독해(4과목·56문항), 영어·한국어 은행(400+/레벨), K7~K10 |
| `snapshot/gemini-consolidated-da97f12` | `da97f12` | 통합본: 새 은행·독해 격리, 오버레이 키 정렬 수정 |
| `snapshot/gemini-consolidated-9c36d27` | `9c36d27` | 검토 반영본(K10 파싱, 독해 키 균형) |

원래 브랜치(`work/english-korean-i18n`, `review/consolidated-learn-*`)도 그대로 있습니다. 스냅샷은 같은 SHA를 가리키는 고정 참조입니다.

## 미커밋·미푸시 변경 (이 세션에서는 볼 수 없음)
이 세션은 Gemini의 작업 폴더에 접근할 수 없습니다. 사용자/ChatGPT가 Gemini 작업 폴더에서 다음을 실행해 보존해 주세요(**Gemini 브랜치에 푸시하지 말고 새 브랜치로**):
```sh
git status --short                                  # 미커밋 변경 확인
git switch -c snapshot/gemini-wip-20261015
git add -A && git commit -m "WIP snapshot (Gemini), not for release"
git push -u origin snapshot/gemini-wip-20261015
```
이 브랜치가 없으면 Claude는 위 세 커밋만 알고 작업합니다.

## 영어 기존 은행에 대한 입장
- `lib/learn/content/bank/english.json`(4,345문항)과 "고유 9,990문항" 주장은 **채택하지 않습니다.** 정규화 후 실측과 독립 검토로 다시 판단합니다(`docs/learning/english-bank/baseline.md`).
- 운영 중인 영어 서비스(`e6da450`의 정규 코스 628문항)는 그대로 보존합니다.
- 제출된 중학·고교 100문항은 이 저장소 어디에도 없었습니다. 위치(파일 또는 브랜치)를 알려 주세요.

## 작업 분담
- Claude: 영어 문제, 수학 확충, 한국어 확충, 해당 검증·감사 문서.
- ChatGPT: `scripts/curriculum/**`, `docs/learning/curriculum-audit/**`, 배포·검토 환경 운영(변경 없음).
- 공유 파일(`lib/learn/content/bank.ts`, manifest, 공유 테스트)은 Claude가 수정해야 할 때 먼저 소유자를 확인합니다.
