import { NEUTRAL_SET } from "@/lib/learn/hintGate";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import manifest from "@/lib/learn/content/asset-manifest.json";
import servedBank from "@/lib/learn/content/bank/english-draft.json";
import { loadIndex, toPublicQuestion } from "@/lib/learn/content/repository";
import type { Question } from "@/lib/learn/types";
import { loadEnglishBankIndex, loadEnglishBankSkill, ContentAssetError } from "@/lib/learn/content/assets";

// Fault injection stays inside this test module; other workers must keep reading the real assets.
vi.mock("node:fs/promises", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:fs/promises")>();
  return { ...original, readFile: vi.fn(original.readFile) };
});

const served = (servedBank as { questions: { id: string; skillId: string }[] }).questions;
const dir = path.join(process.cwd(), "public", "learn-content", manifest.version, "english-bank");
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const eb = (b: { questions: Question[] }) => b.questions.filter((q) => q.id.startsWith("eb-"));

describe("English practice bank = server-only, versioned, sha-pinned static assets", () => {
  it("the manifest pins the bank: total, index and every skill shard match the committed source and the generated files", () => {
    const m = (manifest as unknown as { englishBank: { total: number; bankSha: string; index: { sha256: string }; shards: Record<string, { sha256: string; questions: number }> } }).englishBank;
    expect(m.total).toBe(served.length);
    expect(m.bankSha).toBe(sha(fs.readFileSync("lib/learn/content/bank/english-draft.json", "utf8")));
    expect(sha(fs.readFileSync(path.join(dir, "index.json")))).toBe(m.index.sha256);
    let n = 0;
    for (const [skill, pin] of Object.entries(m.shards)) {
      expect(sha(fs.readFileSync(path.join(dir, `${skill}.json`))), skill).toBe(pin.sha256);
      n += pin.questions;
    }
    expect(n).toBe(served.length);
  });
  it("the bank is not part of the Worker/client code: no source module imports the bank JSON", () => {
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
    for (const f of [...walk("lib"), ...walk("app"), ...walk("components")]) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/bank\/english-(draft|pending)/);
  });
  it("direct access to a bank asset URL is refused on every host", async () => {
    for (const host of ["learn.life.help", "life.help", "localhost:3000"]) {
      for (const p of [`/learn-content/${manifest.version}/english-bank/index.json`, `/learn-content/${manifest.version}/english-bank/e.e3.read.json`]) {
        const res = await proxy(new NextRequest(`https://${host}${p}`, { headers: { host } }));
        expect(res.status, `${host}${p}`).toBe(404);
      }
    }
  });
  it("grade scope loads only that grade's skills; one question loads only its own skill; the full set is the whole bank", async () => {
    const all = eb((await loadIndex("english")).bundle);
    expect(all.length).toBe(served.length);
    expect(new Set(all.map((q) => q.id)).size).toBe(served.length);
    const e3 = eb((await loadIndex("english", { grade: "E3" })).bundle);
    expect(e3.length).toBeGreaterThan(0);
    expect(e3.length).toBeLessThan(all.length / 4);
    expect(e3.every((q) => q.skillId.startsWith("e.e3.") || q.skillId.startsWith("e.e"))).toBe(true);
    const m3 = eb((await loadIndex("english", { grade: "M3" })).bundle);
    expect(m3.some((q) => q.skillId.startsWith("e.m3."))).toBe(true);
    expect(m3.some((q) => q.skillId.startsWith("e.e3."))).toBe(false);
    const target = served.find((q) => q.skillId === "e.h1.conn")!;
    const one = eb((await loadIndex("english", { locale: "ko", bankQuestionId: target.id })).bundle);
    expect(new Set(one.map((q) => q.skillId))).toEqual(new Set(["e.h1.conn"]));
    expect(one.some((q) => q.id === target.id)).toBe(true);
    const none = eb((await loadIndex("english", { locale: "ko", bankQuestionId: "eb-does-not-exist" })).bundle);
    expect(none.length).toBe(0);
  });
  it("question ids, answers and hints are exactly the committed bank's; other languages get localized Hangul-free bank items; the browser view carries no key, hint or explanation", async () => {
    const all = eb((await loadIndex("english")).bundle);
    const byId = new Map(all.map((q) => [q.id, q]));
    for (const s of served.slice(0, 4000)) {
      const q = byId.get(s.id)!;
      expect(q, s.id).toBeTruthy();
      expect(JSON.stringify(q.answer)).toBe(JSON.stringify((s as unknown as { answer: unknown }).answer));
      const rawHints = (s as unknown as { hints: string[] }).hints;
      expect(q.hints[0]).toBe(rawHints[0]); // hint 1 is served as authored
      expect(NEUTRAL_SET).toContain(q.hints[1]); // hint 2 is fail-closed (lib/learn/hintGate.ts); the authored one stays in the data file
      expect(q.hints).toHaveLength(rawHints.length);
    }
    for (const q of all.slice(0, 500)) {
      const pub = JSON.stringify(toPublicQuestion(q));
      expect(pub).not.toContain("explanation");
      expect(pub).not.toContain('"answer"');
      expect(pub).not.toContain('"hints"');
    }
    const viBank = eb((await loadIndex("english", { locale: "vi" })).bundle);
    expect(viBank.length).toBeGreaterThan(6000);
    for (const q of viBank.slice(0, 500)) {
      expect(q.prompt, q.id).not.toMatch(/[가-힣ㄱ-ㆎ]/);
      expect(q.explanation, q.id).not.toMatch(/[가-힣ㄱ-ㆎ]/);
      expect(q.hints[0], q.id).not.toMatch(/[가-힣ㄱ-ㆎ]/);
      expect(q.hints[1], q.id).toBe("💭");
    }
  });
  it("a tampered or missing shard is a clear error (never another file, never a silent skip); a good one is still readable afterwards", async () => {
    const file = path.join(dir, "e.pres.json");
    const original = fs.readFileSync(file);
    vi.mocked(readFile).mockResolvedValueOnce(original.toString("utf8").replace('"questions"', '"questionz"') as never);
    await expect(loadEnglishBankSkill("e.pres")).rejects.toThrow(/learn_content_asset_checksum:english-bank\/e\.pres/);
    vi.mocked(readFile).mockRejectedValueOnce(Object.assign(new Error("missing fixture asset"), { code: "ENOENT" }));
    await expect(loadEnglishBankSkill("e.pres")).rejects.toThrow(ContentAssetError);
    expect((await loadEnglishBankSkill("e.pres")).length).toBeGreaterThan(0); // failed reads are not cached
    expect(await loadEnglishBankSkill("e.no.such.skill")).toEqual([]);
    expect((await loadEnglishBankIndex()).size).toBe(served.length);
  });
});
