import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv, validate } from "../../scripts/learn/import-locale-review.mjs";

const run = (args: string[]) => { try { return { code: 0, out: execFileSync(process.execPath, ["scripts/learn/import-locale-review.mjs", ...args], { stdio: "pipe" }).toString() }; } catch (e) { const x = e as { status: number; stdout: Buffer }; return { code: x.status, out: x.stdout.toString() }; } };

describe("validate", () => {
  it("keeps placeholders and math, forbids stray Hangul and bidi controls", () => {
    expect(validate("{a}+{b}는 얼마일까요? $x^2$", "What is {b}+{a}? $x^2$")).toEqual([]);
    expect(validate("{a}+{b}", "{a}")[0]).toMatch(/placeholders/);
    expect(validate("$f(x)=2x+1,\\ g(x)=x^2$", "$f(x)=2x+1$ and $g(x)=x^2$")).toEqual([]);
    expect(validate("$x^2$", "$x^3$")[0]).toMatch(/math/);
    expect(validate("한국어", "한국어")[0]).toMatch(/Hangul/);
    expect(validate("How do you read this?", "읽는 법")[0]).toMatch(/Hangul/);
    expect(validate("“아” is read “a”.", "“아” — a", "korean")).toEqual([]);
    expect(validate("x", "a‏b")[0]).toMatch(/bidi/);
    expect(validate("x", "  ")).toEqual(["empty"]);
  });
  it("reads quoted CSV with commas, doubled quotes, newlines and a BOM", () => {
    const rows = parseCsv('﻿a,b,c\r\n1,"x, ""y""","l1\nl2"\r\n,,\r\n');
    expect(rows).toEqual([{ a: "1", b: 'x, "y"', c: "l1\nl2" }]);
  });
});

describe("import (against a temporary root)", () => {
  function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-import-"));
    fs.mkdirSync(path.join(root, "lib/learn/i18n/locales"), { recursive: true });
    fs.mkdirSync(path.join(root, "content/learn-overlays/sg"), { recursive: true });
    fs.writeFileSync(path.join(root, "lib/learn/i18n/locales/sg.json"), JSON.stringify({ "a.key": "old {n}", "b.key": "keep" }, null, 2) + "\n");
    fs.writeFileSync(path.join(root, "content/learn-overlays/sg/math.json"), JSON.stringify({ skills: { "m.s": "s" }, lessons: { l1: { title: "t", concept: "c", example: "e" } }, questions: { q1: { prompt: "p", hints: ["h1", "h2"], explanation: "x", options: { a: "oa" } } } }, null, 2) + "\n");
    return root;
  }
  const head = "canonical,en_reference,translation,reviewed_translation,status,notes";
  it("dry run writes nothing; --apply patches accepted rows and reports the rejected ones", () => {
    const root = fixture();
    const ui = path.join(root, "sg-ui.csv");
    fs.writeFileSync(ui, `key,canonical_ko,en_reference,translation,flags,reviewed_translation,status,notes\r\na.key,{n}개,{n},old {n},,new {n},OK,\r\nb.key,키,k,keep,,bad {x},FIX,\r\n`);
    const content = path.join(root, "sg-content.csv");
    fs.writeFileSync(content, `site,kind,id,field,${head}\r\nmath,lesson,l1,concept,개념,c,c,Concept fixed,OK,\r\nmath,question,q1,hint2,힌트,h,h2,Hint two,OK,\r\nmath,question,q1,option a,보기,o,oa,Option A,OK,\r\nmath,question,q1,prompt,문제 $x$,p,p,Problem $y$,OK,\r\nmath,question,zz,prompt,문제,p,p,Nope,OK,\r\nmath,skill,m.s,title,기술,s,s,,,\r\n`);
    const dry = run([ui, content, "--root", root]);
    expect(dry.out).toMatch(/DRY RUN/);
    expect(JSON.parse(fs.readFileSync(path.join(root, "lib/learn/i18n/locales/sg.json"), "utf8"))["a.key"]).toBe("old {n}");
    const applied = run([ui, content, "--root", root, "--apply"]);
    expect(applied.code).toBe(1); // rejected rows make the exit code non-zero
    expect(applied.out).toMatch(/4 accepted, 3 rejected, 1 skipped/);
    expect(JSON.parse(fs.readFileSync(path.join(root, "lib/learn/i18n/locales/sg.json"), "utf8"))).toEqual({ "a.key": "new {n}", "b.key": "keep" });
    const o = JSON.parse(fs.readFileSync(path.join(root, "content/learn-overlays/sg/math.json"), "utf8"));
    expect(o.lessons.l1.concept).toBe("Concept fixed");
    expect(o.questions.q1).toEqual({ prompt: "p", hints: ["h1", "Hint two"], explanation: "x", options: { a: "Option A" } });
  });
});
