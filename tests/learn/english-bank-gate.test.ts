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
  it("the audit file: no question is served with an English instruction, every language serves at least the verified baseline, and the reasons add up", async () => {
    const audit = JSON.parse((await import("node:fs")).readFileSync("docs/learn/english-bank-served-audit.json", "utf8"));
    expect(audit.englishStemPassthroughServed).toBe(0);
    const counts = Object.values(audit.servedPerLocale as Record<string, number>);
    expect(counts.length).toBe(46);
    for (const c of counts) expect(c).toBeGreaterThanOrEqual(6895); // never below the first verified result (ratchet; raise it as keys are added)
    // languages may differ slightly (a translation that makes two options identical removes only that question in that language)
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThan(60);
    expect(Object.values(audit.reasonsFirstLocale as Record<string, number>).reduce((a, b) => a + b, 0) + audit.duplicatesFirstLocale).toBe(audit.generatedFrom.bankQuestions - (audit.servedPerLocale[Object.keys(audit.servedPerLocale)[0]] as number));
  });
});

describe("Korean-mixed reading / mixed questions: stable per-question keys, nothing served half-localized", () => {
  const texts = (extra: Record<string, string> = {}) => ({ templates: {}, texts: { "t:rdm:expl:quote": "“{quote}”", "t:rdm:expl:speaker": "{speaker}: “{quote}”", "t:rdm:h1:ask": "ask first", ...extra } as Record<string, string> });
  const passage = "Ben has a cat. The cat is white.";
  const mk = (over: Partial<Question> = {}) => ({ ...base, id: "eb-k1-q1", prompt: `${passage}\n\n고양이는 무슨 색일까요?`, hints: ["질문이 무엇을 묻는지 먼저 한 문장으로 말해 보세요.", "h2"], explanation: "“The cat is white.”", options: [{ id: "a", text: "white" }, { id: "b", text: "black" }], ...over } as Question);
  it("a Korean question is served only with its q: key; the English passage and English options stay byte-for-byte; ids and answer key are unchanged", () => {
    const miss: { reason?: string } = {};
    expect(localizeEnglishBankQuestion(mk(), texts(), "th", miss)).toBeNull();
    expect(miss.reason).toBe("rdm-question-untranslated");
    const q = localizeEnglishBankQuestion(mk(), texts({ "q:eb-k1-q1": "แมวสีอะไร?" }), "th")!;
    expect(q.prompt).toBe(`${passage}\n\nแมวสีอะไร?`);
    expect(q.options).toEqual([{ id: "a", text: "white" }, { id: "b", text: "black" }]);
    expect((q as unknown as { answer: unknown }).answer).toEqual({ kind: "choice", id: "a" });
    expect(q.hints[1]).toBe("💭"); // hints after the first stay hidden
  });
  it("a Korean option needs its own o: key; an untranslated one excludes the question", () => {
    const withKo = mk({ options: [{ id: "a", text: "하얀색" }, { id: "b", text: "black" }] } as Partial<Question>);
    const t: { reason?: string } = {};
    expect(localizeEnglishBankQuestion(withKo, texts({ "q:eb-k1-q1": "แมวสีอะไร?" }), "th", t)).toBeNull();
    expect(t.reason).toBe("rdm-option-untranslated");
    const ok = localizeEnglishBankQuestion(withKo, texts({ "q:eb-k1-q1": "แมวสีอะไร?", "o:eb-k1-q1:a": "สีขาว" }), "th")!;
    expect(ok.options!.map((o) => o.id)).toEqual(["a", "b"]);
    expect(ok.options![0].text).toBe("สีขาว");
    expect(ok.options![1].text).toBe("black");
  });
  it("Korean inside the passage itself is never served; a Hangul leak in any key excludes the question", () => {
    const t: { reason?: string } = {};
    expect(localizeEnglishBankQuestion(mk({ prompt: "벤은 고양이가 있어요.\n\n고양이는 무슨 색일까요?" } as Partial<Question>), texts({ "q:eb-k1-q1": "x?" }), "th", t)).toBeNull();
    expect(t.reason).toBe("rdm-korean-in-passage");
    expect(localizeEnglishBankQuestion(mk(), texts({ "q:eb-k1-q1": "แมวสี 무슨?" }), "th")).toBeNull();
  });
  it("an individual hint-1 key (h:<id>) replaces a missing pattern template, and a Korean hint is never served", () => {
    const odd = mk({ hints: ["이 문제만을 위한 힌트예요.", "h2"] } as Partial<Question>);
    const t: { reason?: string } = {};
    expect(localizeEnglishBankQuestion(odd, texts({ "q:eb-k1-q1": "แมวสีอะไร?" }), "th", t)).toBeNull();
    expect(t.reason).toBe("hint1-template-missing");
    const ok = localizeEnglishBankQuestion(odd, texts({ "q:eb-k1-q1": "แมวสีอะไร?", "h:eb-k1-q1": "ดูประโยคที่สอง" }), "th")!;
    expect(ok.hints[0]).toBe("ดูประโยคที่สอง");
  });
  it("a mixed (m) question uses the whole prompt as the question part", () => {
    const m = { ...base, id: "eb-m1-m", tags: ["english", "bank", "m", "m"], prompt: "시계의 짧은바늘은 9, 긴바늘은 6을 가리켜요. 지금 몇 시일까요?", hints: ["질문이 무엇을 묻는지 먼저 한 문장으로 말해 보세요.", "h2"], explanation: "“nine thirty”", options: [{ id: "a", text: "nine thirty" }, { id: "b", text: "six nine" }] } as unknown as Question;
    const q = localizeEnglishBankQuestion(m, texts({ "q:eb-m1-m": "เข็มสั้นชี้เลข 9 เข็มยาวชี้เลข 6 ตอนนี้กี่โมง?" }), "th")!;
    expect(q.prompt).toBe("เข็มสั้นชี้เลข 9 เข็มยาวชี้เลข 6 ตอนนี้กี่โมง?");
  });
});
