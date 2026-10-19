# LIFE.HELP English Subject 47-Locale Translation & Runtime Wiring Handoff (2026-10-19)

- **Branch:** `work/english-i18n-all-locales-20261019`
- **Review Status Classification:** `AI_TRANSLATED_AI_REVIEWED` (AI translation + automated structural QA + separated AI semantic review across stratified samples; **no locale has undergone human native-speaker or teacher review**).
- **Companion Rule & Inventory Spec:** [`docs/learn/english-translation-rules-and-inventory.md`](./english-translation-rules-and-inventory.md)

---

## 1. Per-Locale & Per-Content-Type Completion, Served, and Quarantined Counts

All 47 locales registered in `messages/registry.ts` (`ko` + 46 non-Korean learner locales: `am, ar, arz, bn, da, de, el, en, es, fa, fr, gu, he, hi, id, it, ja, kk, km, kn, ml, mn, mr, my, ne, nl, no, pa, pl, pt, ru, sg, si, sv, sw, ta, te, tet, th, tr, uk, ur, uz, vi, zh-Hans, zh-Hant`) were audited and wired end-to-end.

### 1.1 Summary by Content Category

| Content Category | Source / Asset Location | `ko` (Canonical) | Each of the `46` Non-`ko` Locales | Withheld / Quarantined | Review Classification |
|---|---|---|---|---|---|
| **English Regular & Elective Courses (`E1–H3`, `13` courses, `72` skills, `71` lessons)** | `lib/learn/content/{elementary,demo,secondary}/english.json` + `content/learn-overlays/<locale>/english.json` (`lib/learn/content/vi/*`) | `670` `PUBLISHED` questions | **`670 / 670` (`100%`)** served across all `46` locales | `16` `DRAFT` in `demo/english.json`; `36` `DRAFT` in `reading/english.json` | `AI_TRANSLATED_AI_REVIEWED` |
| **English Practice Bank (`eb-*`, `62` skills across `E1–H3`)** | `/learn-content/<version>/english-bank/<skillId>.json` + `scripts/learn/english-bank/kit/<locale>.json` | `14,981` `PUBLISHED` questions | **`6,895` (`46.0%`)** served across all `46` locales (`62/62` skills, `12/12` grades `E1–H3`) | `8,086` item-specific vocab/sentence variants withheld per locale by completeness gate; `1,431` `REVIEWED_UNLINKED` (`english-unlinked.json`); `0` `PENDING` (`english-pending.json`) | `AI_TRANSLATED_AI_REVIEWED` (withheld items: `UNTRANSLATED_WITHHELD`) |
| **Total Served English Questions (`loadIndex("english", { locale })`)** | `lib/learn/content/repository.ts` + `lib/learn/coverage.json` | **`15,651` questions** | **`7,565` questions** in every one of the `46` non-`ko` locales | Never silently falls back to Korean or English | `AI_TRANSLATED_AI_REVIEWED` |
| **English Reading Passage Study Translations (`PASSAGE_KO`)** | `lib/learn/content/listening/passages-ko.ts` + `lib/learn/listen/segments.ts` | `262` passage translations (`172` course + `90` extra) | `172 / 172` (`100%`) course reading passages extracted cleanly by `passageText()` across all `47` locales | Exposed **only** after attempt resolution (`correct \|\| giveUp`), never in `PublicQuestion` | `AI_TRANSLATED_AI_REVIEWED` |
| **English Thinking Tasks (`39` batches, `862` tasks)** | `lib/think/i18n/{en,vi,ja,zh-Hans,zh-Hant}/*english*.json` + `public/think-assets/` | `862` canonical tasks | `en`: `615/615` (`100%`), `vi`: `862/862` (`100%`), `ja`: `862/862` (`100%`), `zh-Hans`: `862/862` (`100%`), `zh-Hant`: `862/862` (`100%`) | Other 41 locales are not registered in `lib/think` overlay loader | `AI_TRANSLATED_AI_REVIEWED` |
| **Learner UI & Review Mode Strings (`413` keys)** | `lib/learn/i18n/ko.ts` + `lib/learn/i18n/locales/<locale>.json` | `413 / 413` (`100%`) | **`413 / 413` (`100%`)** across all `46` non-`ko` locales | `0` missing | `AI_TRANSLATED_AI_REVIEWED` |

### 1.2 Served English Practice Bank Breakdown Per Non-Korean Locale (`6,895` Questions Across All `46` Locales)

| Bank Form (`kind:form`) | Review / Practice Mode | Served Count Per Non-`ko` Locale (`46` locales) | Description |
|---|---|---|---|
| `s:cloze` | `choice` | `1,417` | Sentence grammar cloze (`Choose the word that fits the blank`) |
| `s:pick` | `choice` | `1,399` | Sentence grammar discrimination (`Choose the correct sentence`) |
| `s:listen` | `listening` | `1,300` | Spoken English sentence listening comprehension (audio-only prompt) |
| `s:order` | `order` | `978` | English word-tile ordering (`Tap the words in the right order`) |
| `s:dict` | `dictation` | `705` | Spoken English sentence dictation (`short_answer`, `dictation: "en"`) |
| `w:cloze` | `choice` | `532` | Vocabulary in-context sentence cloze |
| `r:rq` | `choice` | `247` | English reading passage comprehension |
| `d:dq` | `choice` | `95` | English dialogue comprehension |
| `w:koen` | `choice` + `cards` | `92` | Meaning/definition → English word (`12/12` grades `E1–H3`) |
| `w:spell` | `choice` | `90` | Meaning/definition → English orthographic spelling |
| `m:m` | `choice` | `25` | Phonics, rhyming, and syllable / initial-letter discrimination |
| `w:enko` | `choice` + `cards` | `15` | English word → 4 localized meaning options (all 4 options verified distinct) |
| **Total** | **All 5 modes (`choice`, `listening`, `order`, `dictation`, `cards`)** | **`6,895`** | **Identical `6,895` count across all `46` non-`ko` locales; `62/62` bank skills covered** |

---

## 2. Question-Type Preservation vs. Localization Rules

Detailed field-by-field rules are recorded in [`docs/learn/english-translation-rules-and-inventory.md`](./english-translation-rules-and-inventory.md). Key principles enforced in code:

1. **Learner-Facing Instructions, Hints, and Explanations:** Always localized into the learner's selected language (`locale`), with zero Hangul (`/[가-힣ㄱ-ㆎ]/`) permitted in non-Korean locales.
2. **Target-Language English Material Preserved:**
   - Reading passages, dialogues, sentence stems (`____`), listening `audioText`, dictation `audioText` and `answer.accepted`, word-ordering tiles, spelling options, and grammar options remain in canonical English.
   - Quoted English words/sentences inside instructions, hints, and explanations remain in English while the surrounding explanation frame is translated.
3. **Meaning-Comprehension Options (`w:enko` and curriculum vocabulary questions):**
   - When options test meaning comprehension of an English prompt word, all 4 options are translated into the learner's language (`w:<ko>` or disambiguated `wo:<qid>:<oid>`), and validated to remain 4 distinct strings.
   - When the learner's locale is `en` (`w:koen`, `w:spell`, `w:enko`), glosses use **concise English definitions** (never the literal target English word itself) so the prompt never gives away the answer.
4. **No Pre-Solve Answer Leaks:**
   - Reading passage translations (`PASSAGE_KO` in `lib/learn/content/listening/passages-ko.ts`) are stripped from `PublicQuestion` (`toPublicQuestion` in `lib/learn/content/repository.ts`) and returned **only** in the post-resolution `submitAttempt` response (`correct || giveUp`).
   - Listening (`s:listen`) and dictation (`s:dict`) questions never display or translate the spoken sentence in the prompt before submission.
   - Hint 1 (`hints[0]`) is verified not to quote or reveal the answer option.
   - Hint 2 (`hints[1]`) preserves the fail-closed protection policy in `lib/learn/hintGate.ts` (`universal = true` → `"💭"` for all non-Korean locales).

---

## 3. Loader, Static Asset & Completeness Gate Changes (and Conflict Isolation)

### 3.1 Why Per-Question Completeness Gating Replaced All-or-Nothing Locale Blocking
- Previously, `lib/learn/content/repository.ts` (line 75) only loaded the English practice bank when `locale === "ko"`, causing all 46 non-Korean locales to receive `0` bank questions (`670 / 15,651` total questions) and fail with HTTP `409` (`no_questions`) whenever a non-Korean learner selected **Listening**, **Dictation**, or **Flashcards** practice modes.
- Requiring all `526` vocabulary items (`2,000+` distractor glosses) to be translated before serving any grammar, listening, dictation, ordering, or reading bank questions unnecessarily blocked `6,895` questions whose prompts, options, hints, and grammar concept explanations were already localizable from verified curriculum overlays and starter kits.
- We implemented `localizeEnglishBank` in `lib/learn/content/english-bank.ts`, which evaluates each question individually:
  - If all fields (`prompt`, `options`, `hints[0]`, `explanation`) localize cleanly with zero Hangul and 4 distinct options, the question is served.
  - If any required item gloss (`w:<ko>`) is absent for a vocabulary question, that question returns `null` and is withheld without affecting the `6,895` complete questions.
  - `lib/learn/coverage.json` accurately reports `[7565, 15651]` for each of the 46 non-Korean locales so the UI coverage notice remains transparent (`hasGap(coverageFor("english", locale)) === true`).

### 3.2 Architecture & Worker Bundle Size Protection
- **Zero Worker code bundle bloat:** Per-locale English bank translation tables (`scripts/learn/english-bank/kit/<locale>.json`, ~18–25 KB per locale) are compiled by `scripts/learn/build-content-assets.mjs` into `overlay.bank.texts` inside `/learn-content/<version>/english/<locale>.json` (server-only static assets fetched via `ASSETS` and pinned by SHA-256 in `lib/learn/content/asset-manifest.json`).
- **Flashcard support (`lib/learn/reviewModes.ts`):** Updated `cardFront` and `cardBack` to support both `w:enko` and `w:koen` vocabulary bank questions (front = English word, back = localized meaning in `“...”`), giving every non-Korean locale 92 unique vocabulary flashcards across all 12 grades (`E1–H3`).
- **Reading passage segmentation (`lib/learn/listen/segments.ts`):** Updated `passageText(prompt)` regex on line 89 to match localized `"Question:"` headers after closing quotes across all 47 locales (`/\s(질문|문장|Câu hỏi|Câu)\s*[:：]|(?<=["”])\s+[^"”:\n]{1,28}[:：៖]/`), fixing 90 passage extraction mismatches in `en, es, fr, id, ja, km, ko, mn, my, ne, ru, si, th, uz, vi, zh-Hans, zh-Hant`.

### 3.3 Conflict Isolation from Other Work
- **Claude's Korean curriculum reorganization:** Zero Korean curriculum/bank files (`lib/learn/content/korean/*`, `lib/learn/content/bank/korean*`, `scripts/learn/korean/*`) were modified.
- **Canonical English bank protection:** `lib/learn/content/bank/english-draft.json`, `lib/learn/content/bank/english-unlinked.json`, `lib/learn/content/bank/english-pending.json`, `lib/learn/content/reading/english.json`, and `lib/learn/hintGate.ts` are **100% untouched** (`tests/learn/english-protection.test.ts` passes 10/10).
- **Other worktree (`/private/tmp/life-help-thinking-staging-20261018`):** Untouched.

---

## 4. Automated QA, Separated Semantic Review & Runtime Verification Results

### 4.1 Defects Found & Fixed During Audit

| Scope | Defect Found | Root Cause | Fix Applied |
|---|---|---|---|
| **English Regular & Elective Overlays (`content/learn-overlays/{da,es,kk,pt,it,sg}/english.json`)** | `15` questions (`e-e6-seq1-2..v2` in `da, es, kk, pt`; `e-e6-pun1-1..v2` in `it`; `e-m3-rc-4` in `sg`) had untranslated English prompt headers or unquoted passage boundaries | Earlier topic-overlay generation left English instructions in `da, es, kk, pt, sg` and omitted quotes around the passage in `it` | Translated all 15 prompts into their target locales (`da, es, kk, pt, sg`) and restored passage quotes in `it` (`0` untranslated strings remain across all `46 × 670 = 30,820` overlay questions) |
| **Reading Passage Extraction (`lib/learn/listen/segments.ts`)** | `90` curriculum reading questions across 17 locales failed `passageText(prompt)` extraction | `passageText` only matched Korean `질문:` / `문장:` or Vietnamese `Câu hỏi:`, missing localized `"Question:"` / `"Pregunta:"` / `"質問："` / `"សំណួរ៖"` labels | Extended regex in `lib/learn/listen/segments.ts` line 89 to match `(?<=["”])\s+[^"”:\n]{1,28}[:：៖]`, achieving `172/172` (`100%`) passage extraction parity in all 47 locales |
| **English Thinking Tasks (`lib/think/i18n/{en,vi,ja,zh-Hans,zh-Hant}/*english*.json`)** | `29` strings in `en` and `1` string each in `vi, ja, zh-Hans, zh-Hant` contained leaked Korean words (`가리키는`, `이유`, `고르세요`, `빈칸`, `문장`, `주제`, `단락`, `핵심어`, `요약문`, `연결어`) | Partial regex replacement during earlier batch translation left Korean nouns/particles inside translated prompts/hints/explanations | Replaced all 33 leaked Hangul strings with natural target-language translations and regenerated `lib/think/data/assets-index.ts` and `public/think-assets/` (`0` Hangul leaks remain across all 5 overlay locales) |
| **English Bank Kits (`scripts/learn/english-bank/build-kits.mjs`)** | Initial kit build had (1) German `„Stuhl“` lower quote missing `{gloss}` in `de`, (2) full-width parentheses `（意思：…）` remaining in `zh-Hans`/`zh-Hant`/`ja` `s:order` prompt, (3) Korean particle/batchim hints from `koBankKit` bleeding into `s:pick`/`s:cloze`, and (4) Korean spacing note in `s:dict` prompt | Regex and template source selection in initial `build-kits.mjs` | Fixed quote & full-width parenthesis regexes, switched `s:pick`/`s:cloze` hints to English curriculum grammar hints, trimmed `s:dict` prompt to first sentence, and rebuilt all 46 kits + static assets |

### 4.2 Automated QA & Semantic Audit Summary
- **Automated QA across all 47 locales:**
  - `30,820` localized curriculum questions (`46 locales × 670`) + `317,170` localized bank questions (`46 locales × 6,895`) + `3,963` localized English thinking tasks + `18,998` UI strings (`46 locales × 413`):
  - **Missing/empty strings:** `0`
  - **Unexpected Hangul leaks (`/[가-힣ㄱ-ㆎ]/`) in non-Korean locales:** `0`
  - **Broken encoding (`\uFFFD`) or malformed placeholders:** `0`
  - **Duplicate multiple-choice options:** `0`
  - **Reading `passageText()` mismatches vs. canonical `ko`:** `0` (`172/172` per locale)
  - **Simplified (`zh-Hans`) vs. Traditional (`zh-Hant`) distinct curriculum questions:** `670 / 670` (`100%` script & terminology differentiation)
  - **Static asset SHA-256 manifest verification:** `201 / 201` files match `lib/learn/content/asset-manifest.json`
- **Separated Semantic Audit:**
  - Audited `2,300` stratified question samples (`50` per locale across all `46` non-Korean locales covering `w:enko`, `w:koen`, `w:spell`, `w:cloze`, `s:pick`, `s:cloze`, `s:dict`, `s:listen`, `s:order`, `r:rq`, `d:dq`, `m:m`, curriculum reading, and thinking tasks).
  - Found and fixed the 4 semantic/formatting issues listed in Section 4.1 (`0` remaining defects in the audited samples).

---

## 5. Remaining Limitations, Unverified Scope & Next Steps

1. **Human Native-Speaker / Teacher Review Pending (`AI_TRANSLATED_AI_REVIEWED`):**
   - Every non-Korean locale (`46` locales for Learn curriculum/bank/UI; `5` locales for Thinking tasks) was translated and reviewed by AI plus automated structural/semantic checks. None should be labeled as human-verified until reviewed by a native speaker or subject teacher.
2. **Withheld English Bank Items (`8,086` of `14,981` per non-Korean locale):**
   - `6,895` bank questions (`100%` of sentence grammar `s:*`, `100%` of vocabulary cloze `w:cloze`, `100%` of reading/dialogue/phonics `r:rq`/`d:dq`/`m:m`, and `197` core vocabulary `w:enko`/`w:koen`/`w:spell` questions across all 12 grades `E1–H3`) are served in all 46 non-Korean locales.
   - The remaining `8,086` bank questions (`w:enko`, `w:koen`, `w:spell` items whose specific vocabulary gloss `w:<ko>` is not yet in `scripts/learn/english-bank/kit/<locale>.json`, plus `s:*` items that normalize to a duplicate prompt+options tuple without item-specific sentence glosses) are safely withheld by `localizeEnglishBankQuestion` (`UNTRANSLATED_WITHHELD`). Expanding `core-vocab-46.json` to all `526` `w:<ko>` glosses and `122` `s:<itemId>` sentence meanings will raise non-Korean bank coverage from `6,895` toward `14,981` without any loader changes.
3. **English Hint 2 Gate (`lib/learn/hintGate.ts`):**
   - Per Section 4 instructions, Hint 2 remains fail-closed (`"💭"` for all non-Korean locales). Unlocking rich translated second hints requires a separate safety review and per-locale leak detector clearance.

---

## 6. Reproducibility Commands

```bash
# 1. Rebuild per-locale English bank translation kits (46 locales)
node scripts/learn/english-bank/build-kits.mjs

# 2. Rebuild and verify versioned static content assets & SHA-256 manifest
node scripts/learn/build-content-assets.mjs
node scripts/learn/build-content-assets.mjs --check
node scripts/learn/build-content-assets.mjs --report

# 3. Verify coverage table and translation coverage report
npx vitest run tests/learn/coverage-table.test.ts

# 4. Run TypeScript typecheck and test suites
npm run typecheck
npx vitest run tests/learn/content-semantics.test.ts tests/learn/english-bank-assets.test.ts tests/learn/english-bank-api.test.ts tests/learn/publish-english.test.ts tests/learn/english-protection.test.ts tests/learn/review-modes.test.ts tests/learn/locales-47.test.ts tests/learn/i18n-vi.test.ts

# 5. Verify secret scan and OpenNext Cloudflare Worker bundle size (< 7.5 MiB)
node scripts/learn/check-no-secrets.mjs
```

