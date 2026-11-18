// Compares two served-ids snapshots (scripts/learn/english-bank/served-ids.ts output) per language: added / removed / content-changed / unchanged.
//   npx tsx scripts/learn/english-bank/served-diff.ts <before.json> <after.json> <out.json> [pilot-ids.json]
// "added" counts only ids that were NOT served before, so questions already served by the previous release are never counted again as new recovery.
import fs from "node:fs";
const [bf, af, out, pf] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(bf, "utf8")) as Record<string, Record<string, string>>;
const after = JSON.parse(fs.readFileSync(af, "utf8")) as Record<string, Record<string, string>>;
const pilot = pf ? new Set(JSON.parse(fs.readFileSync(pf, "utf8")) as string[]) : null;
const rows: Record<string, unknown> = {};
for (const loc of Object.keys(after).sort()) {
  const b = before[loc] ?? {}, a = after[loc];
  const added = Object.keys(a).filter((i) => !(i in b)), removed = Object.keys(b).filter((i) => !(i in a));
  const changed = Object.keys(a).filter((i) => i in b && a[i] !== b[i]);
  const same = Object.keys(a).length - added.length - changed.length;
  rows[loc] = { before: Object.keys(b).length, after: Object.keys(a).length, added: added.length, removed: removed.length, contentChanged: changed.length, unchanged: same, addedOutsidePilot: pilot ? added.filter((i) => !pilot.has(i)).length : undefined, ...(removed.length ? { removedIds: removed } : {}), ...(changed.length ? { changedIds: changed } : {}), ...(added.length && added.length <= 40 ? { addedIds: added } : {}) };
}
fs.writeFileSync(out, JSON.stringify({ rows }, null, 1) + "\n");
const touched = Object.entries(rows).filter(([, r]) => { const x = r as { added: number; removed: number; contentChanged: number }; return x.added || x.removed || x.contentChanged; }).map(([l]) => l);
console.log(JSON.stringify({ locales: Object.keys(rows).length, touched, summary: Object.fromEntries(touched.map((l) => { const r = rows[l] as Record<string, number>; return [l, { before: r.before, after: r.after, added: r.added, removed: r.removed, changed: r.contentChanged, same: r.unchanged }]; })) }));
