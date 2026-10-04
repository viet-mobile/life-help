// Generate questions from the bank.
//
//   node scripts/learn/bank/generate.mjs --subject math --level 6 --count 10 [--seed 42] [--cognitive ANALYZE] [--out file.json] [--lang ko|vi]
//   node scripts/learn/bank/generate.mjs --coverage          which templates serve which level
//
// Prints a readable preview, or writes { items, bundle, overlay } as JSON with --out.
import fs from "node:fs";
import { generate, coverage } from "./engine.mjs";
import { gradeOfLevel } from "./levels.mjs";

const args = process.argv.slice(2);
const arg = (k, d = null) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);

if (args.includes("--coverage")) {
  const cov = coverage();
  for (const [subject, levels] of Object.entries(cov)) {
    console.log(`\n${subject}`);
    for (const [lvl, ids] of Object.entries(levels)) console.log(`  level ${String(lvl).padStart(2)} (${gradeOfLevel(Number(lvl))}): ${ids.length} templates  ${ids.join(", ")}`);
  }
  process.exit(0);
}

const subject = arg("--subject"), level = Number(arg("--level")), count = Number(arg("--count", 10)), seed = arg("--seed", String(Date.now() % 100000));
if (!subject || !level) { console.error("usage: generate.mjs --subject math|english --level 1..10 [--count n] [--seed s] [--cognitive CLASS] [--out file.json] [--lang ko|vi]"); process.exit(2); }
const r = generate({ subject, level, count, seed, cognitive: arg("--cognitive") });
if (arg("--out")) { fs.writeFileSync(arg("--out"), JSON.stringify(r, null, 1)); console.log(`wrote ${r.items.length} items to ${arg("--out")} (seed ${seed})`); process.exit(0); }
const vi = arg("--lang") === "vi";
console.log(`${subject} level ${level} (${gradeOfLevel(level)}) seed ${seed}: ${r.items.length} items   [provisional scale]\n`);
for (const it of r.items) {
  const q = it.question, o = it.overlay;
  console.log(`- ${it.id}  ${it.template}  ${it.cognitive}  rubric level ${it.predictedLevel}`);
  console.log(`  ${vi ? o.prompt : q.prompt}`);
  if (q.options) q.options.forEach((opt) => console.log(`    ${opt.id}) ${vi && o.options?.[opt.id] ? o.options[opt.id] : typeof opt.text === "string" ? opt.text : opt.text}${q.answer.kind === "choice" && q.answer.id === opt.id ? "   <- answer" : ""}`));
  else console.log(`    answer: ${JSON.stringify(q.answer)}`);
}
