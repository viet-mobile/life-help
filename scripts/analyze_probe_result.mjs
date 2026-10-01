// Scores the JSON output of a generated read-only probe per migration (offline; no database access).
//   node scripts/analyze_probe_result.mjs <probe-output.json> <probe.meta.json>
// APPLIED      every object this migration changed matches (its own version or a later one)
// NOT_APPLIED  none of the objects it introduced exists (and nothing it introduced is present)
// PARTIAL      some of what it introduced exists, some does not
// MISMATCH     objects exist with a definition that matches no known version
// UNKNOWN      the migration changes no catalog object
import fs from "node:fs";
export function analyze(rows, meta) {
  const isNew = new Map(meta.map((m) => [`${m.m}|${m.t}|${m.n}`, m.isNew]));
  const by = new Map();
  for (const r of rows.filter((x) => x.object_type !== "ROLLUP")) {
    if (!/^2026\d{8}$/.test(r.migration)) continue;
    const g = by.get(r.migration) ?? by.set(r.migration, { ok: 0, missing: 0, stale: 0, mismatch: 0, newOk: 0, newMissing: 0, nNew: 0, details: [] }).get(r.migration);
    // Objects that a later migration drops (or that this one drops) are absent whether or not the migration ran: no evidence either way.
    if (/^(absent:|dropped by)/.test(r.detail)) continue;
    const fresh = isNew.get(`${r.migration}|${r.object_type}|${r.object_name}`);
    const stale = /^STALE/.test(r.detail);
    if (r.verdict === "OK") g.ok++; else if (r.verdict === "MISSING") g.missing++; else if (stale) g.stale++; else { g.mismatch++; g.details.push(`${r.object_type} ${r.object_name} :: ${r.detail}`); }
    if (fresh) { g.nNew++; if (r.verdict === "OK") g.newOk++; else if (r.verdict === "MISSING") g.newMissing++; }
  }
  const out = {};
  for (const [m, g] of by) {
    const total = g.ok + g.missing + g.stale + g.mismatch;
    let status;
    if (total === 0) status = "UNKNOWN";
    else if (g.ok === total) status = "APPLIED";
    else if (g.nNew > 0 ? g.newOk === 0 && g.mismatch === 0 : g.ok === 0 && g.mismatch === 0) status = "NOT_APPLIED";
    else if (g.mismatch > 0 && g.missing === 0 && g.stale === 0) status = "MISMATCH";
    else status = "PARTIAL";
    out[m] = { status, total, ...g };
  }
  return out;
}
if (process.argv[2]) {
  const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).rows;
  const res = analyze(rows, JSON.parse(fs.readFileSync(process.argv[3], "utf8")));
  for (const [m, g] of Object.entries(res).sort()) console.log(`${m}  ${g.status.padEnd(12)} objects=${g.total} ok=${g.ok} missing=${g.missing} stale=${g.stale} mismatch=${g.mismatch} new(present/absent)=${g.newOk}/${g.newMissing}`);
}
