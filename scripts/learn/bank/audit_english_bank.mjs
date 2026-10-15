import fs from "node:fs";

const bankPath = "lib/learn/content/bank/english.json";
if (!fs.existsSync(bankPath)) {
  console.error("English bank file not found:", bankPath);
  process.exit(1);
}

const enBank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

console.log("=== ENGLISH BANK STRICT QUALITY AUDIT GATE ===");
console.log("Total question count:", enBank.questions.length);
console.log("Summary by grade:", enBank.grades);

let hasFailure = false;

// 1. Minimum Threshold Checks
const TOTAL_THRESHOLD = 9990;
const BAND_THRESHOLDS = {
  elementary: 3330,
  middle: 3330,
  high: 3330
};

// Count questions by band
const bandCounts = { elementary: 0, middle: 0, high: 0 };
for (const q of enBank.questions) {
  const g = (q.tags.find(t => /^[emh][1-6]$/.test(t)) || "").toLowerCase();
  if (g.startsWith("e")) bandCounts.elementary++;
  else if (g.startsWith("m")) bandCounts.middle++;
  else if (g.startsWith("h")) bandCounts.high++;
}

console.log("Band counts:", bandCounts);

if (enBank.questions.length < TOTAL_THRESHOLD) {
  console.error(`[FAIL] Total bank size ${enBank.questions.length} is below required threshold ${TOTAL_THRESHOLD}.`);
  hasFailure = true;
} else {
  console.log(`[PASS] Total bank size meets threshold (>= ${TOTAL_THRESHOLD}): ${enBank.questions.length}`);
}

for (const [band, req] of Object.entries(BAND_THRESHOLDS)) {
  if (bandCounts[band] < req) {
    console.error(`[FAIL] ${band.toUpperCase()} band size ${bandCounts[band]} is below required threshold ${req}.`);
    hasFailure = true;
  } else {
    console.log(`[PASS] ${band.toUpperCase()} band meets threshold (>= ${req}): ${bandCounts[band]}`);
  }
}

// 2. Format and Site Check (audit-moe-2022 compatibility)
if (enBank.format !== 1) {
  console.error(`[FAIL] Bank format must be 1 (number) for curriculum audit compatibility, got: ${enBank.format}`);
  hasFailure = true;
} else {
  console.log("[PASS] Bank format is 1.");
}

if (enBank.site !== "english") {
  console.error(`[FAIL] Bank site must be 'english', got: ${enBank.site}`);
  hasFailure = true;
} else {
  console.log("[PASS] Bank site is 'english'.");
}

// 3. Verify IDs uniqueness
const ids = new Set(enBank.questions.map(q => q.id));
console.log("Unique IDs count:", ids.size);
if (ids.size !== enBank.questions.length) {
  console.error(`[FAIL] Duplicate IDs detected: ${enBank.questions.length - ids.size} duplicates.`);
  hasFailure = true;
} else {
  console.log("[PASS] All question IDs are unique.");
}

// 4. Strict Deduplication Checks
// (a) Within-skill deduplication: skillId ::: prompt ::: answer ::: sorted_options
// (b) Global cross-skill deduplication: prompt ::: answer ::: sorted_options (catches skill tag swaps)
const withinSkillKeys = new Map();
const globalKeys = new Map();
let withinSkillDups = 0;
let crossSkillDups = 0;

for (const q of enBank.questions) {
  const correctOption = q.options.find(o => o.id === q.answer.id);
  const correctText = (correctOption ? correctOption.text : "").trim();
  const sortedOptionsText = q.options.map(o => (o.text || "").trim()).sort().join(" || ");
  const promptText = q.prompt.trim();

  const skillKey = `${q.skillId} ::: ${promptText} ::: ${correctText} ::: ${sortedOptionsText}`;
  const globalKey = `${promptText} ::: ${correctText} ::: ${sortedOptionsText}`;

  if (withinSkillKeys.has(skillKey)) {
    withinSkillDups++;
    if (withinSkillDups <= 5) {
      console.error(`[DUP-WITHIN-SKILL] ${q.id} duplicates ${withinSkillKeys.get(skillKey)}`);
    }
  } else {
    withinSkillKeys.set(skillKey, q.id);
  }

  if (globalKeys.has(globalKey)) {
    crossSkillDups++;
    if (crossSkillDups <= 5) {
      console.error(`[DUP-GLOBAL-CROSS-SKILL] ${q.id} (skill: ${q.skillId}) duplicates ${globalKeys.get(globalKey).id} (skill: ${globalKeys.get(globalKey).skillId})`);
    }
  } else {
    globalKeys.set(globalKey, { id: q.id, skillId: q.skillId });
  }
}

console.log(`Deduplication evaluation:`);
console.log(`- Unique within-skill items: ${withinSkillKeys.size} (Duplicates: ${withinSkillDups})`);
console.log(`- Unique global items (cross-skill checked): ${globalKeys.size} (Cross-skill duplicates: ${crossSkillDups})`);

if (withinSkillDups > 0 || crossSkillDups > 0) {
  console.error(`[FAIL] Quality Gate Rejected: Duplicate items detected (Within-skill: ${withinSkillDups}, Cross-skill: ${crossSkillDups}). Strict uniqueness required.`);
  hasFailure = true;
} else {
  console.log(`[PASS] Deduplication Quality Gate Passed: ${globalKeys.size} globally unique questions, 0 duplicates.`);
}

// 5. Independent Learning Items vs Simple Substitutions
// Simple substitutions: structural template matches an earlier item where only names, places, or numbers are swapped.
const structuralTemplates = new Map();
let independentItems = 0;
let simpleSubstitutions = 0;

function extractStructuralPattern(text) {
  return text
    .replace(/[A-Z][a-z]+/g, "{NAME}") // Proper names
    .replace(/\b\d+\b/g, "{NUM}")      // Numbers
    .replace(/\b(Seoul|Busan|London|Paris|Tokyo|New York)\b/g, "{PLACE}")
    .replace(/\s+/g, " ")
    .trim();
}

for (const q of enBank.questions) {
  const pattern = `${q.skillId} ::: ${extractStructuralPattern(q.prompt)}`;
  if (structuralTemplates.has(pattern)) {
    simpleSubstitutions++;
  } else {
    structuralTemplates.set(pattern, q.id);
    independentItems++;
  }
}

console.log(`Item typology distribution:`);
console.log(`- Independent learning items (distinct structural frames): ${independentItems}`);
console.log(`- Systematic lexical/contextual substitutions: ${simpleSubstitutions}`);

// 6. E1/E2 Enrichment Tagging Check
let e1e2MissingEnrichment = 0;
for (const q of enBank.questions) {
  const g = (q.tags.find(t => /^[emh][1-6]$/.test(t)) || "").toLowerCase();
  if (g === "e1" || g === "e2") {
    if (!q.tags.includes("enrichment")) {
      e1e2MissingEnrichment++;
    }
  }
}
if (e1e2MissingEnrichment > 0) {
  console.error(`[FAIL] Found ${e1e2MissingEnrichment} questions in E1/E2 missing the 'enrichment' tag.`);
  hasFailure = true;
} else {
  console.log("[PASS] All E1 and E2 questions are properly marked with 'enrichment' tag.");
}

// 7. Check for direct giveaways in hints
let giveaways = 0;
for (const q of enBank.questions) {
  const correctOption = q.options.find(o => o.id === q.answer.id);
  const correctText = (correctOption ? correctOption.text : "").trim().toLowerCase();
  for (const h of (q.hints || [])) {
    const hLow = h.toLowerCase();
    if (correctText.length === 1 && hLow.includes(`begins with the letter '${correctText}'`)) {
      giveaways++;
      console.error(`[GIVEAWAY] ${q.id}: Hint reveals single-letter answer directly -> "${h}"`);
    }
    if (hLow.includes(`the correct answer is`) || hLow.includes(`correct option is`)) {
      giveaways++;
      console.error(`[GIVEAWAY] ${q.id}: Hint reveals correct answer -> "${h}"`);
    }
  }
}
if (giveaways > 0) {
  console.error(`[FAIL] Found ${giveaways} direct answer giveaways in hints.`);
  hasFailure = true;
} else {
  console.log("[PASS] No direct answer giveaways detected in hints.");
}

// 8. Check for known Claude bug signatures & regressions
let bugCount = 0;
for (const q of enBank.questions) {
  const p = (q.prompt + " " + (q.explanation || "")).toLowerCase();
  
  // Bug: missing preposition 'in' Seoul
  if (p.includes("lived seoul") || p.includes("studied seoul") || p.includes("stayed seoul")) {
    console.error(`[BUG] ${q.id}: Missing preposition in Seoul phrase.`);
    bugCount++;
  }
  if (p.includes("won first prize around the world")) {
    console.error(`[BUG] ${q.id}: Unnatural 'won first prize around the world' phrasing.`);
    bugCount++;
  }
  if (p.includes("place where won first prize")) {
    console.error(`[BUG] ${q.id}: Malformed 'place where won first prize' phrasing.`);
    bugCount++;
  }
  // Bug: Box begins with X
  if (q.id === "bk-en-e1-e-e1-alpha-024" && (q.options.find(o => o.id === q.answer.id)?.text === "X" || (q.prompt.includes("Box") && q.options.find(o => o.id === q.answer.id)?.text !== "B"))) {
    console.error(`[BUG] ${q.id}: 'Box' incorrectly marked as starting with 'X'.`);
    bugCount++;
  }
  // Bug: High school CSAT fallbacks in Elementary/Middle grades
  if ((q.id.startsWith("bk-en-e") || q.id.startsWith("bk-en-m"))) {
    if (p.includes("exhausted; nevertheless") || 
        p.includes("hardly had i arrived") || 
        p.includes("collaboration fosters creative problem solving") || 
        p.includes("the experiment yielded significant results")) {
      console.error(`[BUG] ${q.id}: CSAT high school fallback found in elementary/middle school item.`);
      bugCount++;
    }
  }
}

if (bugCount > 0) {
  console.error(`[FAIL] Found ${bugCount} known bug signatures.`);
  hasFailure = true;
} else {
  console.log("[PASS] Zero known Claude defect signatures found.");
}

// 9. Distribution checks
const diffCounts = {};
enBank.questions.forEach(q => diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1);
console.log("Difficulty distribution (1..5):", diffCounts);

const ansCounts = {};
enBank.questions.forEach(q => ansCounts[q.answer.id] = (ansCounts[q.answer.id] || 0) + 1);
console.log("Answer key distribution (a..d):", ansCounts);

if (hasFailure) {
  console.error("\n>>> AUDIT FAILED: Quality gate rejected the English question bank. <<<");
  process.exit(1);
}

console.log("\n>>> AUDIT PASSED: English question bank meets all quality gate criteria. <<<");
process.exit(0);
