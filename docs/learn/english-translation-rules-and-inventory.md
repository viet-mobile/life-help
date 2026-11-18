# LIFE.HELP English Subject Translation Inventory & Question-Type Rules (2026-10-19)

> **Review Tier Notice:** All translations added or updated in this work are **AI translations + AI automated/semantic review** (`AI_TRANSLATED_AI_REVIEWED`). No locale is claimed to have undergone native-speaker or teacher sign-off unless separately recorded by a human reviewer.

---

## 1. Runtime Source Inventory & Scope

All counts below were measured directly from the repository and `loadIndex("english", { locale })` runtime on branch `work/english-i18n-all-locales-20261019`:

### 1.1 Supported Locales (`messages/registry.ts`)
- **Total supported locales:** **47**
  - Canonical Korean presentation source (`1`): `ko`
  - Non-Korean learner locales (`46`): `am, ar, arz, bn, da, de, el, en, es, fa, fr, gu, he, hi, id, it, ja, kk, km, kn, ml, mn, mr, my, ne, nl, no, pa, pl, pt, ru, sg, si, sv, sw, ta, te, tet, th, tr, uk, ur, uz, vi, zh-Hans, zh-Hant`
  - Right-to-Left (RTL) locales (`4`): `ar, arz, fa, he, ur` (5 locales including `arz`)

### 1.2 English Curriculum Courses & Practice Bank (`lib/learn/content/`)

| Content Source | File Path(s) | Status | Canonical Count (`ko`) | Served Per Non-`ko` Locale (`46` locales) | Notes |
|---|---|---|---|---|---|
| Elementary Curriculum (`E1–E6`) | `lib/learn/content/elementary/english.json` | `PUBLISHED` | `300` questions (`6` courses, `30` skills, `30` lessons) | `300` (`100%`) | Overlays in `content/learn-overlays/<locale>/english.json` (`lib/learn/content/vi/english.json` for `vi`) |
| Middle School `M1` Demo Curriculum | `lib/learn/content/demo/english.json` | `PUBLISHED` (`20`), `DRAFT` (`16`) | `20` served (`1` course, `10` skills, `9` lessons) | `20` (`100%`) | `16` `DRAFT` items remain quarantined (`publishedOnly`) |
| Secondary & High School Electives (`M2–H3`) | `lib/learn/content/secondary/english.json` | `PUBLISHED` | `350` questions (`6` courses, `32` skills, `32` lessons) | `350` (`100%`) | Includes `H3` electives (`course-english-h3-reading`, `course-english-h3-writing`, `course-english-h3-career`) |
| **Curriculum Subtotal** | `elementary` + `demo` + `secondary` | `PUBLISHED` | **`670` questions** (`13` courses, `72` skills, `71` lessons, `28` units) | **`670` questions (`100%`)** | All `47` locales serve all `670` PUBLISHED course questions |
| English Practice Bank (Served) | `lib/learn/content/bank/english-draft.json` | `PUBLISHED` (`role: "variant"`) | **`14,981` questions** (`62` skills across `E1–H3`) | **`6,895` questions** (`62/62` skills across `E1–H3`) | Loaded from `/learn-content/<version>/english-bank/<skillId>.json` and localized via `lib/learn/content/english-bank.ts` |
| **Total Served English Questions** | `loadIndex("english", { locale })` | `PUBLISHED` | **`15,651` questions** | **`7,565` questions** | Every grade (`E1–H3`) and all 5 review/practice modes (`choice`, `listening`, `order`, `dictation`, `cards`) served in all `47` locales |

### 1.3 Quarantined / Unlinked English Sources (Intentionally Not Served)

Per Section 4 constraints, the following files remain quarantined and are **never** exposed as `PUBLISHED`:
- `lib/learn/content/bank/english-unlinked.json`: `1,431` `REVIEWED_UNLINKED` questions across `8` unlinked skills (kept byte-identical; guarded by `tests/learn/english-protection.test.ts`).
- `lib/learn/content/bank/english-pending.json`: `0` questions (`PENDING` holding file).
- `lib/learn/content/reading/english.json`: `12` `DRAFT` advanced reading passages (`36` questions; guarded by `tests/learn/english-advanced-reading.test.ts`).
- `lib/learn/content/demo/english.json`: `16` `DRAFT` questions filtered out by `publishedOnly()`.

### 1.4 English Reading Passage Study Translations (`lib/learn/content/listening/passages-ko.ts`)
- Contains `262` English reading/dialogue passage translations (`PASSAGE_KO`), attached to `q.passageKo` in `lib/learn/server/service.ts` **only** inside the post-resolution feedback payload (`submitAttempt` when `correct || giveUp`), never in `PublicQuestion` before solving.
- `passageText(prompt)` in `lib/learn/listen/segments.ts` extracts the English passage across all `47` locales (`172` curriculum reading questions + `342` bank reading/dialogue questions).

### 1.5 English Thinking Tasks (`lib/think/`)
- `39` English-related batch files (`lib/think/i18n/{en,vi,ja,zh-Hans,zh-Hant}/*english*.json`) covering `862` tasks (`en`: `615` overlay tasks; `vi`, `ja`, `zh-Hans`, `zh-Hant`: `862` overlay tasks each).
- Served via content-addressed static assets in `public/think-assets/` indexed by `lib/think/data/assets-index.ts`.

### 1.6 Learner UI & Practice Mode Strings (`lib/learn/i18n/`)
- `413` keys in `lib/learn/i18n/ko.ts` and `lib/learn/i18n/locales/<locale>.json` across all `46` non-Korean locales (`100%` complete in all `47` locales, including `modes.*`, `cards.*`, `tts.*`, `pron.*`, `korean.official.*`).

---

## 2. Question-Type Preservation vs. Localization Rules

Every English question is classified by what skill it evaluates so that target-language English material is preserved while learner-facing instructions and explanations are localized:

| Question / Field Category | Canonical Tag / Form | Prompt Rule | Options / Tiles Rule | Hint 1 Rule | Hint 2 Rule | Explanation Rule | Pre-Solve Translation Exposure |
|---|---|---|---|---|---|---|---|
| **Word → Meaning** (`What does “X” mean?`) | `w:enko` (and curriculum vocab MC) | Translate instruction frame; keep quoted English target word `“{en}”` | **Translate all 4 options** into learner's language (`w:<ko>` / `wo:<qid>:<oid>`); require 4 distinct options | Translate part-of-speech / context hint; never reveal answer | Neutral fail-closed (`"💭"` for non-`ko` via `hintGate.ts`) | Translate meaning + keep English example sentence | Target word is English; localized meanings are the choices |
| **Meaning → Word** (`How do you say “X” in English?`) | `w:koen` | Translate instruction frame + insert localized meaning `“{gloss}”` (for `en`, use a concise English definition that never contains the target word) | **Keep English words** in all 4 options | Translate POS/context hint | Neutral fail-closed (`"💭"`) | Translate meaning + keep English example sentence | Prompt shows meaning/definition; English words are the choices |
| **Spelling** | `w:spell` | Translate instruction frame + insert localized meaning `“{gloss}”` | **Keep English spellings** (`1` correct + `3` orthographic distractors) | Translate word-count / letter-count / phonics hint | Neutral fail-closed (`"💭"`) | Translate meaning + keep English example sentence | Never show the English target word in the prompt |
| **Vocabulary Cloze** | `w:cloze` | Translate instruction header; **keep English sentence stem with `____`** | **Keep English words** in all 4 options | Translate context-window hint quoting English neighbor words (`“{prev} … {next}”`) | Neutral fail-closed (`"💭"`) | Show English word, localized meaning (if available), and English example | No sentence translation shown before solving |
| **Grammar / Sentence Pick** (`Choose the correct sentence`) | `s:pick`, `q.punct` | Translate instruction prompt | **Keep all 4 English sentences** | Translate word-order / structure comparison hint | Neutral fail-closed (`"💭"`) | Show correct English sentence + localized grammar concept rule (`r:skill:<skillId>`) | No translation needed before solving |
| **Grammar Cloze** | `s:cloze` | Translate instruction header; **keep English sentence stem with `___`** | **Keep all 4 English grammar forms** | Translate neighbor-word clue (`“{prev} … {next}”`) | Neutral fail-closed (`"💭"`) | Show full English sentence + localized grammar concept rule | Optional sentence meaning only when non-leaking |
| **Word Ordering** | `s:order` | Translate instruction prompt | **Keep all English word tiles** (`options[].text`) | Translate word-count and sentence-type (`.`, `?`, `!`) hint | Neutral fail-closed (`"💭"`) | Show ordered English sentence + localized grammar concept rule | English word tiles are never translated |
| **Listening Comprehension** | `s:listen` | Translate `"Listen and choose what you heard."`; **keep `audioText` in English** | **Keep all 4 English sentence options** | Translate replay/listening strategy hint (never revealing the first word) | Neutral fail-closed (`"💭"`) | Show spoken English sentence + localized grammar concept rule | Audio-only before solving; no translation shown before submission |
| **English Dictation** | `s:dict` | Translate `"Type the exact sentence you hear."`; **keep `audioText` and `answer.accepted` in English** | N/A (`short_answer`, `dictation: "en"`) | Translate word-count + replay hint | Neutral fail-closed (`"💭"`) | Show English sentence + localized grammar concept rule | Never show or translate the English sentence before submission |
| **Reading / Dialogue / Phonics** | `r:rq`, `d:dq`, `m:m`, curriculum reading | **Keep English passage, dialogue, and English comprehension question** (or localized question header + English passage in curriculum items) | **Keep English options** (or localized comprehension options in curriculum items where meaning is tested) | Translate reading strategy / keyword-locator hint | Neutral fail-closed (`"💭"`) | Quote supporting English evidence from passage/speaker in localized frame | `passageKo` is **never** sent in `PublicQuestion`; only returned after resolution |
| **Flashcards (`cards` mode)** | `w:enko`, `w:koen` | `front`: **English word** (`cardFront`) | `back`: **Localized meaning** in learner's language (`cardBack`, fetched via `/api/learn/reveal`) | N/A | N/A | N/A | Back is only revealed when the learner flips the card |

---

## 3. Per-Question Completeness Gate (`lib/learn/content/english-bank.ts`)

Previously, `lib/learn/content/repository.ts` blocked the entire `14,981`-question English practice bank whenever `locale !== "ko"`, leaving non-Korean learners with `0` bank questions and `409 Conflict` on practice modes (`listening`, `dictation`, `cards`).

We replaced that all-or-nothing block with `localizeEnglishBank(raw, ov?.bank, locale)` (`lib/learn/content/english-bank.ts`), enforcing a **strict per-question completeness gate**:
1. A bank question is served in a non-Korean locale **if and only if** its `prompt`, `options`, `hints[0]`, and `explanation` are completely localized using `/learn-content/<version>/english/<locale>.json` (`overlay.bank.texts`), built from `scripts/learn/english-bank/kit/<locale>.json`.
2. Every localized field (`prompt`, `options[].text`, `hints`, `explanation`) is checked against `/[가-힣ㄱ-ㆎ]/`. If any Hangul character remains or any template/item key is missing, `localizeEnglishBankQuestion` returns `null` and withholds that individual question—never falling back to Korean or untranslated strings.
3. For `multiple_choice` questions, all options must remain non-empty and pairwise distinct after localization.
4. Across the entire localized bank for a locale, questions are deduplicated by normalized `prompt + audioText + sorted options`.
5. `hints[1..]` are replaced with `"💭"` both in `localizeEnglishBankQuestion` and at the `gateAll()` boundary in `lib/learn/content/repository.ts`.

