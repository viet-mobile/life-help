import { describe, expect, it } from "vitest";
import { localizeEnglishBankQuestion } from "@/lib/learn/content/english-bank";
import type { Question } from "@/lib/learn/types";

const kit = { templates: {}, texts: { "t:rdm:expl:quote": "“{quote}”" } as Record<string, string> };
const base = { id: "eb-x-q1", site: "english", skillId: "e.e1.read", type: "multiple_choice", difficulty: 1, hints: ["문제가 무엇을 묻는지 한 문장으로 말해 본 뒤 보기를 보세요.", "h2"], explanation: "“Momo sleeps.”", role: "core", tags: ["english", "bank", "rq", "r"], expectedSeconds: 30, status: "DRAFT", options: [{ id: "a", text: "Yes" }, { id: "b", text: "No" }], answer: { kind: "choice", id: "a" } } as unknown as Question;

describe("English bank completeness gate: reasons are recorded, nothing is served half-localized", () => {
  it("records WHY a question is not served (audit: scripts/learn/english-bank/audit-served.ts)", () => {
    const t: { reason?: string } = {};
    expect(localizeEnglishBankQuestion({ ...base, prompt: "한글 질문?" } as Question, kit, "th", t)).toBeNull();
    expect(t.reason).toBeTruthy();
    const none: { reason?: string } = {};
    expect(localizeEnglishBankQuestion(base, null, "th", none)).toBeNull();
    expect(none.reason).toBe("no-kit");
  });
  it("a Korean stem or option in a reading/dialogue/mixed question is never served", () => {
    const t: { reason?: string } = {};
    const q = { ...base, prompt: "Where does Momo sleep?", options: [{ id: "a", text: "침대" }, { id: "b", text: "No" }] } as Question;
    expect(localizeEnglishBankQuestion(q, kit, "th", t)).toBeNull();
  });
  it("the audit file states how many served r/d/m questions still carry an English stem (not a fully localized instruction)", async () => {
    const audit = JSON.parse((await import("node:fs")).readFileSync("docs/learn/english-bank-served-audit.json", "utf8"));
    expect(typeof audit.englishStemPassthroughServed).toBe("number");
    expect(audit.servedIdenticalAcrossLocales).toBe(true);
    expect(Object.values(audit.reasonsFirstLocale as Record<string, number>).reduce((a, b) => a + b, 0) + audit.duplicatesFirstLocale).toBe(audit.unservedPerLocale);
  });
});
