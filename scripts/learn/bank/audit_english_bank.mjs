import fs from "node:fs";

const enBank = JSON.parse(fs.readFileSync("lib/learn/content/bank/english.json", "utf8"));

console.log("=== ENGLISH BANK QUALITY AUDIT ===");
console.log("Total question count:", enBank.questions.length);
console.log("Summary by grade:", enBank.grades);

// 1. Verify IDs uniqueness
const ids = new Set(enBank.questions.map(q => q.id));
console.log("Unique IDs count:", ids.size);
if (ids.size !== enBank.questions.length) console.error("DUPLICATE IDS FOUND!");

// 2. Verify prompt and item diversity
const uniquePrompts = new Set(enBank.questions.map(q => q.prompt));
console.log("Unique prompt strings count:", uniquePrompts.size);

const uniqueItems = new Set(enBank.questions.map(q => {
  const correct = q.options.find(o => o.id === q.answer.id)?.text;
  return `${q.skillId}:::${q.prompt}:::${correct}`;
}));
console.log("Unique (skill + prompt + correct answer) count:", uniqueItems.size);

// 3. Check for giveaways in hints
let giveaways = 0;
enBank.questions.forEach(q => {
  const correct = q.options.find(o => o.id === q.answer.id)?.text;
  if (!correct) return;
  q.hints.forEach(h => {
    if (h.toLowerCase().includes(`begins with the letter '${correct.toLowerCase()}'`)) {
      giveaways++;
    }
  });
});
console.log("Direct answer giveaways in hints:", giveaways);

// 4. Check for known Claude bug signatures
let bugCount = 0;
enBank.questions.forEach(q => {
  const p = q.prompt + " " + q.explanation;
  if (p.includes("lived Seoul") || p.includes("studied Seoul")) {
    console.error("Bug found: missing preposition in Seoul!");
    bugCount++;
  }
  if (p.includes("won first prize around the world")) {
    console.error("Bug found: around the world tail!");
    bugCount++;
  }
  if (p.includes("place where won first prize")) {
    console.error("Bug found: place where won first prize!");
    bugCount++;
  }
  if (q.id === "bk-en-e1-e-e1-alpha-024" && q.options.find(o => o.id === q.answer.id)?.text === "X") {
    console.error("Bug found: Box starts with X!");
    bugCount++;
  }
  if ((q.id.startsWith("bk-en-e") || q.id.startsWith("bk-en-m")) && p.includes("exhausted; nevertheless")) {
    console.error("Bug found: CSAT fallback in elementary/middle:", q.id);
    bugCount++;
  }
});
console.log("Known Claude review bug signatures found:", bugCount);

// 5. Verify difficulty distribution
const diffCounts = {};
enBank.questions.forEach(q => diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1);
console.log("Difficulty distribution (1..5):", diffCounts);

// 6. Verify answer choice balance (a, b, c, d)
const ansCounts = {};
enBank.questions.forEach(q => ansCounts[q.answer.id] = (ansCounts[q.answer.id] || 0) + 1);
console.log("Answer key distribution (a..d):", ansCounts);
