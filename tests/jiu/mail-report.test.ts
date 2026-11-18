import { describe, expect, it } from "vitest";
import { formatMailReport, parseMailReport, MAIL_RECIPIENT } from "@/lib/jiu/mailReport";
const event = { id: "1", site: "math", action: "attempt", at: "2026-10-20T16:00:00Z" };
describe("journal email report", () => {
  it("validates and bounds untrusted browser reports", () => {
    for (const value of [null, {}, { events: [], notes: [] }, { events: [{ ...event, action: "arbitrary" }], notes: [] }, { events: [event], notes: [{ day: "bad", text: "x" }] }, { events: Array(201).fill(event), notes: [] }, { events: [], notes: [{ day: "2026-10-20", text: "x".repeat(5001) }] }]) expect(parseMailReport(value)).toBeNull();
  });
  it("builds plain text by Korean day with counts and reflections", () => {
    const report = parseMailReport({ events: [event, { ...event, id: "2" }], notes: [{ day: "2026-10-21", text: "분수를 배웠다." }], recipient: "someone@example.test" });
    expect(report).not.toBeNull();
    const mail = formatMailReport(report!);
    expect(mail.subject).toBe("[JIU 학습 일지] 2026-10-21");
    expect(mail.text).toContain("수학: 문제 풀이 2회");
    expect(mail.text).toContain("분수를 배웠다.");
    expect(MAIL_RECIPIENT).toBe("jiubag850@gmail.com");
    expect(report).not.toHaveProperty("recipient");
  });
  it("canonicalizes equivalent snapshots for retry deduplication", () => {
    const other = { ...event, id: "2" };
    expect(parseMailReport({ events: [other, event], notes: [] })).toEqual(parseMailReport({ events: [event, other], notes: [] }));
  });
});
