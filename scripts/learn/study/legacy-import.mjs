/**
 * Dry-run of the legacy adult-study import against the REAL legacy files. Nothing is written except the report; no database is touched.
 *   node scripts/learn/study/legacy-import.mjs [--root <legacy root>] [--out data/learning-study/import/legacy-discovery.json]
 * Default root: <home>/Documents/viet-project. Stages: discover, parse, normalize (no adapters ship), validate, report, dry run.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { discover, dryRun, loadRights, normalize, parseSources, report, validate } from "./importer.mjs";
import { validateContentPack } from "../../../lib/learn/products/content.ts";

const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : dflt; };
const root = arg("--root", path.join(os.homedir(), "Documents", "viet-project"));
const out = arg("--out", "data/learning-study/import/legacy-discovery.json");
const locales = JSON.parse(fs.readFileSync("messages/generated/locale-registry.json", "utf8")).locales; // generated from messages/index.ts and verified against it by tests
const rights = loadRights("data/learning-study/rights.json");

const discovered = discover(root);
const parsed = parseSources(root, discovered);
const normalized = normalize(parsed);
const validation = validate(normalized, validateContentPack, [...locales]);
const rep = report({ discovered, parsed, normalized, validation, rights });
rep.dryRun = dryRun(normalized, rights, Object.fromEntries(discovered.map((d) => [d.product, d.sources])));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rep, null, 1) + "\n");
for (const p of rep.products) console.log(`${p.product.padEnd(11)} sources ${p.sources.length} containers ${p.sources.reduce((a, s) => a + (s.containers ?? 0), 0)} rows-in-containers ${p.sources.reduce((a, s) => a + (s.rowsInContainers ?? 0), 0)} unmapped ${p.unmappedContainers} imported-rows ${Object.values(p.packCounts).reduce((a, b) => a + b, 0)}`);
console.log(`dry run: ${rep.dryRun.filter((d) => d.refused).length} refused, ${rep.dryRun.filter((d) => !d.refused).length} importable (rows would be created: ${rep.dryRun.reduce((a, d) => a + (d.wouldImport ? d.rowsTotal : 0), 0)}) -> ${out}`);
