import { expect, test } from "@playwright/test";
import { BASE } from "./target";

/**
 * Country default languages. The staging Worker is on workers.dev (no country hostnames), so the proxy is asked the way it reads
 * the host: x-forwarded-host (SSR <html lang> carries the country's default language). No configuration is changed.
 */
const DEFAULTS: Array<[host: string, lang: string]> = [
  ["pakistan.life.help", "ur"],
  ["centralafrica.life.help", "fr"],
  ["romania.life.help", "en"],
  ["finland.life.help", "en"],
  ["czechia.life.help", "en"],
  ["hungary.life.help", "en"],
  ["zambia.life.help", "en"],
  ["uganda.life.help", "en"],
  ["congo.life.help", "fr"],
  ["kenya.life.help", "sw"],
  ["korea.life.help", "ko"],
  // existing defaults stay as they were
  ["vietnam.life.help", "vi"],
  ["japan.life.help", "ja"],
  ["uae.life.help", "ar"],
  ["egypt.life.help", "arz"],
  ["iran.life.help", "fa"],
  ["india.life.help", "hi"],
  ["argentina.life.help", "es"],
  ["elsalvador.life.help", "es"],
  ["venezuela.life.help", "es"],
];
for (const [host, lang] of DEFAULTS) {
  test(`${host} -> ${lang}`, async ({ request }) => {
    const res = await request.get(`${BASE}/`, { headers: { "x-forwarded-host": host }, maxRedirects: 0 });
    expect(res.status()).toBeLessThan(400);
    const html = await res.text();
    expect(html.match(/<html[^>]*\slang="([^"]+)"/)?.[1]).toBe(lang);
  });
}
test("a learning hostname is never mistaken for a country host (and the reverse)", async ({ request }) => {
  const res = await request.get(`${BASE}/`, { headers: { "x-forwarded-host": "xmath.life.help" }, maxRedirects: 0 });
  expect(res.status()).toBeLessThan(500);
  expect(await res.text()).not.toContain("study-root");
});
