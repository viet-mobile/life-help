import { describe, expect, it } from "vitest";
import demo from "@/lib/learn/content/demo/english.json";
import elementary from "@/lib/learn/content/elementary/english.json";
import secondary from "@/lib/learn/content/secondary/english.json";
import { buildQueue, clampRepeat, hasMeaning, MAX_REPEAT, parseCustomRepeat } from "@/lib/learn/listen/queue";
import { exampleSegments, exampleWords, meaningLang, passageSegments, splitSentences, type ListenSegment } from "@/lib/learn/listen/segments";
import { ListenPlayer, pickVoice, type SpeechEngine } from "@/lib/learn/listen/speech";
import { addWord, filterWords, hasWord, removeWord, shuffled, stepIndex, wordId, loadWords, saveWords } from "@/lib/learn/listen/vocab";

/** A scripted engine: records every utterance and lets the test finish them one by one. No audio, no browser. */
class MockEngine implements SpeechEngine {
  spoken: { text: string; lang: string; rate: number }[] = [];
  pending: ((error: boolean) => void)[] = [];
  cancels = 0;
  available = true;
  isAvailable() { return this.available; }
  supportsPause() { return true; }
  speak(u: { text: string; lang: string; rate: number }, done: (e: boolean) => void) { this.spoken.push(u); this.pending.push(done); }
  cancel() { this.cancels++; this.pending = []; }
  pause() {}
  resume() {}
  /** finish the current utterance */
  next(error = false) { const d = this.pending.shift(); d?.(error); }
  drain() { while (this.pending.length) this.next(); }
}
const seg = (n: number, ko = false): ListenSegment[] => Array.from({ length: n }, (_, i) => ({ id: `s:${i}`, en: `EN${i + 1}`, ...(ko ? { ko: `KO${i + 1}` } : {}) }));
const texts = (q: { text: string }[]) => q.map((u) => u.text);

describe("splitSentences", () => {
  it("never cuts inside a word, an abbreviation or a number", () => {
    expect(splitSentences("Mina has a cat. The cat is white.")).toEqual(["Mina has a cat.", "The cat is white."]);
    expect(splitSentences("Dr. Kim lives in Seoul. It costs 3.5 dollars! Really?")).toEqual(["Dr. Kim lives in Seoul.", "It costs 3.5 dollars!", "Really?"]);
    expect(splitSentences("I like e.g. apples and pears.")).toEqual(["I like e.g. apples and pears."]);
  });
});

describe("segments come from canonical lesson content", () => {
  it("example text: English items are spoken, answers of arrows are not, a '=' meaning is kept as the canonical pair", () => {
    expect(exampleSegments("x", "ball → B, cat → C, dog → D").map((s) => s.en)).toEqual(["ball", "cat", "dog"]);
    expect(exampleSegments("x", "big ≈ large, happy ↔ sad").map((s) => s.en)).toEqual(["big", "large", "happy", "sad"]);
    expect(exampleSegments("x", "library = 도서관 / desk = 책상 / milk = 우유").map((s) => [s.en, s.ko])).toEqual([["library", "도서관"], ["desk", "책상"], ["milk", "우유"]]);
    expect(exampleSegments("x", "I have lived here for five years.").map((s) => s.en)).toEqual(["I have lived here for five years."]);
    expect(exampleSegments("x", "Mina has a cat. → 고양이").map((s) => [s.en, s.ko])).toEqual([["Mina has a cat.", undefined]]); // the arrow's right side is an answer, not a translation
    expect(exampleSegments("x", "un-, im- = 아닌")).toEqual([]); // prefixes are not speakable
    expect(exampleSegments("x", "three = 3, red = 빨강").map((s) => [s.en, s.ko])).toEqual([["three", undefined], ["red", "빨강"]]);
  });
  it("reading prompt: the quoted English passage is split into sentences; prompts without a passage give none", () => {
    expect(passageSegments("q", '글을 읽고 답하세요. "Mina has a cat. The cat is white." 질문: What color is the cat?')?.map((s) => s.en)).toEqual(["Mina has a cat.", "The cat is white."]);
    expect(passageSegments("q", "다음 중 B로 시작하는 단어는?")).toBeNull();
    expect(passageSegments("q", '글을 읽고 답하세요. "한국어 문장입니다 정말로" 질문: ?')).toBeNull();
  });
  it("real content: every reading question prompt yields at least one segment and no segment contains Hangul", () => {
    const qs = [...demo.questions, ...elementary.questions, ...secondary.questions] as { id: string; prompt: string; skillId: string }[];
    const withPassage = qs.filter((q) => passageSegments("q", q.prompt));
    expect(withPassage.length).toBeGreaterThan(100);
    for (const q of withPassage) for (const s of passageSegments("q", q.prompt)!) expect(s.en, q.id).not.toMatch(/[가-힯]/);
  });
  it("real content: canonical pairs exist only where the lesson text has 'english = meaning'; no translation is generated", () => {
    const lessons = [demo, elementary, secondary].flatMap((b) => (b.catalog as { courses: { units: { lessons: { id: string; example: string }[] }[] }[] }).courses.flatMap((c) => c.units.flatMap((u) => u.lessons)));
    const withPairs = lessons.filter((l) => exampleWords(l.example).length > 0).map((l) => l.id);
    expect(withPairs).toEqual(expect.arrayContaining(["en-l1", "en-m2-l5", "en-h1-l4"]));
    for (const l of lessons) for (const s of exampleSegments(l.id, l.example)) if (s.ko) expect(l.example, `${l.id}:${s.en}`).toContain(s.ko);
  });
  it("the meaning's voice language comes from the text: Hangul -> ko-KR; a Vietnamese UI -> vi-VN; otherwise none", () => {
    expect(meaningLang("도서관", "ko")).toBe("ko-KR");
    expect(meaningLang("thư viện", "vi")).toBe("vi-VN");
    expect(meaningLang("library", "ko")).toBeNull();
  });
});

describe("buildQueue: modes, ranges and repeat", () => {
  it("English only: EN1 EN2 (no Korean even when a meaning exists)", () => {
    expect(texts(buildQueue(seg(2, true), { mode: "en" }))).toEqual(["EN1", "EN2"]);
  });
  it("English + Korean: EN1 KO1 EN2 KO2, each in its own utterance with its own language", () => {
    const q = buildQueue(seg(2, true), { mode: "en+ko" });
    expect(texts(q)).toEqual(["EN1", "KO1", "EN2", "KO2"]);
    expect(q.map((u) => u.lang)).toEqual(["en-US", "ko-KR", "en-US", "ko-KR"]);
  });
  it("English + Korean skips a Korean item for a segment that has no canonical meaning (nothing is invented)", () => {
    const s = seg(3, true); delete s[1].ko;
    expect(texts(buildQueue(s, { mode: "en+ko" }))).toEqual(["EN1", "KO1", "EN2", "EN3", "KO3"]);
    expect(hasMeaning(seg(3))).toBe(false);
    expect(texts(buildQueue(seg(3), { mode: "en+ko" }))).toEqual(["EN1", "EN2", "EN3"]);
  });
  it("range 2..4 x 3 plays exactly 2 3 4 2 3 4 2 3 4", () => {
    expect(texts(buildQueue(seg(5), { mode: "en", from: 1, to: 3, repeat: 3 }))).toEqual(["EN2", "EN3", "EN4", "EN2", "EN3", "EN4", "EN2", "EN3", "EN4"]);
  });
  it("count 1 and count 5; the end is never before the start; out-of-range indexes are clamped", () => {
    expect(buildQueue(seg(5), { mode: "en", from: 1, to: 3, repeat: 1 })).toHaveLength(3);
    expect(buildQueue(seg(5), { mode: "en", from: 1, to: 3, repeat: 5 })).toHaveLength(15);
    expect(texts(buildQueue(seg(5), { mode: "en", from: 3, to: 1 }))).toEqual(["EN4"]);
    expect(texts(buildQueue(seg(3), { mode: "en", from: -4, to: 99 }))).toEqual(["EN1", "EN2", "EN3"]);
    expect(buildQueue([], { mode: "en" })).toEqual([]);
  });
  it("repeat is bounded and the custom count is strict: no infinite or absurd repeat", () => {
    expect(clampRepeat(0)).toBe(1); expect(clampRepeat(-3)).toBe(1); expect(clampRepeat(NaN)).toBe(1); expect(clampRepeat(3.9)).toBe(3);
    expect(clampRepeat(1e9)).toBe(MAX_REPEAT); expect(clampRepeat(Infinity)).toBe(1);
    expect(buildQueue(seg(1), { mode: "en", repeat: 999 })).toHaveLength(MAX_REPEAT);
    for (const ok of ["1", "7", "20"]) expect(parseCustomRepeat(ok)).toBe(Number(ok));
    for (const bad of ["", "0", "-1", "21", "1.5", "1e3", "abc", " ", "００７", "100000"]) expect(parseCustomRepeat(bad), bad).toBeNull();
  });
});

describe("ListenPlayer: one voice at a time, cancel, stop", () => {
  it("plays the queue strictly in order, one utterance after another, at the chosen rate, with the right language", () => {
    const e = new MockEngine(); const p = new ListenPlayer(e);
    p.play(buildQueue(seg(2, true), { mode: "en+ko" }), 0.75);
    expect(e.spoken).toHaveLength(1);
    expect(p.state).toMatchObject({ status: "playing", segmentId: "s:0" });
    e.next(); e.next(); e.next();
    expect(e.spoken.map((u) => [u.text, u.lang, u.rate])).toEqual([["EN1", "en-US", 0.75], ["KO1", "ko-KR", 0.75], ["EN2", "en-US", 0.75], ["KO2", "ko-KR", 0.75]]);
    expect(e.pending).toHaveLength(1); // exactly one utterance in flight: never two voices at once
    expect(p.state.segmentId).toBe("s:1");
    e.next();
    expect(p.state).toMatchObject({ status: "idle", segmentId: null });
  });
  it("a new playback cancels the previous queue first; the stale callbacks of the old session do nothing", () => {
    const e = new MockEngine(); const p = new ListenPlayer(e);
    p.play(buildQueue(seg(3), { mode: "en" }));
    const stale = e.pending[0];
    p.play(buildQueue(seg(3), { mode: "en", from: 2, to: 2 }));
    expect(e.cancels).toBeGreaterThanOrEqual(2);
    stale(false); // the old session's utterance ends late: ignored
    expect(e.spoken.map((u) => u.text)).toEqual(["EN1", "EN3"]);
    expect(e.pending).toHaveLength(1);
  });
  it("stop clears the queue immediately and nothing speaks afterwards", () => {
    const e = new MockEngine(); const p = new ListenPlayer(e);
    p.play(buildQueue(seg(5), { mode: "en", repeat: 5 }));
    p.stop();
    expect(p.state.status).toBe("idle");
    expect(e.pending).toEqual([]);
    expect(e.spoken).toHaveLength(1);
  });
  it("an engine error ends the session without a crash and is reported; a cancel is not an error", () => {
    const e = new MockEngine(); const p = new ListenPlayer(e);
    p.play(buildQueue(seg(3), { mode: "en" }));
    e.next(true);
    expect(p.state).toMatchObject({ status: "idle", error: true });
    expect(e.spoken).toHaveLength(1);
  });
  it("without speech support nothing is spoken and nothing throws", () => {
    const e = new MockEngine(); e.available = false; const p = new ListenPlayer(e);
    expect(p.isAvailable()).toBe(false);
    p.play(buildQueue(seg(2), { mode: "en" }));
    expect(e.spoken).toEqual([]);
    expect(p.state.status).toBe("idle");
  });
  it("pause / resume change the state only while playing", () => {
    const e = new MockEngine(); const p = new ListenPlayer(e);
    p.pause(); expect(p.state.status).toBe("idle");
    p.play(buildQueue(seg(2), { mode: "en" }));
    p.pause(); expect(p.state.status).toBe("paused");
    p.resume(); expect(p.state.status).toBe("playing");
  });
});

describe("pickVoice", () => {
  const v = [{ lang: "en-GB" }, { lang: "ko-KR" }, { lang: "en-US", default: true }, { lang: "en_US" }];
  it("prefers the exact language, then the same primary language; no voice means the browser default", () => {
    expect(pickVoice(v, "en-US")).toEqual({ lang: "en-US", default: true });
    expect(pickVoice(v, "ko-KR")).toEqual({ lang: "ko-KR" });
    expect(pickVoice([{ lang: "en-GB" }], "en-US")).toEqual({ lang: "en-GB" });
    expect(pickVoice([{ lang: "fr-FR" }], "ko-KR")).toBeNull();
    expect(pickVoice([], "en-US")).toBeNull();
  });
});

describe("saved words and the flashcard deck", () => {
  it("saves once: the same normalized English text is never duplicated, a duplicate may only fill a missing meaning", () => {
    let list = addWord([], { en: "Library", ko: undefined, lessonId: "l1" });
    expect(list.added).toBe(true);
    const again = addWord(list.list, { en: "  library ", ko: "도서관", lessonId: "l2" });
    expect(again.added).toBe(false);
    expect(again.list).toHaveLength(1);
    expect(again.list[0].ko).toBe("도서관");
    expect(hasWord(again.list, "LIBRARY")).toBe(true);
    list = addWord(again.list, { en: "a lot", lessonId: "l1" });
    expect(addWord(list.list, { en: "a lot of", lessonId: "l1" }).added).toBe(true); // distinct phrases stay distinct
    expect(wordId("  A   Lot ")).toBe("a lot");
    expect(addWord([], { en: "   ", lessonId: "l" }).added).toBe(false);
  });
  it("removes a word; filters by lesson", () => {
    let l = addWord([], { en: "desk", lessonId: "a" }).list; l = addWord(l, { en: "milk", lessonId: "b" }).list;
    expect(filterWords(l, { kind: "all" })).toHaveLength(2);
    expect(filterWords(l, { kind: "lesson", lessonId: "b" }).map((w) => w.en)).toEqual(["milk"]);
    expect(removeWord(l, wordId("desk")).map((w) => w.en)).toEqual(["milk"]);
  });
  it("previous / next wrap around, an empty deck stays at 0, shuffle is deterministic and a permutation", () => {
    expect(stepIndex(0, 1, 3)).toBe(1); expect(stepIndex(2, 1, 3)).toBe(0); expect(stepIndex(0, -1, 3)).toBe(2); expect(stepIndex(0, 1, 0)).toBe(0);
    const a = [1, 2, 3, 4, 5, 6];
    expect(shuffled(a, 7)).toEqual(shuffled(a, 7));
    expect([...shuffled(a, 7)].sort()).toEqual(a);
    expect(a).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("persistence is device-local: round trip, and broken or blocked storage never throws", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } };
    const list = addWord([], { en: "desk", ko: "책상", lessonId: "l" }).list;
    saveWords(storage, "k", "english", "device", list);
    expect(loadWords(storage, "k", "english", "device")).toEqual(list);
    expect(loadWords(storage, "k", "math", "device")).toEqual([]);
    store.set("k:words:english:device", "{not json");
    expect(loadWords(storage, "k", "english", "device")).toEqual([]);
    expect(loadWords(null, "k", "english", "device")).toEqual([]);
    expect(() => saveWords({ getItem: () => null, setItem: () => { throw new Error("full"); } }, "k", "english", "device", list)).not.toThrow();
  });
});
