// Service-country consistency test (no network). Country definitions are spread over several files; this keeps them in
// step: registry (lib/region/countries.ts) -> domain routing + default language (proxy.ts, siteMetadata.ts) -> display
// names (CountryContext, desktopShortcut) -> slug map + default region + sub-region data (regions.ts, worldRegions.ts) ->
// per-country logos. Also: localized country names in every registry locale, existing countries unchanged, and no
// payment / payout / referral policy touched by a service-country change.
// Usage: node scripts/test_service_countries.mjs [--base <git-ref>]
import fs from "node:fs";
import { execFileSync } from "node:child_process";

let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : " :: " + String(extra).slice(0, 500)}`); if (!ok) failed++; };
const read = (f) => fs.readFileSync(f, "utf8");
const base = process.argv.includes("--base") ? process.argv[process.argv.indexOf("--base") + 1] : "56e1112";

const NEW = { SV: "elsalvador", CF: "centralafrica", VE: "venezuela", KE: "kenya", AR: "argentina", SG: "singapore" };
const countriesSrc = read("lib/region/countries.ts");
const parseCountries = (src) => [...src.matchAll(/\{ code: "([A-Z]{2})", slug: "([a-z]+)",[^\n]*\}/g)].map((m) => ({ code: m[1], slug: m[2], line: m[0] }));
const countries = parseCountries(countriesSrc);
const locales = [...read("messages/registry.ts").match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// ---- registry
check(`registry includes SV, CF, VE, KE, AR, SG (${countries.length} service countries)`, Object.entries(NEW).every(([c, s]) => countries.some((x) => x.code === c && x.slug === s)));
check("no duplicate ISO codes or slugs", new Set(countries.map((c) => c.code)).size === countries.length && new Set(countries.map((c) => c.slug)).size === countries.length);
check("codes are ISO 3166-1 alpha-2 (Intl knows every code)", countries.every((c) => new Intl.DisplayNames(["en"], { type: "region", fallback: "none" }).of(c.code)));
const union = countriesSrc.match(/export type CountryCode =([\s\S]*?)\| string;/)[1];
check("CountryCode union lists every registry code", countries.every((c) => union.includes(`"${c.code}"`)));

// ---- every derived map covers every registry country
const proxy = read("proxy.ts"), meta = read("lib/i18n/siteMetadata.ts"), ctx = read("lib/country/CountryContext.tsx"), shortcut = read("lib/shortcut/desktopShortcut.ts"), regions = read("lib/region/regions.ts"), world = read("lib/region/worldRegions.ts");
const proxySet = proxy.slice(proxy.indexOf("const COUNTRIES"), proxy.indexOf("]);", proxy.indexOf("const COUNTRIES")));
const mapOf = (src, name) => Object.fromEntries([...src.slice(src.indexOf(name)).split("};")[0].matchAll(/^\s+([a-z]+): "([^"]+)",/gm)].map((m) => [m[1], m[2]]));
const proxyLang = mapOf(proxy, "COUNTRY_TO_DEFAULT_LANGUAGE"), metaLang = mapOf(meta, "COUNTRY_TO_LANGUAGE_MAP"), slugToCode = mapOf(regions, "COUNTRY_SLUG_TO_CODE") ;
const missing = [];
for (const c of countries) {
  if (!proxySet.includes(`"${c.slug}"`)) missing.push(`proxy COUNTRIES ${c.slug}`);
  if (!proxyLang[c.slug]) missing.push(`proxy default language ${c.slug}`);
  if (!metaLang[c.slug]) missing.push(`siteMetadata language ${c.slug}`);
  if (!new RegExp(`\\n\\s+${c.slug}: "`).test(ctx)) missing.push(`CountryContext ${c.slug}`);
  if (!new RegExp(`\\n\\s+${c.slug}: "`).test(shortcut)) missing.push(`desktopShortcut ${c.slug}`);
  if (!new RegExp(`\\n\\s+${c.slug}: "${c.code}"`).test(regions)) missing.push(`regions slug map ${c.slug}`);
  for (const f of [`logo-${c.slug}.png`, `favicon-${c.slug}.png`, `favicon-${c.slug}.ico`, `favicon-${c.slug}-32.png`, `apple-touch-icon-${c.slug}.png`]) if (!fs.existsSync(`public/logos/${f}`)) missing.push(`logo ${f}`);
}
check("domain routing, default language, display names, slug map and logos cover every registry country", missing.length === 0, missing.join(", "));
check("proxy and siteMetadata agree on each country's default language", countries.every((c) => proxyLang[c.slug] === metaLang[c.slug] || (proxyLang[c.slug] === "zs" && metaLang[c.slug] === "zh-Hans") || (proxyLang[c.slug] === "zt" && metaLang[c.slug] === "zh-Hant")), JSON.stringify(countries.filter((c) => proxyLang[c.slug] !== metaLang[c.slug]).map((c) => [c.slug, proxyLang[c.slug], metaLang[c.slug]])));
check("each new country's default language is a registered locale (no new locale introduced by a country)", Object.values(NEW).every((s) => locales.includes(metaLang[s])), Object.values(NEW).map((s) => metaLang[s]).join());

// ---- sub-regions: real data for the new countries (never the "Main District" placeholder), default region exists in it
const blockOf = (code) => { const i = world.search(new RegExp(`^  ${code}: \\[`, "m")); return i < 0 ? "" : world.slice(i, world.indexOf("\n  ],", i)); };
for (const [code, expected] of [["SV", 14], ["CF", 17], ["VE", 24], ["KE", 47], ["AR", 24]]) {
  const block = blockOf(code);
  const level1 = (block.match(/^ {6}name: /gm) || []).length;
  const def = regions.match(new RegExp(`  ${code}: \\{ country: "${code}", sido: "([^"]+)", gungu: "([^"]+)", dong: "([^"]+)" \\}`));
  check(`${code}: ${expected} first-level subdivisions, default region present in the data`, level1 === expected && !!def && block.includes(`name: ${JSON.stringify(def[1])}`) && block.includes(`name: ${JSON.stringify(def[2])}`) && block.includes(JSON.stringify(def[3])), { level1, def: def?.slice(1) });
}
check("SG keeps its existing sub-region data", blockOf("SG").includes('name: "Central Region"'));
check("no placeholder subdivisions added", !/Main District|Area 1|Area 2/.test(Object.keys(NEW).map(blockOf).join("")));

// ---- localized names in every registry locale (ko from the registry, others from ICU with the tet->pt / arz->ar rule)
const FB = { tet: ["pt"], arz: ["ar"] };
const unresolved = [];
for (const l of locales) for (const code of Object.keys(NEW)) {
  if (l === "ko") { if (!/[가-힣]/.test(countries.find((c) => c.code === code).line.match(/nameKo: "([^"]+)"/)[1])) unresolved.push(`ko:${code}`); continue; }
  let got = null;
  for (const cand of [l, ...(FB[l] ?? [])]) {
    if (!Intl.DisplayNames.supportedLocalesOf([cand]).length) continue;
    const n = new Intl.DisplayNames([cand], { type: "region", fallback: "none" }).of(code);
    if (n && n !== code) { got = n; break; }
  }
  if (!got) unresolved.push(`${l}:${code}`);
}
check(`SV/CF/VE/KE/AR/SG have a localized name in all ${locales.length} registry locales without English fallback`, unresolved.length === 0, unresolved.join(", "));
const cldrBlock = countriesSrc.slice(countriesSrc.indexOf("CLDR_COUNTRY_NAMES: Readonly"), countriesSrc.indexOf("\n};", countriesSrc.indexOf("CLDR_COUNTRY_NAMES: Readonly")));
const BROWSER_ICU_GAPS = ["pa", "mn", "ne", "km", "my", "si"];
const cldrMissing = BROWSER_ICU_GAPS.flatMap((l) => { const b = cldrBlock.slice(cldrBlock.indexOf(`\n  ${l}: {`)); const blk = b.slice(0, b.indexOf("\n  },")); return countries.filter((c) => !new RegExp(`\\n    ${c.code}: "[^"]+",`).test(blk)).map((c) => `${l}:${c.code}`); });
check(`locales without (complete) browser region data (${BROWSER_ICU_GAPS.join(", ")}) have a CLDR name for every registry country`, cldrMissing.length === 0 && /CLDR_COUNTRY_NAMES\[locale\]\?\.\[country\.code\]/.test(countriesSrc), cldrMissing.join());
check("getCountryDisplayName never shows the bare region code (fallback: none + code check)", /fallback: "none"/.test(countriesSrc) && /name !== country\.code/.test(countriesSrc));

// ---- existing countries unchanged, nothing financial touched
const before = parseCountries(execFileSync("git", ["show", `${base}:lib/region/countries.ts`], { encoding: "utf8" }));
check(`existing ${before.length} countries unchanged (same lines, same order)`, before.every((b, i) => countries[i]?.line === b.line), before.filter((b, i) => countries[i]?.line !== b.line).map((b) => b.code).join());
const changed = execFileSync("git", ["diff", "--name-only", base], { encoding: "utf8" }).split("\n").filter(Boolean);
const financial = changed.filter((f) => /^supabase\/|payment|payout|referral|settlement|provider/i.test(f));
check("no payment / payout / referral / provider / settlement / database file changed by the country change", financial.length === 0, financial.join(", "));
check("request flow takes the selected region's country (no hidden country allow-list)", /country: selectedRegion\.country \|\| "KR"/.test(read("app/request/page.tsx")));

console.log(failed ? `FAILED ${failed}` : "ALL PASS");
process.exit(failed ? 1 : 0);
