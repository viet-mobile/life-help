# Main Service I18N Layout Risk & Expansion Report

- **Canonical Source Commit**: `f9992a9`
- **Audited Locales**: 35 non-reference locales × 21 keys = 735 messages
- **Reference Locales**: `en`, `ko`, `vi` (canonical in messages/*.json)

## 1. Average & Peak Expansion by Locale

| Locale | RTL | Avg Expansion Ratio | Max Expansion Ratio | Peak Expansion Key |
|:---:|:---:|---:|---:|:---|
| `am` | NO | 0.69x | 1.08x | `serviceBadge.study` |
| `ar` | YES | 0.95x | 1.69x | `study.chooser.english` |
| `arz` | YES | 0.85x | 1.69x | `study.chooser.mathDesc` |
| `bn` | NO | 0.98x | 1.80x | `study.chooser.close` |
| `da` | NO | 0.96x | 1.55x | `service.study` |
| `de` | NO | 1.12x | 1.80x | `study.chooser.close` |
| `el` | NO | 1.14x | 1.80x | `study.chooser.math` |
| `es` | NO | 1.22x | 2.00x | `study.chooser.math` |
| `fa` | YES | 0.98x | 1.58x | `study.chooser.mathDesc` |
| `fr` | NO | 1.26x | 2.50x | `study.chooser.math` |
| `he` | YES | 0.80x | 1.46x | `study.chooser.mathDesc` |
| `hi` | NO | 0.93x | 1.60x | `study.chooser.close` |
| `id` | NO | 1.04x | 1.80x | `study.chooser.math` |
| `it` | NO | 1.18x | 1.73x | `study.chooser.mathDesc` |
| `ja` | NO | 0.41x | 0.91x | `study.chooser.goTo` |
| `kk` | NO | 1.02x | 1.65x | `service.study` |
| `km` | NO | 1.05x | 1.75x | `service.study` |
| `mn` | NO | 1.11x | 1.69x | `study.chooser.mathDesc` |
| `my` | NO | 1.21x | 1.96x | `study.chooser.mathDesc` |
| `ne` | NO | 1.00x | 2.80x | `study.chooser.close` |
| `nl` | NO | 0.99x | 1.54x | `study.chooser.mathDesc` |
| `no` | NO | 0.98x | 1.40x | `service.study` |
| `pl` | NO | 1.13x | 1.81x | `study.chooser.mathDesc` |
| `pt` | NO | 1.17x | 1.80x | `study.chooser.math` |
| `ru` | NO | 1.13x | 1.90x | `study.chooser.math` |
| `si` | NO | 1.07x | 1.64x | `study.chooser.goTo` |
| `sv` | NO | 1.15x | 1.70x | `study.chooser.math` |
| `ta` | NO | 1.19x | 1.68x | `study.chooser.aria` |
| `tet` | NO | 1.13x | 1.77x | `study.chooser.mathDesc` |
| `th` | NO | 0.89x | 1.50x | `study.chooser.math` |
| `tr` | NO | 0.94x | 1.62x | `study.chooser.mathDesc` |
| `uk` | NO | 1.14x | 1.90x | `study.chooser.math` |
| `uz` | NO | 1.16x | 2.20x | `study.chooser.math` |
| `zh-Hans` | NO | 0.31x | 0.82x | `study.chooser.goTo` |
| `zh-Hant` | NO | 0.31x | 0.82x | `study.chooser.goTo` |

## 2. Button & Control Truncation Risk

Interactive buttons (`close`, `goTo`, subject toggles) monitored for expansion exceeding 1.8x:

| Locale | Key | English Canonical | Translated String | Length | Ratio |
|:---:|:---|:---|:---|---:|---:|
| `el` | `study.chooser.math` | "Study Math" | "Μελέτη Μαθηματικών" | 18 | 1.80x |
| `es` | `study.chooser.math` | "Study Math" | "Estudiar Matemáticas" | 20 | 2.00x |
| `fr` | `study.chooser.math` | "Study Math" | "Étudier les Mathématiques" | 25 | 2.50x |
| `id` | `study.chooser.math` | "Study Math" | "Belajar Matematika" | 18 | 1.80x |
| `pt` | `study.chooser.math` | "Study Math" | "Estudar Matemática" | 18 | 1.80x |
| `ru` | `study.chooser.math` | "Study Math" | "Изучение математики" | 19 | 1.90x |
| `uk` | `study.chooser.math` | "Study Math" | "Вивчення математики" | 19 | 1.90x |
| `uz` | `study.chooser.math` | "Study Math" | "Matematikani o'rganish" | 22 | 2.20x |

## 3. RTL Bidirectional Considerations

Audited RTL locales: `ar` (Arabic), `arz` (Egyptian Arabic), `fa` (Persian), `he` (Hebrew):
- **`study.chooser.goTo`**: Contains `{site}` placeholder (e.g. `math.life.help`). Renderers should isolate the hostname using `<bdi dir="ltr">{site}</bdi>` to prevent reversed domain formatting.
- **Checklist Tags**: Tags like `[تركيب]` and `[התקנה]` are positioned logically at the start of the item string without BiDi punctuation flipping.
- **Card Navigation**: Service card order is invariant (`study` before `jobHelp`; `mobileHelp` -> `aircon` -> `boiler`).
