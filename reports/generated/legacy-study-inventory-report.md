# Six Legacy Adult-Study Sites Inventory Report

Authoritative Baseline SHA: `d522da41caf2b9030d9b0ec0bcce6674dce57249`
Worktree: `life-help-v3-bulk`
Branch: `feature/learning-v3-bulk`
Generated: `2026-10-05T02:00:00.000Z`

---

## 1. Executive Summary

All **6 legacy adult-study sites** were fully located and inspected on the local workstation under `C:\Users\leetr\Documents\viet-project`.
Zero sites were estimated or assumed; all facts below were directly extracted from source files, build profiles, and built distribution artifacts.

| # | Legacy Domain | New Target Domain | Target Language | Accessible | Framework | Build System | Dist Size |
|---|---|---|---|---|---|---|---|
| 1 | `study.korean.viet.mobile` | `study.korean.life.help` | Korean (`ko`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 2 | `study.english.viet.mobile` | `study.english.life.help` | English (`en`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 3 | `study.japanese.viet.mobile` | `study.japanese.life.help` | Japanese (`ja`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 4 | `zhong.wen.viet.mobile` | `study.chinese.life.help` | Chinese (`zh`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 5 | `bahasa.indonesia.viet.mobile` | `study.indonesian.life.help` | Indonesian (`id`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 6 | `hoc.tieng.viet.mobile` | `study.vietnamese.life.help` | Vietnamese (`vi`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~9.81 MB |

---

## 2. Shared Architectural Facts

Across all 6 legacy sites:
1. **Frontend Architecture**:
   - Built on pure Vanilla JavaScript and standard DOM manipulation APIs.
   - PWA compliant with Web App Manifest (`manifest.webmanifest`) and Service Worker (`sw.js`).
   - Zero heavyweight client frameworks (no React, Vue, or Angular dependencies in client bundle).
2. **Build & Bundling Pipeline**:
   - Single multi-profile Python build pipeline (`build_app.py`, `assemble_app.py`, `site_profiles.py`).
   - Static asset emission into Cloudflare Pages `dist/` folders.
3. **Routing Model**:
   - 14 entry routes per site via `_redirects` (rewriting `/ko`, `/vi`, `/en`, `/zh`, `/ja`, etc. directly to `/index.html` with 200 status code).
   - In-page navigation handled via SPA hash routing and tab state buttons (`#reader`, `#review`, `#voice_settings`, `#word_order`).
4. **Speech & Audio (TTS)**:
   - Zero static MP3/WAV/AAC audio files bundled.
   - Audio pronunciation is driven dynamically via the browser's native Web Speech API (`window.speechSynthesis`) using localized language codes (`ko-KR`, `en-US`, `ja-JP`, `zh-TW`, `zh-CN`, `id-ID`, `vi-VN`).
5. **Persistence & Security**:
   - No server-side relational database or cloud backend required.
   - User progress (flashcard reviews, completed sentences, preferred voice rate/pitch) is persisted exclusively in browser `localStorage`.
   - No user authentication barrier; fully open public educational web applications.
6. **UI Internationalization**:
   - Legacy sites support **12 display UI languages**: `vi, cs, zh_cn, zh, en, fr, de, hu, id, ja, ko, pl`.
   - LIFE.HELP V3 standard expands this to **38 languages** (managed via Package B).

---

## 3. Site-Specific Technical Inventories

### Site 1: `study.korean.viet.mobile`
- **Target Language**: Korean (`ko`, script: `Kore`).
- **Tokenizer**: Space-separated `eojeol` units for interactive word-order reconstruction.
- **Corpus Sources**: 5 row-aligned sources (`elf`, `lpd`, `wt`, `songs`, `neighbor`).
- **Brand Identity**: Rounded square mark (`한`, primary color `#00796B`).

### Site 2: `study.english.viet.mobile`
- **Target Language**: English (`en`, script: `Latn`).
- **Tokenizer**: Standard whitespace tokenization.
- **Corpus Sources**: 5 row-aligned sources.
- **Brand Identity**: Rounded square mark (`EN`, primary color `#1F4E8C`).

### Site 3: `study.japanese.viet.mobile`
- **Target Language**: Japanese (`ja`, script: `Jpan`).
- **Tokenizer**: None (Japanese script requires dictionary segmentation; word-order reconstruction feature is disabled).
- **Corpus Sources**: 5 row-aligned sources with post-processed Japanese lyric/sentence lines.
- **Brand Identity**: Rounded square mark (`日`, primary color `#5B3E96`).

### Site 4: `zhong.wen.viet.mobile`
- **Target Language**: Chinese (`zh`, primary script: `Hant`, secondary: `Hans`).
- **Tokenizer**: Han character single-character tokenization (`han_char`).
- **Corpus Sources**: 5 row-aligned sources with Traditional and Simplified Chinese dual alignment.
- **Brand Identity**: Rounded square mark (`中`, primary color `#A8322D`).

### Site 5: `bahasa.indonesia.viet.mobile`
- **Target Language**: Indonesian (`id`, script: `Latn`).
- **Tokenizer**: Whitespace tokenization.
- **Corpus Sources**: 5 row-aligned sources.
- **Brand Identity**: Rounded square mark (`ID`, primary color `#2E7D4F`).

### Site 6: `hoc.tieng.viet.mobile`
- **Target Language**: Vietnamese (`vi`, script: `Latn`).
- **Curriculum Depth**:
  - Over 3,140 unified vocabulary words with tone classifications and CEFR levels.
  - 16-week structured classroom curriculum with weekly reading assignments.
  - 52 grammar pattern units with cross-lingual translations.
  - 28 daily conversation units and 20 culture articles.
  - Pronunciation training module covering 6 tones, initial/final consonants, and Northern vs Southern dialect contrasts.
- **Brand Identity**: National learning brand with custom logo and icon suite.

---

## 4. Dependencies & Domain Assumptions

- **Domain Map**: Hardcoded domain mappings exist in `site_profiles.py` (e.g. `study.*.viet.mobile` and `hoc.tieng.viet.mobile`).
- **Storage Keys**: Legacy key `viet_mobile_locale` is used across several sites; LIFE.HELP platform integration will unify this under the `life-help` domain session.
- **Shared Component Candidates**:
  1. `TTSVoiceSettingsModal`: Universal synthesizer selector.
  2. `ParallelTextReader`: Row-aligned multi-lingual reader.
  3. `TileWordOrderExercise`: Tile reconstruction exercise component.
  4. `VocabularyReviewCard`: Spaced repetition flashcard component.
