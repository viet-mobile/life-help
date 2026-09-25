import fs from "node:fs";

const locales = ["am", "ar", "arz", "bn", "da", "de", "el", "en", "es", "fa", "fr", "he", "hi", "id", "it", "ja", "kk", "km", "ko", "mn", "my", "ne", "nl", "no", "pl", "pt", "ru", "si", "sv", "ta", "tet", "th", "tr", "uk", "uz", "vi", "zh-Hans", "zh-Hant"];
const requiredKeys = ["customer.tagline", "customer.servicesTitle", "request.title", "request.submitButton", "request.successTitle", "request.backHome", "chat.title", "chat.send", "common.home"];
const read = (value, key) => key.split(".").reduce((current, segment) => current && current[segment], value);
const missing = [];
for (const locale of locales) {
  const dictionary = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8"));
  for (const key of requiredKeys) {
    const value = read(dictionary, key);
    if (typeof value !== "string" || !value.trim()) missing.push(`${locale}:${key}`);
  }
}
for (const item of missing) console.log(`FAIL ${item}`);
console.log(`${missing.length ? "FAIL" : "PASS"} ${locales.length} locales x ${requiredKeys.length} customer journey keys`);
if (missing.length) process.exit(1);
