import { describe, expect, it } from "vitest";
import {
  OFFER_EVERY, RECENT_WINDOW, chooseLater, chooseNow, chooseTask, emptyLedger, flowView, noTaskAvailable, parseLedger, recordCompleted, startOffer, taskCompleted,
  type Candidate, type FlowLedger,
} from "@/lib/think/flow";

const run = (l: FlowLedger, ids: string[]) => ids.reduce((acc, id) => recordCompleted(acc.ledger, id), { ledger: l, counted: false, reached: false });
const q = (n: number) => Array.from({ length: n }, (_, i) => `q${i + 1}`);
const cands = (n: number, topics = 3): Candidate[] => Array.from({ length: n }, (_, i) => ({ id: `t${String(i).padStart(2, "0")}`, topic: `topic${i % topics}`, status: i % 5 === 0 ? "reviewed-ai" : "draft" }));

describe("10 regular questions -> 1 thinking challenge", () => {
  it("nine completed questions never reach the offer; the tenth does", () => {
    expect(run(emptyLedger(), q(9)).reached).toBe(false);
    expect(run(emptyLedger(), q(OFFER_EVERY)).reached).toBe(true);
  });
  it("a repeated question id, a retry or a double submit does not add to the count", () => {
    let r = run(emptyLedger(), q(9));
    for (let i = 0; i < 5; i++) { const again = recordCompleted(r.ledger, "q3"); expect(again.counted).toBe(false); r = { ...again, ledger: again.ledger }; }
    expect(r.ledger.done).toHaveLength(9);
    expect(recordCompleted(r.ledger, "q3").reached).toBe(false);
    expect(recordCompleted(r.ledger, "q10").reached).toBe(true);
  });
  it("an empty question id never counts", () => {
    expect(recordCompleted(emptyLedger(), "").counted).toBe(false);
  });
  it("offering restarts the count, so a reload or another completion cannot offer a second challenge at once", () => {
    const reached = run(emptyLedger(), q(10)).ledger;
    const offered = startOffer(reached, "t01");
    expect(offered.pending).toBe("t01");
    expect(offered.done).toEqual([]);
    expect(recordCompleted(offered, "q11").reached).toBe(false);
    // while an offer is open, finishing ten more questions does not stack a second offer
    expect(run(offered, Array.from({ length: 12 }, (_, i) => `p${i}`)).reached).toBe(false);
  });
  it("later keeps the task owed and offers it again first; now consumes the offer; completing clears it", () => {
    const l0 = startOffer(run(emptyLedger(), q(10)).ledger, "t01");
    const later = chooseLater(l0);
    expect(later.pending).toBeNull();
    expect(later.deferred).toEqual(["t01"]);
    expect(flowView(later)).toEqual({ toNext: OFFER_EVERY, owed: 1 });
    expect(chooseTask(cands(30), later, new Set())).toBe("t01");
    const now = chooseNow(l0);
    expect(now.pending).toBeNull();
    expect(now.deferred).toEqual([]);
    expect(taskCompleted(later, "t01").deferred).toEqual([]);
  });
  it("a task already tried is never offered, not even if it was deferred", () => {
    const l = chooseLater(startOffer(emptyLedger(), "t01"));
    expect(chooseTask(cands(30), l, new Set(["t01"]))).not.toBe("t01");
  });
  it("the most recently offered tasks are not offered again", () => {
    let l = emptyLedger();
    const c = cands(40);
    const seen: string[] = [];
    for (let i = 0; i < RECENT_WINDOW + 5; i++) {
      const id = chooseTask(c, l, new Set())!;
      expect(id).toBeTruthy();
      expect(seen.slice(-RECENT_WINDOW)).not.toContain(id);
      seen.push(id);
      l = startOffer(l, id);
    }
  });
  it("nothing is offered when no task is ready; the count restarts and regular learning continues", () => {
    expect(chooseTask([], emptyLedger(), new Set())).toBeNull();
    expect(chooseTask(cands(3), emptyLedger(), new Set(["t00", "t01", "t02"]))).toBeNull();
    const reached = run(emptyLedger(), q(10)).ledger;
    expect(noTaskAvailable(reached).done).toEqual([]);
    expect(noTaskAvailable(reached).pending).toBeNull();
  });
  it("prefers blind-reviewed tasks and avoids repeating the previous topic", () => {
    const c: Candidate[] = [{ id: "a", topic: "x", status: "draft" }, { id: "b", topic: "y", status: "reviewed-ai" }, { id: "c", topic: "x", status: "reviewed-ai" }];
    expect(chooseTask(c, emptyLedger(), new Set())).toBe("b");
    const l = startOffer(emptyLedger(), "b");
    expect(chooseTask(c, l, new Set())).toBe("c");
  });
  it("storage is parsed defensively and survives a round trip", () => {
    expect(parseLedger("not json")).toEqual(emptyLedger());
    expect(parseLedger({ v: 2 })).toEqual(emptyLedger());
    expect(parseLedger(null)).toEqual(emptyLedger());
    const l = chooseLater(startOffer(run(emptyLedger(), q(3)).ledger, "t05"));
    expect(parseLedger(JSON.stringify(l))).toEqual(l);
    expect(parseLedger({ v: 1, done: ["a", "a", 7, ""], offered: "x", deferred: ["d"], pending: 5 })).toEqual({ v: 1, done: ["a"], offered: [], deferred: ["d"], pending: null });
  });
  it("the view tells how many regular questions are left and how many challenges wait", () => {
    expect(flowView(emptyLedger())).toEqual({ toNext: 10, owed: 0 });
    expect(flowView(run(emptyLedger(), q(4)).ledger)).toEqual({ toNext: 6, owed: 0 });
    expect(flowView({ ...emptyLedger(), pending: "t1", deferred: ["t2"] })).toEqual({ toNext: 10, owed: 2 });
  });
});
