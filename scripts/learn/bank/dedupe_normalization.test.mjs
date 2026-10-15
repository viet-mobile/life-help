import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePrompt,
  normalizeOption,
  computeNormalizedDedupeKey,
  auditQuestions,
} from "./audit_english_bank.mjs";

test("dedupe normalization strips question numbers like (문항 #1) and whitespace", () => {
  const p1 = "문장의 빈칸에 들어갈 알맞은 단어는? (문항 #1) He runs fast.";
  const p2 = "문장의 빈칸에 들어갈 알맞은 단어는? (문항 #42)   He runs fast.  ";
  const p3 = "문장의 빈칸에 들어갈 알맞은 단어는? [문항 #99] He runs fast.";
  const p4 = "문장의 빈칸에 들어갈 알맞은 단어는? #12 He runs fast.";

  assert.equal(normalizePrompt(p1), normalizePrompt(p2));
  assert.equal(normalizePrompt(p1), normalizePrompt(p3));
  assert.equal(normalizePrompt(p1), normalizePrompt(p4));
  assert.equal(normalizePrompt(p1), "문장의 빈칸에 들어갈 알맞은 단어는? He runs fast.");
});

test("dedupe normalization normalizes escapes and whitespace in options", () => {
  const o1 = "nevertheless\\n";
  const o2 = "nevertheless\n";
  const o3 = "  nevertheless  ";
  assert.equal(normalizeOption(o1), "nevertheless");
  assert.equal(normalizeOption(o2), "nevertheless");
  assert.equal(normalizeOption(o3), "nevertheless");
});

test("regression test: rejects questions that differ only by question number in prompt", () => {
  const q1 = {
    id: "bk-en-m1-sample-001",
    skillId: "e.vocab",
    prompt: "다음 영영 설명에 해당하는 알맞은 단어는? (문항 #1) to protect nature",
    options: [
      { id: "a", text: "protect" },
      { id: "b", text: "destroy" },
      { id: "c", text: "ignore" },
      { id: "d", text: "waste" },
    ],
    answer: { kind: "choice", id: "a" },
    hints: ["Think about shielding from harm.", "It starts with p."],
    explanation: "'protect' means to shield from harm.",
  };

  const q2 = {
    id: "bk-en-m1-sample-002",
    skillId: "e.vocab",
    prompt: "다음 영영 설명에 해당하는 알맞은 단어는? (문항 #2) to protect nature", // only number differs!
    options: [
      { id: "a", text: "protect" },
      { id: "b", text: "destroy" },
      { id: "c", text: "ignore" },
      { id: "d", text: "waste" },
    ],
    answer: { kind: "choice", id: "a" },
    hints: ["Think about shielding from harm.", "It starts with p."],
    explanation: "'protect' means to shield from harm.",
  };

  const key1 = computeNormalizedDedupeKey(q1);
  const key2 = computeNormalizedDedupeKey(q2);
  assert.equal(key1, key2, "Normalized keys must match when only question numbering differs");

  const auditResult = auditQuestions([q1, q2], "Duplicate Test");
  assert.equal(auditResult.duplicates, 1, "Audit must flag the second item as a duplicate");
  assert.equal(auditResult.hasFailure, true, "Audit must fail when items differ only by number tags");
});

test("dedupe normalization accepts genuinely distinct questions", () => {
  const q1 = {
    id: "bk-en-m1-sample-001",
    skillId: "e.vocab",
    prompt: "What is the opposite of 'generous'?",
    options: [
      { id: "a", text: "selfish" },
      { id: "b", text: "kind" },
      { id: "c", text: "friendly" },
      { id: "d", text: "patient" },
    ],
    answer: { kind: "choice", id: "a" },
    hints: ["Think about sharing.", "Not willing to share."],
    explanation: "Selfish is the antonym of generous.",
  };

  const q2 = {
    id: "bk-en-m1-sample-002",
    skillId: "e.vocab",
    prompt: "What is the synonym of 'ancient'?",
    options: [
      { id: "a", text: "very old" },
      { id: "b", text: "futuristic" },
      { id: "c", text: "modern" },
      { id: "d", text: "new" },
    ],
    answer: { kind: "choice", id: "a" },
    hints: ["Relating to history.", "Existing for centuries."],
    explanation: "Ancient means very old.",
  };

  const auditResult = auditQuestions([q1, q2], "Distinct Test");
  assert.equal(auditResult.duplicates, 0);
  assert.equal(auditResult.hasFailure, false);
});
