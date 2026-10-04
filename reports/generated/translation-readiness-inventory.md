# Learning Platform Translation Readiness Inventory

**Date**: 2026-10-05  
**Authoritative Baseline**: `d522da41caf2b9030d9b0ec0bcce6674dce57249`  
**Scope**: Comprehensive inventory of learning UI message keys, namespaces, placeholders, interpolation structures, and Phase 2 gate conditions.

> [!IMPORTANT]
> **Translation Execution Status**: **NOT STARTED (STRICTLY BLOCKED)**  
> As instructed, zero 38-language translation files have been generated. `lib/learn/i18n/en.ts` has **not** been created by Antigravity. Execution remains paused until Claude provides explicit greenlight signals.

---

## 1. Key Inventory & Parity Metrics

| Metric | Korean (`ko.ts`) | Vietnamese (`vi.ts`) | English (`en.ts`) | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Total Message Keys** | **257** | **257** | *Pending (0)* | **100% parity between ko and vi** |
| **Namespaces Covered** | 22 | 22 | - | Complete |
| **Missing Keys in VI** | 0 | 0 | - | Zero missing |
| **Orphaned Keys in VI** | 0 | 0 | - | Zero orphaned |

---

## 2. Namespace Breakdown (22 Learning Namespaces)

| Namespace | Key Count | Description & Context | Sample Keys |
| :--- | :---: | :--- | :--- |
| `brand` | 2 | Learning UI domain: `brand` | `brand.math, brand.english` |
| `site` | 7 | Learning UI domain: `site` | `site.math.name, site.english.name, ...` |
| `nav` | 6 | Learning UI domain: `nav` | `nav.home, nav.learn, ...` |
| `landing` | 13 | Learning UI domain: `landing` | `landing.eyebrow, landing.cta.start, ...` |
| `onboarding` | 11 | Learning UI domain: `onboarding` | `onboarding.step, onboarding.nickname.title, ...` |
| `grade` | 14 | Learning UI domain: `grade` | `grade.E1, grade.E2, ...` |
| `locale` | 3 | Learning UI domain: `locale` | `locale.label, locale.ko, ...` |
| `goal` | 4 | Learning UI domain: `goal` | `goal.school_exam, goal.fill_gaps, ...` |
| `avatar` | 6 | Learning UI domain: `avatar` | `avatar.fox, avatar.cat, ...` |
| `diag` | 15 | Learning UI domain: `diag` | `diag.intro.title, diag.intro.body, ...` |
| `dash` | 25 | Learning UI domain: `dash` | `dash.hello, dash.continue, ...` |
| `learn` | 10 | Learning UI domain: `learn` | `learn.title, learn.unit, ...` |
| `lesson` | 37 | Learning UI domain: `lesson` | `lesson.concept, lesson.example, ...` |
| `result` | 14 | Learning UI domain: `result` | `result.title.lesson, result.title.session, ...` |
| `quest` | 9 | Learning UI domain: `quest` | `quest.title, quest.subtitle, ...` |
| `profile` | 19 | Learning UI domain: `profile` | `profile.title, profile.grade, ...` |
| `level` | 9 | Learning UI domain: `level` | `level.beginner, level.explorer, ...` |
| `mastery` | 4 | Learning UI domain: `mastery` | `mastery.mastered, mastery.strong, ...` |
| `ach` | 20 | Learning UI domain: `ach` | `ach.first_solve.title, ach.first_solve.desc, ...` |
| `auth` | 13 | Learning UI domain: `auth` | `auth.title.login, auth.title.signup, ...` |
| `admin` | 7 | Learning UI domain: `admin` | `admin.title, admin.forbidden, ...` |
| `common` | 9 | Learning UI domain: `common` | `common.loading, common.close, ...` |

---

## 3. Placeholder Names & Interpolation Patterns

### Interpolation Architecture
The learning runtime interpolation contract (`lib/learn/i18n/index.ts`) evaluates variables using deterministic token splitting:
```ts
export function createTranslator(locale: LearnLocale = DEFAULT_LOCALE): Translator {
  const dict = dictionaries[locale] ?? ko;
  return (key, vars) => {
    let text: string = dict[key] ?? ko[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
    return text;
  };
}
```

### Active Placeholders
| Placeholder | Semantic Meaning | Active Key Occurrences | Example Usage |
| :--- | :--- | :---: | :--- |
| `{name}` | User nickname or site name | 2 | `dash.hello`, `site.other` |
| `{n}` | Quantitative counts (step, streaks, XP, diff) | 16 | `onboarding.step`, `dash.streak`, `lesson.question`, `lesson.xp` |
| `{total}` | Total container count (total steps, questions) | 4 | `onboarding.step`, `diag.progress`, `lesson.question` |
| `{xp}` | Experience points awarded | 1 | `diag.result.reward` |
| `{title}` | Lesson title or achievement tier title | 5 | `dash.continue.lesson`, `result.levelUp`, `result.next` |
| `{level}` | Numeric learner level (1..9) | 2 | `result.levelUp`, `profile.level` |
| `{source}` | Administrative content data source name | 1 | `admin.summary` |

---

## 4. Key Surface Groupings

- **Accessibility Keys (6 keys)**: `nav.skip`, `nav.main`, `common.reduced`, `lesson.listen`, `diag.progress`, `lesson.question`
- **Authentication Keys (13 keys)**: `auth.title.login`, `auth.password`, `auth.guest`, `auth.confirm`, `auth.error`, etc.
- **Mascot / Avatar Keys (7 keys)**: `avatar.fox`, `avatar.cat`, `avatar.panda`, `avatar.robot`, `avatar.owl`, `avatar.penguin`, etc.
- **Lesson & Question Keys (37 keys)**: `lesson.concept`, `lesson.question`, `lesson.hint`, `lesson.retry`, `lesson.correct`, `lesson.wrong.1`, `lesson.reveal`, etc.
- **Result & Mastery Keys (14 keys)**: `result.title.lesson`, `result.accuracy`, `result.xp`, `result.levelUp`, `result.streak`, `result.next`, etc.

---

## 5. Pluralization & Complex Morphology Considerations for 38 Locales

1. **Current Pattern**: Asian pilot languages (`ko`, `vi`) use isolating / agglutinative syntax where counter words (`개`, `일`, `문제`) do not inflect for singular vs plural (e.g. `레슨 {n}개`, `{n}일 연속`).
2. **Phase 2 Expansion Consideration**:
   - **Slavic Locales** (`ru`, `uk`, `pl`, `cs`): Require 3–4 plural forms (one, few, many, other).
   - **Arabic Locales** (`ar`, `arz`): Require 6 CLDR plural forms (zero, one, two, few, many, other).
   - **Recommendation**: Maintain simple numerical templates where possible (e.g. `Lesson {n}`, `Streak: {n} days`) or integrate a lightweight plural selector in the translator.

---

## 6. Gate & Wait Conditions Status

- **`CANONICAL_I18N_READY` observed**: **NO** (Awaiting Claude core completion of `lib/learn/i18n/en.ts`)
- **`BANK_INTERFACE_FROZEN` observed**: **NO** (Awaiting Claude core question bank freeze)
- **Phase 2 Translations Started**: **NO** (Strictly zero translation files written)
