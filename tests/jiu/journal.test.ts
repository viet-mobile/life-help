import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendEvent, dayKey, readEvents, validEvent, JOURNAL_KEY } from "@/lib/jiu/journal";
import { scryptSync } from "node:crypto";
import { verifyPassword } from "@/lib/jiu/admin";
const event = { id: "one", site: "math", action: "attempt", at: "2026-10-20T16:00:00Z" };
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) });
});
describe("private browser journal", () => {
  it("uses the learner's Korean day across midnight", () => expect(dayKey(event.at)).toBe("2026-10-21"));
  it("rejects malformed and unknown activities", () => {
    expect(validEvent(event)).toBe(true);
    for (const value of [null, {}, { ...event, site: "admin" }, { ...event, action: "toString" }, { ...event, at: "bad" }]) expect(validEvent(value)).toBe(false);
  });
  it("deduplicates bridge retries and excludes corrupt entries", () => {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify([null, event]));
    appendEvent(event);
    expect(readEvents()).toEqual([event]);
  });
  it("bounds retained events", () => {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(Array.from({length:5000}, (_, i) => ({...event, id: String(i)}))));
    appendEvent(event);
    expect(readEvents()).toHaveLength(5000);
    expect(readEvents().at(-1)).toEqual(event);
  });
});
describe("administrator password verification", () => {
  it("requires configuration and checks the salted hash", async () => {
    vi.stubEnv("JIU_ADMIN_PASSWORD_HASH", "");
    expect(await verifyPassword("anything")).toBe(false);
    vi.stubEnv("JIU_ADMIN_PASSWORD_HASH", `salt:${scryptSync("test-password", "salt", 64).toString("hex")}`);
    expect(await verifyPassword("test-password")).toBe(true);
    expect(await verifyPassword("wrong-password")).toBe(false);
    vi.unstubAllEnvs();
  });
});
