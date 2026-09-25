import fs from "node:fs";
const locales = ["am", "ar", "arz", "bn", "da", "de", "el", "en", "es", "fa", "fr", "he", "hi", "id", "it", "ja", "kk", "km", "ko", "mn", "my", "ne", "nl", "no", "pl", "pt", "ru", "si", "sv", "ta", "tet", "th", "tr", "uk", "uz", "vi", "zh-Hans", "zh-Hant"];
const keys = ["customer.tagline", "customer.servicesTitle", "request.title", "request.submitButton", "request.successTitle", "request.backHome", "chat.title", "chat.send", "chat.original", "chat.translation", "common.home", "common.copy", "common.copied", "common.referralRewards", "common.rewardInfo", "common.tierWlh", "common.tierClh", "common.tierGlh", "common.payoutNotConnected"];
const get = (value, key) => key.split(".").reduce((current, part) => current && current[part], value);
const dictionaries = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8"))]));
const missing = [], empty = [], englishDuplicates = [], koreanLeakage = [];
const english = dictionaries.en;
for (const locale of locales) for (const key of keys) {
  const value = get(dictionaries[locale], key);
  if (typeof value !== "string") missing.push(`${locale}:${key}`);
  else if (!value.trim()) empty.push(`${locale}:${key}`);
  else if (locale !== "en" && locale !== "ko" && value === get(english, key) && !["LIFE.HELP ID", "ID"].includes(value)) englishDuplicates.push(`${locale}:${key}`);
  else if (locale !== "ko" && /[\uac00-\ud7af]/.test(value) && value !== "LIFE.HELP") koreanLeakage.push(`${locale}:${key}`);
}
console.log(`Supported locales: ${locales.length}`);
console.log(`Required customer keys: ${keys.length}`);
console.log(`Expected localized values: ${locales.length * keys.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Empty: ${empty.length}`);
console.log(`Suspicious English duplicates: ${englishDuplicates.length}`);
console.log(`Suspicious Korean leakage: ${koreanLeakage.length}`);
if (missing.length || empty.length) process.exitCode = 1;
