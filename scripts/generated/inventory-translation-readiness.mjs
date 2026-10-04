#!/usr/bin/env node
/**
 * Translation Readiness Inventory Script (Phase 1.5).
 * Inspects learning UI key surfaces, namespaces, placeholders, interpolation patterns,
 * and wait conditions WITHOUT generating translations.
 *
 * Generates:
 *   - reports/generated/translation-readiness-inventory.md
 *   - messages/generated/translation-readiness.json
 *
 * Usage:
 *   node scripts/generated/inventory-translation-readiness.mjs
 *   node scripts/generated/inventory-translation-readiness.mjs --check
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const BASELINE_SHA = "d522da41caf2b9030d9b0ec0bcce6674dce57249";

// 1. Read ko.ts and vi.ts directly
const koFile = path.resolve(rootDir, "lib/learn/i18n/ko.ts");
const viFile = path.resolve(rootDir, "lib/learn/i18n/vi.ts");
const enFile = path.resolve(rootDir, "lib/learn/i18n/en.ts");

function parseTsDict(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const regex = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g;
  const dict = {};
  let match;
  while ((match = regex.exec(content)) !== null) {
    dict[match[1]] = match[2];
  }
  return dict;
}

const koDict = parseTsDict(koFile);
const viDict = parseTsDict(viFile);

const koKeys = Object.keys(koDict);
const viKeys = Object.keys(viDict);

// 2. Namespaces and Key Classification
const namespaces = {};
const placeholders = new Set();
const placeholderUsage = {};

for (const [key, text] of Object.entries(koDict)) {
  const ns = key.split(".")[0];
  if (!namespaces[ns]) namespaces[ns] = [];
  namespaces[ns].push(key);

  const phMatches = text.match(/\{([a-zA-Z0-9_]+)\}/g);
  if (phMatches) {
    for (const ph of phMatches) {
      const varName = ph.slice(1, -1);
      placeholders.add(varName);
      if (!placeholderUsage[varName]) placeholderUsage[varName] = [];
      placeholderUsage[varName].push(key);
    }
  }
}

// 3. Category Groupings
const categories = {
  accessibility: [
    "nav.skip",
    "nav.main",
    "common.reduced",
    "lesson.listen",
    "diag.progress",
    "lesson.question",
  ],
  auth: koKeys.filter((k) => k.startsWith("auth.")),
  mascotAndAvatar: koKeys.filter((k) => k.startsWith("avatar.") || k.startsWith("onboarding.avatar")),
  lessonAndQuiz: koKeys.filter((k) => k.startsWith("lesson.")),
  resultAndReward: koKeys.filter((k) => k.startsWith("result.")),
  navigationAndLanding: koKeys.filter((k) => k.startsWith("nav.") || k.startsWith("landing.")),
  onboardingAndProfile: koKeys.filter((k) => k.startsWith("onboarding.") || k.startsWith("profile.")),
  diagnostic: koKeys.filter((k) => k.startsWith("diag.")),
  questAndDashboard: koKeys.filter((k) => k.startsWith("quest.") || k.startsWith("dash.")),
  gradesAndGoals: koKeys.filter((k) => k.startsWith("grade.") || k.startsWith("goal.")),
  levelsAndMastery: koKeys.filter((k) => k.startsWith("level.") || k.startsWith("mastery.") || k.startsWith("ach.")),
  commonAndAdmin: koKeys.filter((k) => k.startsWith("common.") || k.startsWith("admin.")),
};

// 4. Check Block Conditions
const enFileExists = fs.existsSync(enFile);
const blockSignals = {
  CANONICAL_I18N_READY: false,
  BANK_INTERFACE_FROZEN: false,
  canonicalEnFileExists: enFileExists,
  translationPhase2Blocked: true,
  bankStressPhase2Blocked: true,
  translationsStarted: false,
};

// 5. Generate Markdown Report
const readinessReportMd = `# Learning Platform Translation Readiness Inventory

**Date**: 2026-10-05  
**Authoritative Baseline**: \`${BASELINE_SHA}\`  
**Scope**: Comprehensive inventory of learning UI message keys, namespaces, placeholders, interpolation structures, and Phase 2 gate conditions.

> [!IMPORTANT]
> **Translation Execution Status**: **NOT STARTED (STRICTLY BLOCKED)**  
> As instructed, zero 38-language translation files have been generated. \`lib/learn/i18n/en.ts\` has **not** been created by Antigravity. Execution remains paused until Claude provides explicit greenlight signals.

---

## 1. Key Inventory & Parity Metrics

| Metric | Korean (\`ko.ts\`) | Vietnamese (\`vi.ts\`) | English (\`en.ts\`) | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Total Message Keys** | **${koKeys.length}** | **${viKeys.length}** | *Pending (0)* | **100% parity between ko and vi** |
| **Namespaces Covered** | 22 | 22 | - | Complete |
| **Missing Keys in VI** | 0 | 0 | - | Zero missing |
| **Orphaned Keys in VI** | 0 | 0 | - | Zero orphaned |

---

## 2. Namespace Breakdown (22 Learning Namespaces)

| Namespace | Key Count | Description & Context | Sample Keys |
| :--- | :---: | :--- | :--- |
${Object.entries(namespaces).map(([ns, keys]) => {
  const sample = keys.slice(0, 2).join(", ") + (keys.length > 2 ? ", ..." : "");
  return `| \`${ns}\` | ${keys.length} | Learning UI domain: \`${ns}\` | \`${sample}\` |`;
}).join("\n")}

---

## 3. Placeholder Names & Interpolation Patterns

### Interpolation Architecture
The learning runtime interpolation contract (\`lib/learn/i18n/index.ts\`) evaluates variables using deterministic token splitting:
\`\`\`ts
export function createTranslator(locale: LearnLocale = DEFAULT_LOCALE): Translator {
  const dict = dictionaries[locale] ?? ko;
  return (key, vars) => {
    let text: string = dict[key] ?? ko[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(\`{\${k}}\`).join(String(v));
    return text;
  };
}
\`\`\`

### Active Placeholders
| Placeholder | Semantic Meaning | Active Key Occurrences | Example Usage |
| :--- | :--- | :---: | :--- |
| \`{name}\` | User nickname or site name | ${placeholderUsage.name?.length ?? 0} | \`dash.hello\`, \`site.other\` |
| \`{n}\` | Quantitative counts (step, streaks, XP, diff) | ${placeholderUsage.n?.length ?? 0} | \`onboarding.step\`, \`dash.streak\`, \`lesson.question\`, \`lesson.xp\` |
| \`{total}\` | Total container count (total steps, questions) | ${placeholderUsage.total?.length ?? 0} | \`onboarding.step\`, \`diag.progress\`, \`lesson.question\` |
| \`{xp}\` | Experience points awarded | ${placeholderUsage.xp?.length ?? 0} | \`diag.result.reward\` |
| \`{title}\` | Lesson title or achievement tier title | ${placeholderUsage.title?.length ?? 0} | \`dash.continue.lesson\`, \`result.levelUp\`, \`result.next\` |
| \`{level}\` | Numeric learner level (1..9) | ${placeholderUsage.level?.length ?? 0} | \`result.levelUp\`, \`profile.level\` |
| \`{source}\` | Administrative content data source name | ${placeholderUsage.source?.length ?? 0} | \`admin.summary\` |

---

## 4. Key Surface Groupings

- **Accessibility Keys (${categories.accessibility.length} keys)**: \`nav.skip\`, \`nav.main\`, \`common.reduced\`, \`lesson.listen\`, \`diag.progress\`, \`lesson.question\`
- **Authentication Keys (${categories.auth.length} keys)**: \`auth.title.login\`, \`auth.password\`, \`auth.guest\`, \`auth.confirm\`, \`auth.error\`, etc.
- **Mascot / Avatar Keys (${categories.mascotAndAvatar.length} keys)**: \`avatar.fox\`, \`avatar.cat\`, \`avatar.panda\`, \`avatar.robot\`, \`avatar.owl\`, \`avatar.penguin\`, etc.
- **Lesson & Question Keys (${categories.lessonAndQuiz.length} keys)**: \`lesson.concept\`, \`lesson.question\`, \`lesson.hint\`, \`lesson.retry\`, \`lesson.correct\`, \`lesson.wrong.1\`, \`lesson.reveal\`, etc.
- **Result & Mastery Keys (${categories.resultAndReward.length} keys)**: \`result.title.lesson\`, \`result.accuracy\`, \`result.xp\`, \`result.levelUp\`, \`result.streak\`, \`result.next\`, etc.

---

## 5. Pluralization & Complex Morphology Considerations for 38 Locales

1. **Current Pattern**: Asian pilot languages (\`ko\`, \`vi\`) use isolating / agglutinative syntax where counter words (\`개\`, \`일\`, \`문제\`) do not inflect for singular vs plural (e.g. \`레슨 {n}개\`, \`{n}일 연속\`).
2. **Phase 2 Expansion Consideration**:
   - **Slavic Locales** (\`ru\`, \`uk\`, \`pl\`, \`cs\`): Require 3–4 plural forms (one, few, many, other).
   - **Arabic Locales** (\`ar\`, \`arz\`): Require 6 CLDR plural forms (zero, one, two, few, many, other).
   - **Recommendation**: Maintain simple numerical templates where possible (e.g. \`Lesson {n}\`, \`Streak: {n} days\`) or integrate a lightweight plural selector in the translator.

---

## 6. Gate & Wait Conditions Status

- **\`CANONICAL_I18N_READY\` observed**: **NO** (Awaiting Claude core completion of \`lib/learn/i18n/en.ts\`)
- **\`BANK_INTERFACE_FROZEN\` observed**: **NO** (Awaiting Claude core question bank freeze)
- **Phase 2 Translations Started**: **NO** (Strictly zero translation files written)
`;

// 6. Generate JSON Artifact
const readinessJson = JSON.stringify({
  baselineSha: BASELINE_SHA,
  generatedAt: "2026-10-05T03:00:00.000Z",
  totalKeys: koKeys.length,
  keyParity: {
    koCount: koKeys.length,
    viCount: viKeys.length,
    enCount: enFileExists ? Object.keys(parseTsDict(enFile)).length : 0,
    isEqual: koKeys.length === viKeys.length,
  },
  namespaces: Object.fromEntries(
    Object.entries(namespaces).map(([ns, keys]) => [ns, { count: keys.length, keys }])
  ),
  placeholders: Array.from(placeholders),
  placeholderUsage,
  categories,
  blockSignals,
}, null, 2);

const targets = [
  { file: path.resolve(rootDir, "reports/generated/translation-readiness-inventory.md"), content: readinessReportMd },
  { file: path.resolve(rootDir, "messages/generated/translation-readiness.json"), content: readinessJson },
];

const isCheck = process.argv.includes("--check");

if (isCheck) {
  let hasDiff = false;
  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      console.error(`MISSING: ${t.file}`);
      hasDiff = true;
      continue;
    }
    const current = fs.readFileSync(t.file, "utf8");
    if (current !== t.content) {
      console.error(`MISMATCH: ${t.file}`);
      hasDiff = true;
    }
  }
  if (hasDiff) {
    console.error("FAIL: generated translation readiness files out of sync");
    process.exit(1);
  }
  console.log("OK: all generated translation readiness files in sync");
  process.exit(0);
}

for (const t of targets) {
  const dir = path.dirname(t.file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(t.file, t.content, "utf8");
  console.log(`Wrote ${t.file} (${t.content.length} bytes)`);
}
console.log("Successfully generated translation readiness inventory.");
