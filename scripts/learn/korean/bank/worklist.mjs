#!/usr/bin/env node
// Generates docs/learning/korean-bank/worklist.md: untranslated bank texts per locale tier and reading / dialogue shortfalls per level.
//   node scripts/learn/korean/bank/worklist.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const K = path.join(root, "scripts/learn/korean/bank/kit");
const bank = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/korean.json"), "utf8"));
const full = JSON.parse(fs.readFileSync(path.join(K, "source.en.json"), "utf8")).texts;
const minimal = JSON.parse(fs.readFileSync(path.join(K, "source.minimal.en.json"), "utf8")).texts;
const FULL = ["ko", "vi", "ja", "zh-Hans", "zh-Hant", "th", "id", "uz", "mn", "ru", "es", "fr", "de", "ne"];
const kits = fs.readdirSync(K).filter((f) => /^[a-zA-Z-]+\.json$/.test(f)).map((f) => f.replace(".json", ""));
const minimalLocales = kits.filter((l) => !FULL.includes(l)).sort();

// which level each text belongs to
const lvOf = {};
for (const [sid, sk] of Object.entries(bank.skills)) {
  const lv = `K${sid.split(".")[1].slice(1)}`;
  for (const it of sk.items) { if (it.c === "syl") continue; lvOf[`g:${it.id}`] = lv; if (it.s) lvOf[`s:${it.id}`] = lv; if (it.n) lvOf[`n:${sid}:${it.n}`] = lv; }
}
const byLevel = {};
const missingKeys = Object.keys(full).filter((k) => !(k in minimal));
for (const k of missingKeys) { const lv = lvOf[k] ?? "?"; (byLevel[lv] ??= { g: 0, s: 0, n: 0 })[k[0]]++; }
const levels = Object.keys(byLevel).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

// reading / dialogue
const rows = {};
for (const [sid, sk] of Object.entries(bank.skills)) {
  const lv = `K${sid.split(".")[1].slice(1)}`;
  for (const it of sk.items) {
    if (it.c !== "passage") continue;
    const r = (rows[lv] ??= { reading: 0, dialogue: 0 });
    (/(^|\n)[A-Z가-힣]:/.test(it.ko) ? (r.dialogue++) : (r.reading++));
  }
}
const TARGET = { reading: 8, dialogue: 10 };
const L = [];
L.push("# 한국어 문제은행 작업 목록", "", "자동 생성(`node scripts/learn/korean/bank/worklist.mjs`). 은행은 비공개(DRAFT)입니다. 아래는 공개 전에 채워야 하는 범위입니다.", "");
L.push("## 1. 번역 범위", "",
  `- 전체 번역(은행 전체 ${Object.keys(full).length}개 텍스트): ${FULL.join(", ")} (영어 \`en\`은 원본)`,
  `- **최소 번역만 있는 ${minimalLocales.length}개 언어**(템플릿 + 징검다리 + 텍스트 ${Object.keys(minimal).length}개): ${minimalLocales.join(", ")}`,
  `- 언어당 미번역 텍스트: ${missingKeys.length}개 (뜻 g ${missingKeys.filter((k) => k[0] === "g").length}, 상황 s ${missingKeys.filter((k) => k[0] === "s").length}, 문법 노트 n ${missingKeys.filter((k) => k[0] === "n").length}) → 전체 ${missingKeys.length * minimalLocales.length}개.`,
  "- 공개 조건: `build-content-assets.mjs`는 PUBLISHED 은행이 모든 언어에서 완전할 것을 요구합니다. 최소 번역 언어는 이 작업이 끝나기 전까지 은행을 열 수 없습니다.",
  "- 모든 키트는 AI 번역이며 원어민 검수 전입니다. 번역 때 알려진 약한 언어: sg(상고), tet(테툼), arz.", "",
  "언어당 레벨별 미번역 텍스트(번역 묶음 단위로 사용):", "", "| 레벨 | 뜻 g | 상황 s | 노트 n | 합계 |", "|---|---:|---:|---:|---:|");
for (const lv of levels) { const r = byLevel[lv]; L.push(`| ${lv} | ${r.g} | ${r.s} | ${r.n} | ${r.g + r.s + r.n} |`); }
L.push("", "작업 절차: ① `source.en.json`에서 레벨별 키를 잘라 번역 묶음 생성 ② 번역 ③ `validate-kit.mjs <locale> <file>`(`--minimal` 없이) ④ `kit/<locale>.json`에 병합 ⑤ `build.mjs`·`build-korean-content.mjs`·`build-content-assets.mjs` 재실행.", "");
L.push("## 2. 읽기·대화 부족분(고유 지문 수)", "", `임시 목표: K2~K10 각 레벨에 읽기 지문 ${TARGET.reading}개 이상, 대화 ${TARGET.dialogue}개 이상(K1은 글자·낱말 중심이라 제외, 표지판·라벨 읽기 6개 이상 권장). 목표는 교사 검토에서 조정합니다.`, "",
  "| 레벨 | 읽기(현재) | 읽기 부족 | 대화(현재) | 대화 부족 |", "|---|---:|---:|---:|---:|");
let sr = 0, sd = 0;
for (let n = 1; n <= 10; n++) {
  const lv = `K${n}`, r = rows[lv] ?? { reading: 0, dialogue: 0 };
  const tr = n === 1 ? 6 : TARGET.reading, td = n === 1 ? 0 : TARGET.dialogue;
  const mr = Math.max(0, tr - r.reading), md = Math.max(0, td - r.dialogue);
  sr += mr; sd += md;
  L.push(`| ${lv} | ${r.reading} | ${mr} | ${r.dialogue} | ${md} |`);
}
L.push(`| 합계 | | ${sr} | | ${sd} |`, "",
  "- 읽기·대화 지문은 문항 4~5개(지문 진위, 정렬 등)로 확장되므로, 부족분을 채우면 문항 수도 늘어납니다.",
  "- 지문은 수준에 맞는 어휘만 쓰고(해당 레벨까지 배운 어휘 + 지문 주석), 지문마다 진위·내용 이해 질문을 만듭니다. 새 지문은 독립 검토를 거치기 전까지 DRAFT입니다.",
  "- 듣기 문항은 음성 재생 뒤 텍스트를 고르는 인지 문항이므로 듣기·말하기 능력의 근거로 세지 않습니다.", "");
fs.writeFileSync(path.join(root, "docs/learning/korean-bank/worklist.md"), L.join("\n") + "\n");
console.log(`worklist: ${minimalLocales.length} minimal locales x ${missingKeys.length} texts; reading short ${sr}, dialogue short ${sd}`);
