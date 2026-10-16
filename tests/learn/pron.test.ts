import { describe, expect, it } from "vitest";
import { EXPERT_REVIEW_REQUIRED, pronTipFor, pronTipsVisible } from "@/lib/learn/pron";

describe("pronunciation rule tips", () => {
  it.each([
    ["국물", "nasal"], ["밥물", "nasal"], ["신라", "lateral"], ["칼날", "lateral"], ["국밥", "tense"], ["옷이", "liaison"], ["깎아", "liaison"], ["부엌", "final"], ["의견란", null], ["생산량", null], ["겉옷", null], ["맛있다", null], ["값이", null], ["안녕하세요", null], ["물", null],
  ])("%s -> %s", (t, rule) => expect(pronTipFor(t)?.rule ?? null).toBe(rule));
  it("no tip for empty text or long passages", () => {
    expect(pronTipFor("")).toBeNull();
    expect(pronTipFor(undefined)).toBeNull();
    expect(pronTipFor("국물이 맛있어서 밥을 많이 먹었어요 그리고 신라 이야기를 읽었어요")).toBeNull();
  });
  it("every tip carries an article number and an official example", () => {
    const t = pronTipFor("국물")!;
    expect(t.art).toBe("18");
    expect(t.ex).toContain("궁물");
    expect(pronTipFor("꽃")!.ex).toContain("옫");
  });
});

describe("release gate", () => {
  it("tips stay hidden until a Korean pronunciation expert has reviewed them; only an explicit preview flag shows them", () => {
    expect(EXPERT_REVIEW_REQUIRED).toBe(true);
    delete process.env.NEXT_PUBLIC_PRON_PREVIEW;
    expect(pronTipsVisible()).toBe(false);
    process.env.NEXT_PUBLIC_PRON_PREVIEW = "1";
    expect(pronTipsVisible()).toBe(true);
    delete process.env.NEXT_PUBLIC_PRON_PREVIEW;
  });
});
