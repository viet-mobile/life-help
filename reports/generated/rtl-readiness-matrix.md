# RTL Readiness & Bidirectional UX Matrix (301 Canonical Keys)

**Date**: 2026-10-05
**Authoritative Baseline**: `d522da41caf2b9030d9b0ec0bcce6674dce57249`
**Canonical Source Commit**: `f707310`
**Scope**: Mechanical assessment of right-to-left layout risks for Arabic (`ar`), Egyptian Arabic (`arz`), Persian (`fa`), and Hebrew (`he`).

---

## 1. RTL Key Trigger Audit

Total learning keys requiring RTL handling: **33 keys** (11% of catalog).
- **Navigation Controls (7 keys)**: `nav.skip`, `onboarding.next`, `onboarding.back`, `lesson.next`, `lesson.retry`, `lesson.exit`, `result.next`.
- **Directional Arrows (3 keys)**: `auth.switch.signup`, `auth.switch.login`, `landing.how1.body`.
- **Ratio Fractions & Slashing (4 keys)**: `onboarding.step`, `diag.progress`, `lesson.question`, `result.accuracy`.
- **Embedded Numeral Placeholders (15 keys)**: Keys where English/Arabic digits blend into sentence structures.

---

## 2. Component-by-Component RTL Architectural Findings

| Component Surface | Target Element | Current LTR Assumption | Required RTL Remediation |
| :--- | :--- | :--- | :--- |
| **Navigation Header** (`components/learn/LearningHeader.tsx`) | Back / Exit buttons | Hardcoded `mr-2`, `space-x-*` | Use Tailwind CSS logical spacing (`me-2`, `ms-2`) |
| **Icons & Chevrons** (`components/learn/LessonNavigation.tsx`) | `ChevronRight` forward icon | Assumes forward direction is to the right | Apply `rtl:rotate-180` to directional chevrons |
| **Progress Gauges** (`components/learn/QuestProgress.tsx`) | Horizontal streak & quest bars | `width: ${percent}%` fills left-to-right | Enforce `dir="ltr"` on mathematical bar containers |
| **Math / Question Blocks** (`components/learn/QuestionCard.tsx`) | Math equations & variables | Inlined within paragraph text | Wrap all math formulas in `<bdi dir="ltr">` |
| **Radio / Checkbox Groups** (`components/learn/QuestionCard.tsx`) | Alignment options | Option indicator fixed to left | Use logical flex layout with `start` alignment |

---

## 3. Preparation Strategy for Claude Core Track

1. **Logical CSS Audit**: Replace legacy `mr-`, `ml-`, `pr-`, `pl-` with Tailwind CSS v3.3+ logical properties (`me-`, `ms-`, `pe-`, `ps-`).
2. **Formula Isolation**: Mathematical text ($x^2 + y^2 = r^2$) must always be tagged with `dir="ltr"` to prevent Arabic BiDi layout engine from inverting mathematical symbols.
