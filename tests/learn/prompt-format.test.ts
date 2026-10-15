import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatPrompt } from "@/lib/learn/promptFormat";
import { LOCALES } from "@/lib/learn/i18n";
import elementary from "@/lib/learn/content/elementary/english.json";
import secondary from "@/lib/learn/content/secondary/english.json";

const root = path.resolve(__dirname, "../..");
type Q = { id: string; prompt: string };
const canonicalReading = [...elementary.questions, ...secondary.questions].filter((q: Q) => q.prompt.includes("질문:") || q.prompt.includes("문장:"));

describe("reading prompt: the question label starts on its own line, in every language", () => {
  it("splits the canonical Korean prompt", () => {
    expect(formatPrompt('글을 읽고 답하세요. "Mina has a cat. The cat is white." 질문: What color is the cat?')).toBe(
      '글을 읽고 답하세요. "Mina has a cat. The cat is white."\n\n질문: What color is the cat?',
    );
  });
  it("leaves prompts without a passage label, and prompts that already have a line break, unchanged", () => {
    for (const p of ["What is 3+4?", "빈칸에 알맞은 말은? I have ___ sister.", 'A\n\n"x" Q: y', '"She said: hi" is a greeting']) expect(formatPrompt(p)).toBe(p);
  });
  it("a colon inside the passage does not move the break", () => {
    const p = 'Read. "Tom said: go home now. He left." Question: Who left?';
    expect(formatPrompt(p)).toBe('Read. "Tom said: go home now. He left."\n\nQuestion: Who left?');
  });
  it("every reading question of the course gets a break in the canonical language and in every learner language that has an overlay", () => {
    expect(canonicalReading.length).toBeGreaterThanOrEqual(130);
    let checked = 0;
    for (const q of canonicalReading) expect(formatPrompt(q.prompt), q.id).toContain('\n\n');
    for (const loc of LOCALES) {
      for (const f of [`content/learn-overlays/${loc}/english.json`, `lib/learn/content/${loc}/english.json`, `lib/learn/content/${loc}/secondary-english.json`]) {
        const file = path.join(root, f);
        if (!fs.existsSync(file)) continue;
        const ov = JSON.parse(fs.readFileSync(file, "utf8")).questions as Record<string, { prompt?: string }>;
        for (const q of canonicalReading) {
          const t = ov?.[q.id]?.prompt;
          if (!t) continue;
          checked++;
          const out = formatPrompt(t);
          expect(out, `${loc} ${q.id}: ${t.slice(0, 120)}`).toMatch(/["”»」』]\n\n\S/);
          expect(out.replace(/\s+/g, " "), `${loc} ${q.id} text is unchanged apart from the break`).toBe(t.replace(/\s+/g, " "));
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });
});
