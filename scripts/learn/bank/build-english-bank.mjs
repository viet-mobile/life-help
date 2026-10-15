// scripts/learn/bank/build-english-bank.mjs
// Builds the skill-linked practice question bank for English across all 12 grades (E1..H3)
// Generating 555 questions per grade (111 per skill) to bring total questions to 6,660 questions.
// All prompts, hints, and explanations are English-native (zero Hangul) for universal 47-locale compatibility.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pythonScript = path.join(root, "scripts/learn/bank/build_full_english_bank.py");

try {
  const out = execFileSync("/usr/bin/python3", [pythonScript], {
    cwd: root,
    env: { ...process.env, PYTHONPATH: root },
    encoding: "utf8"
  });
  console.log(out.trim());
} catch (err) {
  console.error("Failed to build English bank via python generator:", err);
  process.exit(1);
}
