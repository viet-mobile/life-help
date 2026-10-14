// Counts and allocation tables of the Korean practice bank.  npx tsx scripts/learn/korean/bank/report.ts [--check]
//   writes docs/learning/korean-bank/allocation.md and allocation.json
import fs from "node:fs";
import path from "node:path";
import bank from "../../../../lib/learn/content/bank/korean.json";
import kitEn from "./kit/en.json";
import { expandKoreanBank, formsOf, type KBankData, type KKit } from "../../../../lib/learn/content/korean-bank";

const data = bank as unknown as KBankData;
const kit: KKit = { templates: kitEn.templates as unknown as KKit["templates"], texts: {} };
const qs = expandKoreanBank(data, kit, null);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const check = process.argv.includes("--check");

type Row = { items: number; sub: number; q: number; byCat: Record<string, number>; byForm: Record<string, number> };
const levelOf = (sid: string) => `K${sid.split(".")[1].slice(1)}`;
const rows: Record<string, Row> = {};
const skillRows: Record<string, Row> = {};
const blank = (): Row => ({ items: 0, sub: 0, q: 0, byCat: {}, byForm: {} });
const CAT = (c: string, ko: string) => (c === "syl" ? "소리·글자(음절 치환)" : c === "word" || c === "phrase" ? "어휘" : c === "sentence" ? "문법·문장" : c === "expr" ? "상황별 표현" : /^[A-Z가-힣]:/m.test(ko) ? "대화(읽기)" : "읽기");
for (const [sid, sk] of Object.entries(data.skills)) {
  for (const it of sk.items) {
    for (const r of [(rows[levelOf(sid)] ??= blank()), (skillRows[sid] ??= blank())]) {
      if (it.c === "syl") r.sub++; else r.items++;
    }
    const forms = formsOf(it, sid);
    const cat = CAT(it.c, it.ko);
    for (const r of [rows[levelOf(sid)], skillRows[sid]]) {
      r.q += forms.length; r.byCat[cat] = (r.byCat[cat] ?? 0) + forms.length;
      for (const f of forms) r.byForm[f] = (r.byForm[f] ?? 0) + 1;
    }
  }
}
if (qs.length !== Object.values(rows).reduce((a, r) => a + r.q, 0)) throw new Error("report: expansion and form count disagree");
const total = Object.values(rows).reduce((a, r) => ({ items: a.items + r.items, sub: a.sub + r.sub, q: a.q + r.q }), { items: 0, sub: 0, q: 0 });
const lv = Object.keys(rows).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
const cats = ["소리·글자(음절 치환)", "어휘", "문법·문장", "상황별 표현", "읽기", "대화(읽기)"];
const forms = ["meaning", "toko", "listen", "tf", "read", "fromrr", "sit", "cloze", "choose", "order", "passage"];
const L: string[] = [];
L.push("# 한국어 문제은행 배분표", "", "자동 생성 문서(`npx tsx scripts/learn/korean/bank/report.ts`). 은행은 비공개(DRAFT)이며 원어민·교사 검토를 받지 않았습니다.", "");
L.push("## 집계 기준", "",
  "- **전체 문항(ID) 수**: 확장된 객관식·참거짓·정렬 문항의 총수. 보기 순서·ID만 다른 복제는 없습니다(문항마다 형식·대상·정답이 다름).",
  "- **고유 학습 항목**: 서로 다른 한국어 단어·표현·문장·지문(음절 치환 연습 제외). 같은 항목을 다른 형식(뜻 고르기, 한국어 고르기, 듣기, 참/거짓, 빈칸, 문장 고르기, 정렬)으로 묻는 문항은 **형식 변형**으로 따로 셉니다.",
  "- **단순 치환 변형**: 자음·모음·받침을 바꿔 끼운 음절 연습(K1). 고유 학습 항목에 넣지 않습니다.",
  "- 듣기는 음성 재생 뒤 텍스트 보기를 고르는 인지 문항이며 **말하기 능력을 평가하지 않습니다**. 듣기·말하기 능력은 문항 수만으로 충족되지 않습니다.", "");
L.push("## 합계", "", `| 구분 | 수 |\n|---|---|\n| 전체 문항(ID) | ${total.q} |\n| 고유 학습 항목 | ${total.items} |\n| 단순 치환 변형(음절 항목) | ${total.sub} |\n| 형식 변형(고유 학습 항목 외 문항) | ${total.q - total.items - total.sub * 3} |\n| 음절 항목에서 나온 문항 | ${total.sub * 3} |`, "");
L.push("## 레벨별", "", "| 레벨 | 고유 학습 항목 | 치환(음절) | 문항 |", "|---|---:|---:|---:|");
for (const l of lv) L.push(`| ${l} | ${rows[l].items} | ${rows[l].sub} | ${rows[l].q} |`);
L.push("", "## 레벨 × 영역(문항 수)", "", `| 레벨 | ${cats.join(" | ")} |`, `|---|${cats.map(() => "---:").join("|")}|`);
for (const l of lv) L.push(`| ${l} | ${cats.map((c) => rows[l].byCat[c] ?? 0).join(" | ")} |`);
L.push("", "## 레벨 × 문항 형식", "", `| 레벨 | ${forms.join(" | ")} |`, `|---|${forms.map(() => "---:").join("|")}|`);
for (const l of lv) L.push(`| ${l} | ${forms.map((f) => rows[l].byForm[f] ?? 0).join(" | ")} |`);
L.push("", "## 스킬별", "", "| 스킬 | 고유 학습 항목 | 치환 | 문항 |", "|---|---:|---:|---:|");
for (const sid of Object.keys(skillRows)) L.push(`| ${sid} | ${skillRows[sid].items} | ${skillRows[sid].sub} | ${skillRows[sid].q} |`);
const md = L.join("\n") + "\n";
const json = JSON.stringify({ total, levels: rows, skills: skillRows }, null, 1) + "\n";
const dir = path.join(root, "docs/learning/korean-bank");
if (check) {
  const same = fs.existsSync(path.join(dir, "allocation.md")) && fs.readFileSync(path.join(dir, "allocation.md"), "utf8") === md;
  if (!same) { console.error("allocation docs are stale: run npx tsx scripts/learn/korean/bank/report.ts"); process.exit(1); }
  console.log("allocation docs are up to date");
} else {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "allocation.md"), md);
  fs.writeFileSync(path.join(dir, "allocation.json"), json);
  console.log(`questions ${total.q}; learning items ${total.items}; substitution ${total.sub}`);
}
