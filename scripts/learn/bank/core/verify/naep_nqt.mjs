/**
 * Independent verification of the NAEP rows against the public NAEP Questions Tool (NQT) web API (read-only, anonymous).
 *   node scripts/learn/bank/core/verify/naep_nqt.mjs <items.csv> <out.json>
 * For every released 2017 item of NAEP mathematics and reading, grades 4 and 8, it records FACTS only: the item id, the response categories the item is
 * scored with (e.g. Incorrect / Partial / Correct / Omitted / Off task) and the national percentage in every category. No item text is stored.
 * It then compares the bulk CSV with the top (full-credit) category and reports which released items the bulk extraction did not use.
 */
import fs from "node:fs";
import { parseCsv } from "../contract.mjs";

const API = "https://www.nationsreportcard.gov/nqt/api/";
const post = async (path, body) => {
  const res = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
};
const NON_SCORE = new Set(["omitted", "off task", "year", "jurisdiction", "all students", ""]);
const FULL_LABELS = new Set(["correct", "full comprehension"]);

const csv = new Map(parseCsv(fs.readFileSync(process.argv[2], "utf8")).rows.map((r) => [`${r.source_id}|${r.item_ref}`, Number(r.correct_rate)]));

const SETS = [["MAT", "4", "NAEP-2017-G4-M"], ["MAT", "8", "NAEP-2017-G8-M"], ["RED", "4", "NAEP-2017-G4-R"], ["RED", "8", "NAEP-2017-G8-R"]];
const out = { source: "NAEP Questions Tool", year: 2017, sets: {}, items: [] };
for (const [subject, grade, sourceId] of SETS) {
  const sub = await post("querypanel/subjectgradeinfo", { SubjectCode: subject, GradeStr: grade, SystemID: "1" });
  for (const y of sub.yearsInfo) y.isSelected = y.year === 2017;
  const tab = await post("queryresults/getTabular", { SubjectCode: subject, GradeStr: grade, SystemID: "1", SubjectGradeInfo: sub.subjectGradeInfo, YearsInfo: sub.yearsInfo, LimitToOnlineItems: false, ContentClassifications: sub.contentClassifications, ItemTypes: sub.itemTypes, DifficultyInfo: sub.difficultyInfo, CalculatorInfo: "NONE" });
  const grid = tab.gridItemsList ?? [];
  let used = 0, mismatched = [], unused = [];
  for (const g of grid) {
    const perf = await post("queryresults/GetItemPerformanceData", { itemTableID: g.itemTableIDAsInt, ndeSystemId: "1", subjectCode: subject, JurisdictionsSelected: "NT", VariablesSelected: "TOTAL", Statistics: ["PERCENT"], output: 1 });
    const p = perf?.[0];
    const row = p?.tabularDataList?.["1"]?.tabDataRow;
    if (!p || !row) { unused.push({ item: g.naepId, reason: "no national performance row" }); continue; }
    const heads = p.columnHeadingsList.map((h) => h.headingText);
    const first = heads.findIndex((h) => h && !NON_SCORE.has(h.toLowerCase()));
    const categories = {};
    for (let i = first; i < heads.length && heads[i] && heads[i] !== "Year"; i++) categories[heads[i]] = row[String(i + 1)]?.fpValue ?? null;
    const scored = Object.keys(categories).filter((h) => !NON_SCORE.has(h.toLowerCase()));
    const key = scored.find((h) => h.includes("*")); // multiple choice: the key option is marked with *
    const labelled = scored.find((h) => FULL_LABELS.has(h.toLowerCase()));
    const top = key ?? labelled ?? null; // any other scale (Extended, Extensive, ...) has no unambiguous full-credit label
    const fact = { sourceId, item: g.naepId, itemType: g.type ?? g.displayType ?? null, categories, scoredCategories: scored, fullCreditCategory: top, fullCreditPct: top ? categories[top] : null, scoringModel: key ? "DICHOTOMOUS" : scored.length > 2 ? "PARTIAL_CREDIT" : "DICHOTOMOUS", fullCreditUnambiguous: top !== null };
    const rate = csv.get(`${sourceId}|${g.naepId}`);
    fact.inBulkCsv = rate !== undefined;
    fact.csvMatchesFullCredit = rate !== undefined && fact.fullCreditPct !== null ? Math.abs(rate * 100 - fact.fullCreditPct) < 0.006 : null;
    if (rate !== undefined) { used++; if (!fact.csvMatchesFullCredit) mismatched.push(g.naepId); } else unused.push({ item: g.naepId, reason: "not in bulk CSV" });
    out.items.push(fact);
  }
  const inCsv = [...csv.keys()].filter((k) => k.startsWith(sourceId + "|")).length;
  out.sets[sourceId] = { releasedGridItems: grid.length, usedInBulkCsv: used, csvRows: inCsv, csvRowsNotFoundInApi: inCsv - used, mismatchedRates: mismatched, unusedItems: unused.length };
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.sets, null, 1));
