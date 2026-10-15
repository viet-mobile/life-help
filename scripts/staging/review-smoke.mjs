#!/usr/bin/env node
// Post-deploy smoke of the Korean REVIEW Worker (no credentials in this file).
//   node scripts/staging/review-smoke.mjs https://<review-host>                 anonymous checks (always)
//   REVIEW_COOKIE='<cookie header of a signed-in reviewer>' node scripts/staging/review-smoke.mjs https://<review-host>   + reviewer checks
// A non-reviewer check: NONREVIEWER_COOKIE='<cookie header of a signed-in NON-reviewer>' (expects the refusal page).
// Cookies come from the environment only; this script never prints them.
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https:\/\/[^/]+$/.test(base)) { console.error("usage: review-smoke.mjs https://<host>"); process.exit(2); }
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` (${extra})` : ""}`); };
const get = async (path, cookie) => { const r = await fetch(base + path, { redirect: "manual", headers: cookie ? { cookie } : {} }); return { status: r.status, text: await r.text(), headers: r.headers }; };

// anonymous
let r = await get("/study/korean/review");
check("anonymous /review shows the sign-in page, not content", r.status === 200 && r.text.includes("review-login") && !r.text.includes("review-row"), `status ${r.status}`);
r = await get("/study/korean/review/K7?lang=vi");
check("anonymous /review/K7 shows no questions", r.status === 200 && !r.text.includes("data-question-id") && !r.text.includes("k-k7-"), `status ${r.status}`);
r = await get("/study/korean/review/K11");
check("unknown level is 404 even anonymously", r.status === 404);
r = await get("/study/math/review");
check("review does not exist for math", r.status === 404);
r = await get("/learn-content/x/korean/vi.json");
check("/learn-content/* is refused to browsers", r.status === 404 || r.status === 403, `status ${r.status}`);
r = await get("/study/korean/review");
check("noindex header", /noindex/i.test(r.headers.get("x-robots-tag") ?? "") || /noindex/i.test(r.text));

const non = process.env.NONREVIEWER_COOKIE;
if (non) { r = await get("/study/korean/review/K7?lang=vi", non); check("signed-in non-reviewer is refused", r.status === 200 && r.text.includes("review-forbidden") && !r.text.includes("data-question-id")); }

const cookie = process.env.REVIEW_COOKIE;
if (cookie) {
  r = await get("/study/korean/review", cookie);
  check("reviewer: start page with banner and language table", r.status === 200 && r.text.includes("REVIEW ENVIRONMENT") && r.text.includes('data-tier="complete"') && r.text.includes('data-tier="partial"'));
  const LEVELS = Array.from({ length: 10 }, (_, i) => `K${i + 1}`);
  for (const lang of ["en", "ko", "vi", "ja", "zh-Hans", "sg"]) {
    for (const lv of LEVELS) {
      r = await get(`/study/korean/review/${lv}?lang=${lang}`, cookie);
      check(`reviewer: ${lv} ${lang} loads with ids and no load error`, r.status === 200 && r.text.includes("data-question-id") && !r.text.includes("review-load-error") && r.text.includes("DRAFT"), `status ${r.status}`);
    }
  }
  r = await get("/study/korean/review/K7?lang=zz", cookie);
  check("reviewer: unknown language is a visible error", r.status === 200 && r.text.includes("review-bad-lang"));
  r = await get("/study/korean/review/K7?lang=en&skill=k.k7.bridge_formal", cookie);
  check("reviewer: bridge skill shows bridge questions", r.status === 200 && r.text.includes("k-k7-bridge_formal-1"));
} else console.log("SKIP reviewer checks (REVIEW_COOKIE not set)");
const failed = results.filter((x) => !x).length;
console.log(`${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
