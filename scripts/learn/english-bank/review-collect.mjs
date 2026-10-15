#!/usr/bin/env node
// Collects an independent review batch.   node scripts/learn/english-bank/review-collect.mjs <dir> <n> [--apply]
//   <dir>/blind-<n>.out.json   {answers:{<qid>: "b" | ["w2","w1",...]}, alt:{<qid>: "a,d"}, notes:{<qid>: "..."}}   (solved WITHOUT the key)
//   <dir>/review-<n>.out.json  {verdicts:{<qid>: "ok"|"defect"}, defects:[{id,severity,problem,fix}], patches:[{item,op:"set"|"drop",set?,why,severity}]}
// Without --apply it only prints the summary. With --apply: writes reviews/R<n>-<packet>.json, applies it with apply-review.mjs, rebuilds and records the reviewed items in ledger.json.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url"; import { execFileSync } from "node:child_process";
const here = path.dirname(fileURLToPath(import.meta.url));
const [dir, nStr] = process.argv.slice(2); const n = Number(nStr); const apply = process.argv.includes("--apply");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const full = read(path.join(dir, `full-${n}.json`));
const blind = read(path.join(dir, `blind-${n}.out.json`));
const rev = read(path.join(dir, `review-${n}.out.json`));
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const idOf = (skill, it) => sha(`${skill}|${it.k}|${it.k === "m" ? `${it.q}|${it.o.join("|")}` : (it.en ?? it.good ?? it.title)}`);
const itemOf = (qid) => qid.split("-")[1];
const text = (q, id) => q.options.find((o) => o.id === id)?.text;
const problems = [];
const ids = full.questions.map((q) => q.id);
for (const id of ids) { if (!(id in (blind.answers ?? {}))) problems.push(`blind: no answer for ${id}`); if (!(id in (rev.verdicts ?? {}))) problems.push(`review: no verdict for ${id}`); }
// canaries (see review-prepare.mjs): the blind solver must reject the bad ones and answer the good one
const A = blind.answers ?? {}, ALT = blind.alt ?? {};
const canaryFail = [];
if (A["canary-none"] !== undefined || A["canary-two"] !== undefined || A["canary-ok"] !== undefined) {
  if (!(String(A["canary-none"]).toLowerCase() === "none" || ALT["canary-none"])) canaryFail.push("canary-none was answered as if one option were correct");
  if (!ALT["canary-two"] && String(A["canary-two"]).toLowerCase() !== "none") canaryFail.push("canary-two (two defensible answers) was not flagged");
  if (String(A["canary-ok"]).toLowerCase() !== "b") canaryFail.push("canary-ok (easy control) was answered wrongly");
} else canaryFail.push("no canary answers: this blind file predates the canary check");
const mismatch = [], ambiguous = [];
for (const q of full.questions) {
  const a = blind.answers?.[q.id]; if (a === undefined) continue;
  if (q.answer.kind === "choice") { if (String(a).toLowerCase().trim() !== q.answer.id) mismatch.push(q.id); if (blind.alt?.[q.id]) ambiguous.push(q.id); }
  else { const keyT = q.answer.ids.map((i) => text(q, i)).join(" "); const gotT = (Array.isArray(a) ? a : []).map((i) => text(q, i)).join(" "); if (keyT !== gotT) mismatch.push(q.id); }
}
const defective = new Set(Object.entries(rev.verdicts ?? {}).filter(([, v]) => v !== "ok").map(([k]) => k));
for (const id of [...mismatch, ...ambiguous]) defective.add(id);
const patched = new Set((rev.patches ?? []).map((p) => p.item));
const acceptArg = process.argv.indexOf("--accept"); const accepted = new Set(acceptArg > 0 ? process.argv[acceptArg + 1].split(",") : []); // items whose blind-solver disagreement was adjudicated in favour of the key
const flaggedItems = new Set([...defective].map(itemOf).filter((i) => !accepted.has(i) || patched.has(i)));
const unresolved = [...flaggedItems].filter((i) => !patched.has(i));
const summary = { batch: n, packet: full.packet, questions: ids.length, items: Object.keys(full.items).length, blindMismatch: mismatch.length, blindAmbiguous: ambiguous.length, reviewerDefects: (rev.defects ?? []).length, bySeverity: (rev.defects ?? []).reduce((m, d) => (m[d.severity] = (m[d.severity] ?? 0) + 1, m), {}), patches: (rev.patches ?? []).length, unresolvedFlaggedItems: unresolved, problems, canary: canaryFail.length ? canaryFail : "ok" };
console.log(JSON.stringify(summary));
if (canaryFail.length && !process.argv.includes("--allow-no-canary")) { console.error("UNRELIABLE BLIND SOLVER:\n  " + canaryFail.join("\n  ")); process.exit(4); }
if (problems.length) { console.error("INCOMPLETE REVIEW:\n  " + problems.slice(0, 10).join("\n  ")); process.exit(3); }
if (!apply) process.exit(0);
// -- apply
const R = path.join(here, "reviews"); const file = path.join(R, `R${n}-${full.packet}.json`);
const ledgerOnly = process.argv.includes("--ledger-only");
let log = { skipped: "ledger-only" };
if (!ledgerOnly) {
  fs.writeFileSync(file, JSON.stringify({ packet: full.packet, reviewer: "AI (Claude) independent reviewers (blind solve + informed review), separate from the author; not a native-speaker or teacher review", scope: { batch: n, questions: ids.length }, patches: rev.patches ?? [], ok: ids.length - defective.size, criteria: "single defensible answer (blind solve), natural English, level, distractor validity, hint and explanation" }, null, 1) + "\n");
  log = JSON.parse(execFileSync("node", [path.join(here, "apply-review.mjs"), file], { encoding: "utf8" }).trim().split("\n").pop());
}
// ledger: exactly the items of THIS batch. ok = no flag at all; patched = flagged and fixed (new id computed from the patch); dropped / unresolved items are not recorded.
const ledger = read(path.join(here, "ledger.json")); const when = new Date().toISOString().slice(0, 10);
const patchOf = new Map((rev.patches ?? []).map((p) => [p.item, p]));
const counts = { ok: 0, patched: 0, dropped: 0, unresolved: 0 };
for (const [item, entry] of Object.entries(full.items)) {
  const p = patchOf.get(item);
  if (p?.op === "drop") { counts.dropped++; continue; }
  if (p?.op === "set") { const newId = idOf(entry.skill, { ...entry.item, ...p.set }); ledger.reviewed[newId] = { batch: n, verdict: "patched", at: when }; if (newId !== item) delete ledger.reviewed[item]; counts.patched++; continue; }
  if (flaggedItems.has(item)) { counts.unresolved++; continue; }
  ledger.reviewed[item] = { batch: n, verdict: "ok", at: when }; counts.ok++;
}
fs.writeFileSync(path.join(here, "ledger.json"), JSON.stringify(ledger));
console.log(JSON.stringify({ applied: log, ledger: counts, unresolvedFlaggedItems: unresolved }));
