/**
 * Mechanical census of "viet.mobile" references in the legacy adult-study repositories, classified by what they ARE.
 *   node scripts/learn/bank/core/verify/legacy_domain_refs.mjs [legacyRoot=C:/Users/<you>/Documents/viet-project] [out.json]
 * Reads files, counts matches, records (file, line, category) only: no content is copied. The legacy repositories are outside this repository, so the
 * result is a dated snapshot, not a reproducible build artefact.
 *
 * Categories (migration strategy per category in docs/learning/legacy-migration.md):
 *   CANONICAL_METADATA  <link rel="canonical">, og:url, meta url in html
 *   MANIFEST_PWA        manifest.webmanifest
 *   SERVICE_WORKER      sw.js
 *   UI_LINK             href / anchor / navigation text inside html or app logic
 *   API_CONFIG          constants, build scripts and fetch/storage configuration (app_logic.js, build_app.py, assemble_app.py)
 *   STATIC_TEXT         README and sample data text
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.argv[2] ?? path.join(os.homedir(), "Documents", "viet-project");
const out = process.argv[3] ?? "docs/learning/legacy-domain-references.json";
const SITES = {
  korean: { src: "hoc-tieng-han", dist: "hoc-tieng-viet-mobile/dist/study-korean" },
  english: { src: "hoc-tieng-anh", dist: "hoc-tieng-viet-mobile/dist/study-english" },
  japanese: { src: null, dist: "hoc-tieng-viet-mobile/dist/study-japanese" },
  chinese: { src: "zhong-wen", dist: "hoc-tieng-viet-mobile/dist/study-chinese" },
  indonesian: { src: "bahasa-indonesia", dist: "hoc-tieng-viet-mobile/dist/study-indonesian" },
};
const SKIP = new Set(["node_modules", ".git", "__pycache__", "dist"]);
const walk = (dir, skipDist, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue; // nested dist folders are build output of the same sources: never counted twice
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, skipDist, acc); else acc.push(p);
  }
  return acc;
};
const classify = (file, line) => {
  const base = path.basename(file);
  if (base === "sw.js") return "SERVICE_WORKER";
  if (base === "manifest.webmanifest") return "MANIFEST_PWA";
  if (/\.md$|\.txt$/.test(base) || base === "sample_data.py") return "STATIC_TEXT";
  if (/\.html$/.test(base)) return /rel=["']canonical["']|property=["']og:url["']|name=["']twitter:url["']/.test(line) ? "CANONICAL_METADATA" : /href=/.test(line) ? "UI_LINK" : "STATIC_TEXT";
  if (base === "app_logic.js") return /href|location\.|window\.open|<a /.test(line) ? "UI_LINK" : "API_CONFIG";
  if (/\.py$/.test(base)) return "API_CONFIG";
  return "STATIC_TEXT";
};
const result = { snapshotAt: new Date().toISOString(), note: "counts of the string viet.mobile; categories by file and line context", sites: {}, totals: {} };
for (const [site, where] of Object.entries(SITES)) {
  result.sites[site] = {};
  for (const [kind, rel] of Object.entries(where)) {
    if (!rel) { result.sites[site][kind] = { present: false }; continue; }
    const dir = path.join(root, rel);
    if (!fs.existsSync(dir)) { result.sites[site][kind] = { present: false }; continue; }
    const cats = {}, files = {}; let n = 0;
    for (const f of walk(dir, kind === "dist")) {
      if (!/\.(js|html|py|json|webmanifest|md|txt)$/.test(f) && path.basename(f) !== "_redirects") continue;
      let text; try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
      text.split("\n").forEach((line, i) => {
        const hits = (line.match(/viet\.mobile/g) ?? []).length;
        if (!hits) return;
        const cat = classify(f, line);
        cats[cat] = (cats[cat] ?? 0) + hits; n += hits;
        (files[path.relative(dir, f)] ??= []).push({ line: i + 1, category: cat, hits });
      });
    }
    result.sites[site][kind] = { present: true, references: n, byCategory: cats, files };
    result.totals[kind] = (result.totals[kind] ?? 0) + n;
  }
}
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.totals), "-> " + out);
for (const [s, v] of Object.entries(result.sites)) console.log(s, JSON.stringify(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.present ? { n: x.references, ...x.byCategory } : "absent"]))));
