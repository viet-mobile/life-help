# Translation Readiness Deep Check Report (301 Canonical Keys)

**Date**: 2026-10-05  
**Authoritative Baseline**: `d522da41caf2b9030d9b0ec0bcce6674dce57249`  
**Canonical Source Commit**: `f707310`  
**Canonical en.ts SHA-256**: `d4195f8feaf8b0c8cbb56034eb4520d641c54476cfe9a958422913806ede9cc4`  
**Scope**: In-depth linguistic audit across all 301 canonical learning message keys, expansion ratios, punctuation, product names, and placeholder signatures.

> [!NOTE]
> **Key Count Provenance**:
> - Commit `8c5a25b` originally contained 302 keys (including `locale.en`).
> - Commit `f707310` explicitly dropped the unused `locale.en` key ("Drops the unused locale.en key."), establishing the canonical 301-key contract.
> - Parity at commit `f707310`: `en.ts` (301), `ko.ts` (301), `vi.ts` (301). 100% key and placeholder parity verified.

---

## 1. Key Metrics & Global Character Counts

- **Total Key Count**: Exactly **301 keys** (100% parity across en, ko, vi)
- **Namespaces (28)**: brand, site, nav, landing, onboarding, grade, locale, goal, avatar, diag, dash, learn, lesson, result, quest, profile, level, mastery, ach, auth, admin, common, keyboard, study, proficiency, plan, cert, scholarship
- **Average String Length**:
  - English (Canonical Source): **23.5 characters**
  - Korean (Reference): **18.1 characters**
  - Vietnamese (Reviewed): **27.4 characters**
- **Average Expansion Ratio (VI / EN)**: **1.17x** (Vietnamese / English)
- **Average Expansion Ratio (VI / KO)**: **1.51x** (Vietnamese / Korean)

---

## 2. Placeholder Signatures & Parameterization

| Parameter Signature | Key Count | Keys |
| :--- | :---: | :--- |
| `{name}` | 2 | `site.other`, `dash.hello` |
| `{n}` | 14 | `dash.toNext`, `dash.streak`, `lesson.question`, `lesson.order.slot`, `lesson.xp`, `quest.item.solve`, `proficiency.level`, etc. |
| `{total}` | 4 | `onboarding.step`, `diag.progress`, `lesson.question`, `result.accuracy` |
| `{xp}` | 1 | `diag.result.reward` |
| `{title}` | 3 | `dash.continue.lesson`, `result.levelUp`, `result.next` |
| `{level}` | 2 | `result.levelUp`, `profile.level` |
| `{source}` | 1 | `admin.summary` |
| *No Placeholders (Static Text)* | **274** | Remaining UI and foundation label strings |

---

## 3. Protected Tokens & Product Names

- **Product Name Locks (2 keys)**: `brand.math` ("MATH.LIFE.HELP"), `brand.english` ("ENGLISH.LIFE.HELP"). These must not be translated into local scripts.
- **Protected Grade Codes**: `grade.E1`–`grade.E6`, `grade.M1`–`grade.M3`, `grade.H1`–`grade.H3`.
- **Protected XP Token**: `dash.xp`, `lesson.xp`, `result.xp`.
- **Directional Arrow Glyphs (`→`)**: `auth.switch.signup` ("I'm new → Sign up"), `auth.switch.login` ("I already have an account → Log in"), `landing.how1.body`. In RTL locales, arrow orientation must reverse (`←`).
- **Bullet Dividers (`·`)**: Extensively used for secondary metadata (`dash.continue.lesson`, `grade.group.secondary`, `profile.account.guest`, `profile.level`, `result.next`).

---

## 4. Foundation Vocabulary Groups (v3 Extensions)

The 44 newly added foundation keys cover:
- `keyboard.*` (1 key): Navigation cues.
- `study.*` (4 keys): Product and target/UI language definitions.
- `proficiency.*` (9 keys): CEFR-style proficiency dimensions (reading, listening, speaking, writing, vocabulary, grammar, practical information).
- `plan.*` (6 keys): Subscription and entitlement tier labels (`free`, `plus`, `certification`, `institution`).
- `cert.*` (14 keys): Cryptographically signed achievement certification states and verification terms.
- `scholarship.*` (10 keys): Scholarship nomination and award state lifecycle labels.
