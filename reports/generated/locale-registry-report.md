# LIFE.HELP Supported Locale Registry Report

Authoritative Baseline SHA: `d522da41caf2b9030d9b0ec0bcce6674dce57249`
Worktree: `life-help-v3-bulk`
Branch: `feature/learning-v3-bulk`
Extracted From: `messages/index.ts`
Generated At: `2026-10-05T02:00:00.000Z`

---

## 1. Registry Counts & Verification

- **Expected Locale Count**: `38`
- **Actual Codebase Count**: `38`
- **Count Match**: **YES (38 / 38)**
- **Duplicate IDs Detected**: **NONE (0)**
- **Default Locale**: `ko` (한국어)
- **Universal Fallback Locale**: `en` (English)

---

## 2. Complete Exact Locales Inventory (38 Locales)

| # | Exact ID | Korean Label | Native Label | Text Direction | RTL Flag |
|---|---|---|---|---|---|
| 1 | `ko` | 한국어 | 한국어 | LTR | no |
| 2 | `en` | 영어 | English | LTR | no |
| 3 | `vi` | 베트남어 | Tiếng Việt | LTR | no |
| 4 | `zh-Hans` | 중국어(간체) | 简体中文 | LTR | no |
| 5 | `zh-Hant` | 중국어(번체) | 繁體中文 | LTR | no |
| 6 | `el` | 그리스어 | Ελληνικά | LTR | no |
| 7 | `nl` | 네덜란드어 | Nederlands | LTR | no |
| 8 | `ne` | 네팔어 | नेपाली | LTR | no |
| 9 | `no` | 노르웨이어 | Norsk | LTR | no |
| 10 | `da` | 덴마크어 | Dansk | LTR | no |
| 11 | `de` | 독일어 | Deutsch | LTR | no |
| 12 | `ru` | 러시아어 | Русский | LTR | no |
| 13 | `mn` | 몽골어 | Монгол | LTR | no |
| 14 | `my` | 미얀마어 | မြန်မာဘာသာ | LTR | no |
| 15 | `bn` | 벵골어 | বাংলা | LTR | no |
| 16 | `sv` | 스웨덴어 | Svenska | LTR | no |
| 17 | `es` | 스페인어 | Español | LTR | no |
| 18 | `si` | 신할라어 | සිංහල | LTR | no |
| 19 | `ar` | 아랍어 | العربية | RTL | **YES** |
| 20 | `am` | 에티오피아어(암하라어) | አማርኛ | LTR | no |
| 21 | `uz` | 우즈벡어 | O'zbekcha | LTR | no |
| 22 | `uk` | 우크라이나어 | Українська | LTR | no |
| 23 | `fa` | 이란어(페르시아어) | فارسی | RTL | **YES** |
| 24 | `arz` | 이집트어 | العامية المصرية | RTL | **YES** |
| 25 | `it` | 이탈리아어 | Italiano | LTR | no |
| 26 | `id` | 인도네시아어 | Bahasa Indonesia | LTR | no |
| 27 | `ja` | 일본어 | 日本語 | LTR | no |
| 28 | `kk` | 카자흐어 | Қазақша | LTR | no |
| 29 | `km` | 캄보디아어 | ភាសាខ្មែរ | LTR | no |
| 30 | `ta` | 타밀어 | தமிழ் | LTR | no |
| 31 | `th` | 태국어 | ไทย | LTR | no |
| 32 | `tet` | 테툰딜리어 | Tetun | LTR | no |
| 33 | `tr` | 튀르키예어 | Türkçe | LTR | no |
| 34 | `pt` | 포르투갈어 | Português | LTR | no |
| 35 | `pl` | 폴란드어 | Polski | LTR | no |
| 36 | `fr` | 프랑스어 | Français | LTR | no |
| 37 | `he` | 히브리어 | עברית | RTL | **YES** |
| 38 | `hi` | 힌디어 | हिन्दी | LTR | no |

---

## 3. RTL (Right-to-Left) Locales

The exact RTL locales extracted from `messages/index.ts` (`dir: "rtl"`):
- `ar` (아랍어 / العربية)
- `arz` (이집트어 / العامية المصرية)
- `fa` (이란어(페르시아어) / فارسی)
- `he` (히브리어 / עברית)

Total RTL Count: **4**

---

## 4. Fallback Relationships

1. **Translation Lookup Order** (from `translate` in `messages/index.ts`):
   ```
   target_locale -> "en" (universal standard) -> key
   ```
2. **Device Locale Detection Aliases** (from `detectDeviceLocale` in `messages/index.ts`):
   - Traditional Chinese tags (`zh-tw`, `zh-hk`, `zh-mo`, `*hant*`) -> `zh-Hant`
   - Egyptian Arabic tags (`arz`, `ar-eg`) -> `arz`
   - Simplified Chinese tags (`zh*`) -> `zh-Hans`
   - Norwegian variants (`no`, `nb`, `nn`) -> `no`
   - Tetun dialect variants (`tet`, `dtp`, `tdt`) -> `tet`
   - Persian (`fa`) -> `fa`
   - Hebrew legacy code (`iw`, `he`) -> `he`
   - Indonesian legacy code (`in`, `id`) -> `id`
   - Greek (`el`) -> `el`
   - Portuguese (`pt`) -> `pt`
   - Standard 2-letter ISO prefix match
   - Ultimate fallback: `defaultLocale` (`ko`)

---

## 5. Target-Language Registry Prep (Section 13)

The 6 adult target products are mapped between new hosts and legacy hosts:

| Target Language | Production Host | Legacy Host | Primary Script | Implementation Status |
|---|---|---|---|---|
| Korean | `study.korean.life.help` | `study.korean.viet.mobile` | Kore | Prep Only (Held) |
| English | `study.english.life.help` | `study.english.viet.mobile` | Latn | Prep Only (Held) |
| Japanese | `study.japanese.life.help` | `study.japanese.viet.mobile` | Jpan | Prep Only (Held) |
| Chinese | `study.chinese.life.help` | `zhong.wen.viet.mobile` | Hant | Prep Only (Held) |
| Indonesian | `study.indonesian.life.help` | `bahasa.indonesia.viet.mobile` | Latn | Prep Only (Held) |
| Vietnamese | `study.vietnamese.life.help` | `hoc.tieng.viet.mobile` | Latn | Prep Only (Held) |

> [!NOTE]
> Per Section 13 guidelines, because the Claude core schema (`lib/learn/products/registry.ts`) is not yet committed to the branch, Antigravity does not invent an ad-hoc product schema. The mapping is held in this verified inventory format until Claude publishes the core interface.
