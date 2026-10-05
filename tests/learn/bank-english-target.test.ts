import { describe, expect, it } from "vitest";
import { generate, REGISTRY } from "../../scripts/learn/bank/engine.mjs";
import { READ } from "../../scripts/learn/bank/templates/english-a.mjs";

/**
 * TARGET text (the English document, the English question, the answer options) must never contain Korean or Vietnamese. The localized INSTRUCTION
 * (frame, answer-format note, hints, explanation) is a different layer: it may, and must, be Korean / Vietnamese. Regression for the "(소수 첫째 자리까지)"
 * annotation that used to trail the English question at levels 5-10.
 */
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;
const VI_LETTERS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
type Item = { template: string; question: { prompt: string; type: string; options?: { text: string }[] }; overlay: { prompt: string } };
const FRAME_KO = /^글을 읽고 답하세요\.(?: (\([^)]*\)))? "([\s\S]*)" 질문: ([\s\S]*)$/;
const FRAME_VI = /^Đọc văn bản rồi trả lời\.(?: (\([^)]*\)))? "([\s\S]*)" Câu hỏi: ([\s\S]*)$/;

describe("English target content carries no Korean or Vietnamese", () => {
  it("READ puts the answer-format note into the localized frame before the document, never after the question", () => {
    const p = READ("Doc text.", "How many?", { ko: "(숫자만 쓰세요)", vi: "(chỉ nhập số)" });
    expect(p.ko).toBe('글을 읽고 답하세요. (숫자만 쓰세요) "Doc text." 질문: How many?');
    expect(p.vi).toBe('Đọc văn bản rồi trả lời. (chỉ nhập số) "Doc text." Câu hỏi: How many?');
    expect(READ("D", "Q").ko).toBe('글을 읽고 답하세요. "D" 질문: Q');
  });
  it("every English family, every level it serves, 30 seeds: document, question and options are clean in both layers", () => {
    let checked = 0, framed = 0;
    for (const tmpl of REGISTRY.english as unknown as { id: string; levels: [number, number] }[]) {
      for (let level = tmpl.levels[0]; level <= tmpl.levels[1]; level++) {
        for (let seed = 0; seed < 30; seed++) {
          let items: Item[];
          try { items = (generate({ subject: "english", level, count: 3, seed: `tgt-${seed}`, templates: [tmpl] }) as unknown as { items: Item[] }).items; } catch { continue; }
          for (const it of items) {
            checked++;
            for (const o of it.question.options ?? []) { expect(HANGUL.test(o.text), `${tmpl.id} L${level} option`).toBe(false); expect(VI_LETTERS.test(o.text), `${tmpl.id} L${level} option (vi letters)`).toBe(false); }
            const ko = FRAME_KO.exec(it.question.prompt), vi = FRAME_VI.exec(it.overlay.prompt);
            if (ko) {
              framed++;
              expect(HANGUL.test(ko[2] + ko[3]), `${tmpl.id} L${level} ko target`).toBe(false);
              expect(VI_LETTERS.test(ko[2] + ko[3]), `${tmpl.id} L${level} ko target (vi letters)`).toBe(false);
              expect(vi, `${tmpl.id} L${level} overlay frame`).not.toBeNull();
              expect(vi![2], `${tmpl.id} L${level} same document in both layers`).toBe(ko[2]);
              expect(vi![3], `${tmpl.id} L${level} same question in both layers`).toBe(ko[3]);
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1500);
    expect(framed).toBeGreaterThan(800);
  });
  it("the instruction layer is still localized: the answer-format note is Korean in the Korean prompt and Vietnamese in the overlay", () => {
    let numeric = 0;
    for (let level = 5; level <= 10; level++) for (let seed = 0; seed < 25; seed++) {
      const { items } = generate({ subject: "english", level, count: 4, seed: `note-${seed}` }) as unknown as { items: Item[] };
      for (const it of items) if (it.question.type === "numeric") { numeric++; expect(HANGUL.test(it.question.prompt)).toBe(true); expect(VI_LETTERS.test(it.overlay.prompt)).toBe(true); }
    }
    expect(numeric).toBeGreaterThan(30);
  });
});
