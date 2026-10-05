// Mechanical scope gate of the learning-only production port.
//   node scripts/release/verify_port_scope.mjs [--base c4b03fe] [--head HEAD]
// Fails when the port touches anything outside the approved learning-only scope: marketplace, payment, provider, settlement, payout, outbox,
// webhook, push implementation, blockchain, Adult Study launch, Aircon, the marketplace migration chain, or the question-bank runtime.
// Local and read-only (git diff only).
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const base = opt("--base", "c4b03fe");
const head = opt("--head", "HEAD");

const rows = execSync(`git diff --name-status ${base}...${head}`, { maxBuffer: 1 << 28 }).toString().trim().split("\n").filter(Boolean).map((l) => { const p = l.split("\t"); return { status: p[0], file: p[p.length - 1] }; });

/** Forbidden categories: any ADDED or CHANGED file matching one of these fails the gate. */
const FORBIDDEN = [
  ["marketplace / request / checkout / helper app code", /^(app\/api\/(requests|checkouts|helper|pricing|payments|providers|rewards|media|referrals|chat|push|sys\/(requests|payments|rewards|review|push|cleanup))|app\/(tech|admin|request|review|payment|chat)\/|lib\/(payments|marketplace|pricing|request|helper|push|referral|conversation|review|rewards|solana|db)\/)/],
  ["payment / provider / settlement / payout / outbox / webhook", /(payment|provider|settlement|payout|outbox|webhook|airwallex|usdc|solana|devnet)/i],
  ["push implementation / service worker", /(^public\/sw\.js$|\/push\/|web-?push|vapid)/i],
  ["blockchain / transparency ledger", /(blockchain|merkle|ledger|transparency|anchor)/i],
  ["Adult Study launch / legacy corpus", /(^app\/study\/\[site\]\/.*adult|lib\/learn\/products\/|data\/learning-study\/|scripts\/learn\/study\/|study\.(korean|english|japanese|chinese|indonesian|vietnamese))/i],
  ["Aircon (deferred service)", /aircon/i],
  ["marketplace migrations", /^supabase\/migrations\/(202609(1[0-9]|2[0-9]|30(00(0[1-9]|1[0-9]|2[0-2])))|20261005)/],
  ["question-bank / calibration / rubric runtime", /(^lib\/learn\/bank\/|scripts\/learn\/bank\/|data\/learning-calibration\/|rubric)/i],
  ["certification / scholarship runtime", /(certification|scholarship)/i],
];
// Test files may mention forbidden words in assertions that prove their absence; they are checked only for the categories that matter for a runtime.
const TEST_OR_DOC = /^(tests\/|docs\/|scripts\/release\/verify_port_scope\.mjs$)/;
// Files the port MAY touch (explicit allowlist of learning scope); everything else is reported as "unexpected".
const ALLOWED = [
  /^components\/learn\//, /^lib\/learn\/(listen|i18n)\//, /^lib\/learn\/avatars\.ts$/, /^app\/study\/\[site\]\/\(play\)\/words\//,
  /^components\/customer\/(CustomerHome|StudyChooser)\.tsx$/, /^lib\/home\//, /^messages\/[A-Za-z-]+\.json$/,
  // canonical Korean of the English listening content, the learning API that sends a passage's Korean after the answer, its inventory tool
  /^lib\/learn\/content\/listening\//, /^lib\/learn\/server\/service\.ts$/, /^scripts\/learn\/listening-inventory\.mjs$/,
  /^tests\//, /^docs\//, /^scripts\/release\//,
  // staging-only tooling used to stage-validate the exact artifact (never used for production)
  /^(playwright\.staging\.config\.ts|wrangler\.staging\.jsonc)$/,
];

const bad = [], unexpected = [];
for (const { file, status } of rows) {
  if (TEST_OR_DOC.test(file)) continue;
  for (const [label, re] of FORBIDDEN) if (re.test(file)) bad.push(`${status} ${file}  [${label}]`);
  if (!ALLOWED.some((re) => re.test(file))) unexpected.push(`${status} ${file}`);
}
const count = (re) => rows.filter((r) => re.test(r.file)).length;
const summary = {
  base, head, files: rows.length,
  appFiles: count(/^(app|components|lib)\//), routeFiles: count(/^app\/.*\/(route|page)\.tsx?$/), migrationFiles: count(/^supabase\/migrations\//),
  messagesFiles: count(/^messages\//), testDocFiles: count(/^(tests|docs)\//), scriptFiles: count(/^scripts\//),
};
console.log(JSON.stringify(summary));
let failed = 0;
const check = (name, ok, detail = []) => { if (ok) console.log(`PASS ${name}`); else { failed++; console.error(`FAIL ${name}`); detail.forEach((d) => console.error("   " + d)); } };
check("no forbidden production scope (marketplace, payment, provider, settlement, payout, outbox, webhook, push, blockchain, Adult Study, Aircon, marketplace migrations, bank/rubric runtime, certification/scholarship)", bad.length === 0, bad);
check("every changed file is inside the approved learning-only allowlist", unexpected.length === 0, unexpected);
check("0 migrations", summary.migrationFiles === 0, [`${summary.migrationFiles} migration file(s)`]);
check("route files changed only by the learning words page", rows.filter((r) => /^app\/.*\/(route|page)\.tsx?$/.test(r.file)).every((r) => /\(play\)\/words\/page\.tsx$/.test(r.file)), rows.filter((r) => /^app\/.*\/(route|page)\.tsx?$/.test(r.file)).map((r) => r.file));
process.exit(failed ? 1 : 0);
