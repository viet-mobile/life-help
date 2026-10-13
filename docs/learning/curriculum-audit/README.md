# 교육과정 검증과 작업 분담

ChatGPT 작업 범위: `scripts/curriculum/**`, `lib/learn/curriculum/kr/2022/README.md`, `docs/learning/curriculum-audit/**`.
Claude 작업 범위: 레슨·문항·번역·학기 목록·생성 자산·기존 coverage 문서·스테이징 설정, 그리고 새 `docs/learning/curriculum-mappings/**`.
같은 파일을 양쪽에서 편집하지 않습니다. ChatGPT는 별도 브랜치에서 작업하며 Claude 브랜치를 병합하거나 공유 작업 트리를 변경하지 않습니다.

## 기준 스냅샷

`claude-51509f9-baseline.json`은 공식 JSON 커밋 `8b5d815`와 Claude 콘텐츠 커밋 `51509f9`을 비교하기 위한 인벤토리입니다.

- 공식 수학: 435개 성취기준, 263쪽. Claude 스냅샷: 113개 레슨, 1,036개 문항.
- 공식 영어: 270개 성취기준, 306쪽. Claude 스냅샷: 59개 레슨, 593개 문항.
- 영어 E1·E2의 10개 레슨은 선행·확장 콘텐츠입니다. 공식 초등 영어는 3~4학년군부터 시작합니다.

현재 매핑 근거가 공급되지 않았으므로 705개 성취기준 모두 `unreviewed`로 표시했습니다. **미검토는 누락이 아닙니다.** 실제 정답·문항·수업 활동의 범위까지 검토한 뒤 `gap`, `partial`, `covered`를 설정합니다. `covered`도 검토자의 판정이지 교육적 완전성을 기계적으로 보장하는 것은 아닙니다.

## 실행

의존성 설치가 필요 없는 Node 내장 기능을 사용합니다. 저장소 루트에서:

```sh
node --test scripts/curriculum/audit-moe-2022.test.mjs
node scripts/curriculum/audit-moe-2022.mjs
node scripts/curriculum/audit-moe-2022.mjs --mappings docs/learning/curriculum-mappings/reviewed.json --content-revision ACTUAL_COMMIT --curriculum-revision 8b5d815 --output /tmp/curriculum-review.json
```

`--content-root`를 지정하면 다른 체크아웃 또는 여섯 콘텐츠 JSON을 보존한 스냅샷을 읽습니다. 공식 교육과정은 도구가 있는 저장소에서 읽습니다. `--output`을 생략하면 파일을 쓰지 않습니다. revision은 반드시 실제 검토한 커밋을 입력합니다. 과거 baseline을 최신 현황으로 덮어쓰지 않습니다.

## 매핑 입력 형식

```json
{
  "mathematics": [],
  "english": [
    {
      "code": "4영01-01",
      "status": "partial",
      "lesson_ids": ["실제 레슨 ID"],
      "question_ids": ["실제 문항 ID"],
      "rationale": "이 성취기준 중 어떤 기능을 어떤 문항이 다루며 무엇이 부족한지 기술",
      "reviewed_by": "검토자"
    }
  ]
}
```

위 ID는 구조 설명용이며 실제 입력에서는 콘텐츠에 존재하는 ID로 바꿉니다. 도구는 존재하지 않는 기준·레슨·문항, 중복 기준, 근거 없는 충족 판정, 레슨과 연결되지 않은 문항, E1·E2 영어를 공식 교육과정 근거로 사용한 판정을 거부합니다. 누락된 매핑은 `unreviewed`로 남습니다. `gap`에는 근거 ID를 넣지 않습니다.

## 확인된 생성 도구

데모 seed SQL 생성기는 `scripts/learn/generate-seed.mjs`입니다. 실행은 `node scripts/learn/generate-seed.mjs`, 출력은 `supabase/seed/learn_demo.sql`입니다. Claude 브랜치에는 `npm run seed:learn:generate`도 있습니다. 생성과 DB 적용은 별개입니다. 원본 생성기에는 로컬/PGlite 전용 가드가 있습니다. 스테이징 절차는 Claude 브랜치의 별도 가드·명령을 검토해야 합니다.

## 검증 기록

Node 테스트 13개 통과. 두 공식 JSON의 모든 정의 코드에 대해 중복·참조 누락·쪽수·원문 행·과목 범위와 추적 가능성을 확인했습니다. Claude `51509f9`의 여섯 콘텐츠 파일에서도 레슨·문항 인벤토리를 읽고 중복 ID 및 레슨에서 참조한 문항의 존재를 확인했습니다. 전체 앱 테스트·타입 검사·배포는 이 도구 변경의 검증에 포함되지 않았으며 Claude 통합 작업에서 실행합니다.
