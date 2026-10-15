import fs from "node:fs";

// Normalization functions as required by quality gate
export function normalizePrompt(text) {
  if (typeof text !== "string") return "";
  return text
    // Remove question numbering / sequence tags: (문항 #1), [문항 #1], 문항 #1, #1
    .replace(/\s*[\(\[]?\s*문항\s*#?\d+\s*[\)\]]?\s*/gi, " ")
    .replace(/\s*#\d+\b/gi, " ")
    // Remove embedded item ID tags: [bk-en-...]
    .replace(/\[\s*bk-en-[a-z0-9\-]+\s*\]/gi, " ")
    // Normalize display escapes: \\n -> \n, \\" -> ", \\' -> '
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    // Collapse all whitespace (including newlines and tabs) to a single space
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeOption(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeNormalizedDedupeKey(q) {
  const normPrompt = normalizePrompt(q.prompt);
  const correctOpt = q.options.find(o => o.id === q.answer.id);
  const normCorrect = normalizeOption(correctOpt ? correctOpt.text : "");
  const normSortedOptions = q.options
    .map(o => normalizeOption(o.text))
    .sort()
    .join(" || ");
  return `${normPrompt} ::: ${normCorrect} ::: ${normSortedOptions}`;
}

export function auditQuestions(questions, label = "English Question Bank") {
  console.log(`=== AUDIT: ${label} ===`);
  console.log("Total question count:", questions.length);

  let hasFailure = false;

  // 1. Verify IDs uniqueness
  const ids = new Set(questions.map(q => q.id));
  console.log("Unique IDs count:", ids.size);
  if (ids.size !== questions.length) {
    console.error(`[FAIL] Duplicate IDs detected: ${questions.length - ids.size} duplicates.`);
    hasFailure = true;
  } else {
    console.log("[PASS] All question IDs are unique.");
  }

  // 2. Strict Normalized Deduplication
  const seenNormKeys = new Map();
  let duplicateCount = 0;
  const sampleDups = [];

  for (const q of questions) {
    const key = computeNormalizedDedupeKey(q);
    if (seenNormKeys.has(key)) {
      duplicateCount++;
      if (sampleDups.length < 5) {
        sampleDups.push({
          dupId: q.id,
          origId: seenNormKeys.get(key),
          keyPreview: key.slice(0, 100)
        });
      }
    } else {
      seenNormKeys.set(key, q.id);
    }
  }

  console.log(`Normalized Deduplication evaluation:`);
  console.log(`- Unique normalized questions: ${seenNormKeys.size}`);
  console.log(`- Duplicate clones detected: ${duplicateCount}`);

  if (duplicateCount > 0) {
    console.error(`[FAIL] Quality Gate Rejected: Found ${duplicateCount} duplicate items after normalization.`);
    sampleDups.forEach(d => {
      console.error(`  - [DUP] ${d.dupId} duplicates ${d.origId} -> ${d.keyPreview}...`);
    });
    hasFailure = true;
  } else {
    console.log(`[PASS] Deduplication Quality Gate Passed: ${seenNormKeys.size} distinct items, 0 duplicates.`);
  }

  // 3. Direct Giveaways in Hints
  let giveaways = 0;
  for (const q of questions) {
    const correctOption = q.options.find(o => o.id === q.answer.id);
    const correctText = (correctOption ? correctOption.text : "").trim().toLowerCase();
    for (const h of (q.hints || [])) {
      const hLow = h.toLowerCase();
      if (correctText.length === 1 && hLow.includes(`begins with the letter '${correctText}'`)) {
        giveaways++;
        console.error(`[GIVEAWAY] ${q.id}: Hint reveals single-letter answer -> "${h}"`);
      }
      if (hLow.includes("the correct answer is") || hLow.includes("correct option is")) {
        giveaways++;
        console.error(`[GIVEAWAY] ${q.id}: Hint reveals answer phrase -> "${h}"`);
      }
    }
  }
  if (giveaways > 0) {
    console.error(`[FAIL] Found ${giveaways} direct answer giveaways in hints.`);
    hasFailure = true;
  } else {
    console.log("[PASS] No direct answer giveaways in hints.");
  }

  // 4. Claude Defect Signatures
  let bugCount = 0;
  for (const q of questions) {
    const p = (q.prompt + " " + (q.explanation || "")).toLowerCase();
    if (p.includes("lived seoul") || p.includes("studied seoul") || p.includes("stayed seoul")) {
      console.error(`[BUG] ${q.id}: Missing preposition in Seoul phrase.`);
      bugCount++;
    }
    if (p.includes("won first prize around the world")) {
      console.error(`[BUG] ${q.id}: Unnatural 'around the world' trailing phrasing.`);
      bugCount++;
    }
    if (p.includes("place where won first prize")) {
      console.error(`[BUG] ${q.id}: Malformed 'place where won first prize' phrasing.`);
      bugCount++;
    }
    if (q.id === "bk-en-e1-e-e1-alpha-024" && (q.options.find(o => o.id === q.answer.id)?.text === "X" || (q.prompt.includes("Box") && q.options.find(o => o.id === q.answer.id)?.text !== "B"))) {
      console.error(`[BUG] ${q.id}: 'Box' incorrectly marked as starting with 'X'.`);
      bugCount++;
    }
    if ((q.id.startsWith("bk-en-e") || q.id.startsWith("bk-en-m"))) {
      if (p.includes("exhausted; nevertheless") || 
          p.includes("hardly had i arrived") || 
          p.includes("collaboration fosters creative problem solving") || 
          p.includes("the experiment yielded significant results")) {
        console.error(`[BUG] ${q.id}: CSAT high school fallback found in elementary/middle item.`);
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

  return {
    total: questions.length,
    unique: seenNormKeys.size,
    duplicates: duplicateCount,
    giveaways,
    bugCount,
    hasFailure
  };
}

if (process.argv[1] && process.argv[1].endsWith("audit_english_bank.mjs")) {
  const args = process.argv.slice(2);
  const targetIndex = args.indexOf("--target");
  const targetPath = targetIndex !== -1 ? args[targetIndex + 1] : "lib/learn/content/bank/english.json";

  if (!fs.existsSync(targetPath)) {
    console.error("Target file not found:", targetPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  let questions = [];
  if (Array.isArray(raw)) {
    questions = raw;
  } else if (raw.questions) {
    questions = raw.questions;
  } else if (raw.middleSchoolQuestions && raw.highSchoolQuestions) {
    questions = [...raw.middleSchoolQuestions, ...raw.highSchoolQuestions];
  }

  const res = auditQuestions(questions, targetPath);
  if (res.hasFailure) {
    console.error("\n>>> AUDIT FAILED: Quality gate rejected the questions. <<<");
    process.exit(1);
  }
  console.log("\n>>> AUDIT PASSED: Quality gate approved. <<<");
  process.exit(0);
}
