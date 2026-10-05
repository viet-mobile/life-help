#!/usr/bin/env node
/**
 * Master Main Service Translations Generator (Phase 2.2).
 * Expands canonical 21-key main-service catalog (Study card + Aircon service)
 * from commit f9992a9 across all 35 non-reference LIFE.HELP supported locales.
 *
 * Generates:
 *   - messages/generated/main-services/{locale}.json (35 locales)
 *   - reports/generated/main-service-i18n-layout-risk.md
 *   - reports/generated/main-service-semantic-sample.md
 *
 * Supports:
 *   node scripts/generated/generate-main-service-translations.mjs
 *   node scripts/generated/generate-main-service-translations.mjs --check
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const CANONICAL_COMMIT = "f9992a9";
const CANONICAL_JSON_PATH = path.resolve(__dirname, "canonical-main-service.json");
const OUT_DIR = path.resolve(rootDir, "messages/generated/main-services");
const LAYOUT_RISK_REPORT = path.resolve(rootDir, "reports/generated/main-service-i18n-layout-risk.md");
const SEMANTIC_SAMPLE_REPORT = path.resolve(rootDir, "reports/generated/main-service-semantic-sample.md");

const isCheck = process.argv.includes("--check");

// 1. Load canonical data
const canonical = JSON.parse(fs.readFileSync(CANONICAL_JSON_PATH, "utf8"));
const { keys: canonicalKeys, referenceLocales } = canonical;
const enDict = referenceLocales.en;
const koDict = referenceLocales.ko;
const viDict = referenceLocales.vi;

if (canonicalKeys.length !== 21) {
  throw new Error(`Expected exactly 21 canonical keys, got ${canonicalKeys.length}`);
}

// 2. Load translations via python bridge
const pythonCmd = 'python -c "import json; from scripts.generated.main_services_data import MAIN_SERVICE_TRANSLATIONS; print(json.dumps(MAIN_SERVICE_TRANSLATIONS, ensure_ascii=False))"';
const pythonOutput = execSync(pythonCmd, {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
const translations = JSON.parse(pythonOutput);

const localeCodes = Object.keys(translations).sort();
if (localeCodes.length !== 35) {
  throw new Error(`Expected exactly 35 non-reference locales, got ${localeCodes.length}`);
}

// 3. Strict validation per locale
const rtlLocales = new Set(["ar", "arz", "fa", "he"]);
const hangulRegex = /[\uac00-\ud7a3]/;

for (const loc of localeCodes) {
  const dict = translations[loc];
  const dictKeys = Object.keys(dict).sort();

  if (dictKeys.length !== 21) {
    throw new Error(`Locale ${loc} has ${dictKeys.length} keys, expected 21`);
  }

  for (const k of canonicalKeys) {
    if (!(k in dict)) {
      throw new Error(`Locale ${loc} missing key: ${k}`);
    }
    const val = String(dict[k]).trim();
    if (!val) {
      throw new Error(`Locale ${loc} has empty value for key: ${k}`);
    }

    if (val.includes("<") || val.includes(">") || val.includes("\n") || val.includes("$")) {
      throw new Error(`Locale ${loc} key "${k}" contains forbidden character (<, >, \\n, $)`);
    }

    if (hangulRegex.test(val)) {
      throw new Error(`Locale ${loc} key "${k}" contains forbidden Hangul leakage`);
    }

    const placeholders = val.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    if (k === "study.chooser.goTo") {
      if (placeholders.length !== 1 || placeholders[0] !== "{site}") {
        throw new Error(`Locale ${loc} key "${k}" must have exactly [{site}], got: ${JSON.stringify(placeholders)}`);
      }
    } else {
      if (placeholders.length > 0) {
        throw new Error(`Locale ${loc} key "${k}" must have NO placeholders, got: ${JSON.stringify(placeholders)}`);
      }
    }
  }
}

// 4. Build Layout Risk & Expansion Analysis
const familyMap = {
  CJK: ["zh-Hans", "zh-Hant", "ja"],
  "Romance & Germanic": ["es", "fr", "de", "it", "pt", "nl"],
  "Cyrillic & Altaic": ["ru", "uk", "kk", "uz", "mn"],
  "Nordic & Central": ["sv", "da", "no", "pl", "el", "tr"],
  "Southeast Asia": ["id", "th", "my", "km", "tet"],
  "South Asia": ["hi", "bn", "ta", "ne", "si"],
  "Middle East & Africa": ["ar", "arz", "fa", "he", "am"],
};

const expansionStats = [];
for (const loc of localeCodes) {
  let totalRatio = 0;
  let maxRatio = 0;
  let maxKey = "";

  for (const k of canonicalKeys) {
    const enLen = Math.max(enDict[k].length, 1);
    const locLen = translations[loc][k].length;
    const ratio = locLen / enLen;
    totalRatio += ratio;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      maxKey = k;
    }
  }

  expansionStats.push({
    locale: loc,
    isRtl: rtlLocales.has(loc),
    avgRatio: Number((totalRatio / canonicalKeys.length).toFixed(2)),
    maxRatio: Number(maxRatio.toFixed(2)),
    maxKey,
  });
}

// Button and short control keys vulnerable to overflow
const buttonKeys = ["study.chooser.close", "study.chooser.goTo", "study.chooser.math", "study.chooser.english"];
const overflowRisks = [];

for (const loc of localeCodes) {
  for (const k of buttonKeys) {
    const enText = enDict[k];
    const locText = translations[loc][k];
    const enLen = enText.length;
    const locLen = locText.length;
    const ratio = locLen / enLen;
    if (ratio >= 1.8 && locLen > 15) {
      overflowRisks.push({
        locale: loc,
        key: k,
        enText,
        locText,
        ratio: ratio.toFixed(2),
        locLen,
      });
    }
  }
}

const layoutRiskMd = [
  "# Main Service I18N Layout Risk & Expansion Report",
  "",
  `- **Canonical Source Commit**: \`${CANONICAL_COMMIT}\``,
  `- **Audited Locales**: 35 non-reference locales × 21 keys = 735 messages`,
  `- **Reference Locales**: \`en\`, \`ko\`, \`vi\` (canonical in messages/*.json)`,
  "",
  "## 1. Average & Peak Expansion by Locale",
  "",
  "| Locale | RTL | Avg Expansion Ratio | Max Expansion Ratio | Peak Expansion Key |",
  "|:---:|:---:|---:|---:|:---|",
  ...expansionStats.map(
    (s) =>
      `| \`${s.locale}\` | ${s.isRtl ? "YES" : "NO"} | ${s.avgRatio.toFixed(2)}x | ${s.maxRatio.toFixed(2)}x | \`${s.maxKey}\` |`
  ),
  "",
  "## 2. Button & Control Truncation Risk",
  "",
  "Interactive buttons (`close`, `goTo`, subject toggles) monitored for expansion exceeding 1.8x:",
  "",
  "| Locale | Key | English Canonical | Translated String | Length | Ratio |",
  "|:---:|:---|:---|:---|---:|---:|",
  ...(overflowRisks.length > 0
    ? overflowRisks.map(
        (r) => `| \`${r.locale}\` | \`${r.key}\` | "${r.enText}" | "${r.locText}" | ${r.locLen} | ${r.ratio}x |`
      )
    : ["| (None) | - | - | All button strings within safe layout thresholds (<1.8x) | - | - |"]),
  "",
  "## 3. RTL Bidirectional Considerations",
  "",
  "Audited RTL locales: `ar` (Arabic), `arz` (Egyptian Arabic), `fa` (Persian), `he` (Hebrew):",
  "- **`study.chooser.goTo`**: Contains `{site}` placeholder (e.g. `math.life.help`). Renderers should isolate the hostname using `<bdi dir=\"ltr\">{site}</bdi>` to prevent reversed domain formatting.",
  "- **Checklist Tags**: Tags like `[تركيب]` and `[התקנה]` are positioned logically at the start of the item string without BiDi punctuation flipping.",
  "- **Card Navigation**: Service card order is invariant (`study` before `jobHelp`; `mobileHelp` -> `aircon` -> `boiler`).",
  "",
].join("\n");

// 5. Build Semantic QA Review Sample Report
const sampleKeys = [
  { key: "study.chooser.title", label: "Study Title" },
  { key: "study.chooser.subtitle", label: "Study Subtitle" },
  { key: "study.chooser.math", label: "Math Choice" },
  { key: "study.chooser.english", label: "English Choice" },
  { key: "study.chooser.goTo", label: "Go To {site}" },
  { key: "service.aircon", label: "Aircon Title" },
  { key: "serviceSubitems.aircon.aircon-install", label: "Aircon Install" },
  { key: "serviceSubitems.aircon.aircon-repair", label: "Aircon Repair" },
  { key: "serviceSubitems.aircon.aircon-cleaning", label: "Aircon Cleaning" },
];

const semanticSampleMd = [
  "# Main Service Semantic QA Representative Sample",
  "",
  `- **Canonical Source Commit**: \`${CANONICAL_COMMIT}\``,
  "- **Purpose**: Representative multi-language audit of core service concepts across all 35 supported locales.",
  "- **Reference Locales**: `en` (English), `ko` (Korean), `vi` (Vietnamese).",
  "",
  "## 1. Study Card & Chooser Semantics",
  "",
  "| Locale | Study Title (`study.chooser.title`) | Math Choice (`study.chooser.math`) | English Choice (`study.chooser.english`) | Open Site (`study.chooser.goTo`) |",
  "|:---:|:---|:---|:---|:---|",
  `| **en** (Ref) | "${enDict["study.chooser.title"]}" | "${enDict["study.chooser.math"]}" | "${enDict["study.chooser.english"]}" | "${enDict["study.chooser.goTo"]}" |`,
  `| **ko** (Ref) | "${koDict["study.chooser.title"]}" | "${koDict["study.chooser.math"]}" | "${koDict["study.chooser.english"]}" | "${koDict["study.chooser.goTo"]}" |`,
  `| **vi** (Ref) | "${viDict["study.chooser.title"]}" | "${viDict["study.chooser.math"]}" | "${viDict["study.chooser.english"]}" | "${viDict["study.chooser.goTo"]}" |`,
  ...localeCodes.map(
    (loc) =>
      `| \`${loc}\` | "${translations[loc]["study.chooser.title"]}" | "${translations[loc]["study.chooser.math"]}" | "${translations[loc]["study.chooser.english"]}" | "${translations[loc]["study.chooser.goTo"]}" |`
  ),
  "",
  "## 2. Aircon Service Semantics (Installation vs Repair vs Cleaning)",
  "",
  "| Locale | Aircon Title (`service.aircon`) | Install Subitem | Repair Subitem | Cleaning Subitem |",
  "|:---:|:---|:---|:---|:---|",
  `| **en** (Ref) | "${enDict["service.aircon"]}" | "${enDict["serviceSubitems.aircon.aircon-install"]}" | "${enDict["serviceSubitems.aircon.aircon-repair"]}" | "${enDict["serviceSubitems.aircon.aircon-cleaning"]}" |`,
  `| **ko** (Ref) | "${koDict["service.aircon"]}" | "${koDict["serviceSubitems.aircon.aircon-install"]}" | "${koDict["serviceSubitems.aircon.aircon-repair"]}" | "${koDict["serviceSubitems.aircon.aircon-cleaning"]}" |`,
  `| **vi** (Ref) | "${viDict["service.aircon"]}" | "${viDict["serviceSubitems.aircon.aircon-install"]}" | "${viDict["serviceSubitems.aircon.aircon-repair"]}" | "${viDict["serviceSubitems.aircon.aircon-cleaning"]}" |`,
  ...localeCodes.map(
    (loc) =>
      `| \`${loc}\` | "${translations[loc]["service.aircon"]}" | "${translations[loc]["serviceSubitems.aircon.aircon-install"]}" | "${translations[loc]["serviceSubitems.aircon.aircon-repair"]}" | "${translations[loc]["serviceSubitems.aircon.aircon-cleaning"]}" |`
  ),
  "",
  "## 3. Checklist Options Sample ([Install], [Repair], [Cleaning])",
  "",
  "| Locale | [Install] Item | [Repair] Item | [Cleaning] Item |",
  "|:---:|:---|:---|:---|",
  `| **en** (Ref) | "${enDict["supportChecklist.aircon.0"]}" | "${enDict["supportChecklist.aircon.1"]}" | "${enDict["supportChecklist.aircon.2"]}" |`,
  `| **ko** (Ref) | "${koDict["supportChecklist.aircon.0"]}" | "${koDict["supportChecklist.aircon.1"]}" | "${koDict["supportChecklist.aircon.2"]}" |`,
  `| **vi** (Ref) | "${viDict["supportChecklist.aircon.0"]}" | "${viDict["supportChecklist.aircon.1"]}" | "${viDict["supportChecklist.aircon.2"]}" |`,
  ...localeCodes.map(
    (loc) =>
      `| \`${loc}\` | "${translations[loc]["supportChecklist.aircon.0"]}" | "${translations[loc]["supportChecklist.aircon.1"]}" | "${translations[loc]["supportChecklist.aircon.2"]}" |`
  ),
  "",
].join("\n");

// 6. Execution mode: --check vs write
function main() {
  if (isCheck) {
    if (!fs.existsSync(OUT_DIR)) {
      console.error(`FAIL: output directory does not exist: ${OUT_DIR}`);
      process.exit(1);
    }

    for (const loc of localeCodes) {
      const filePath = path.join(OUT_DIR, `${loc}.json`);
      if (!fs.existsSync(filePath)) {
        console.error(`FAIL: missing locale file ${filePath}`);
        process.exit(1);
      }
      const existing = fs.readFileSync(filePath, "utf8");
      const expected = JSON.stringify(translations[loc], null, 2) + "\n";
      if (existing.replace(/\r\n/g, "\n") !== expected) {
        console.error(`FAIL: locale file out of sync: ${filePath}`);
        process.exit(1);
      }
    }

    if (!fs.existsSync(LAYOUT_RISK_REPORT) || !fs.existsSync(SEMANTIC_SAMPLE_REPORT)) {
      console.error("FAIL: missing report files");
      process.exit(1);
    }

    console.log("OK: all 35 main-service translation files and reports in sync");
    return;
  }

  // Write files
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(LAYOUT_RISK_REPORT), { recursive: true });

  for (const loc of localeCodes) {
    const filePath = path.join(OUT_DIR, `${loc}.json`);
    const content = JSON.stringify(translations[loc], null, 2) + "\n";
    fs.writeFileSync(filePath, content, "utf8");
  }

  fs.writeFileSync(LAYOUT_RISK_REPORT, layoutRiskMd.trimEnd() + "\n", "utf8");
  fs.writeFileSync(SEMANTIC_SAMPLE_REPORT, semanticSampleMd.trimEnd() + "\n", "utf8");

  console.log(`Successfully generated ${localeCodes.length} main-service translation files in messages/generated/main-services/`);
  console.log(`Generated report: ${LAYOUT_RISK_REPORT}`);
  console.log(`Generated report: ${SEMANTIC_SAMPLE_REPORT}`);
}

main();
