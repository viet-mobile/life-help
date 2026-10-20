import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
vi.mock("@/components/learn/MathMotion", () => ({ MathMotion: () => null }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
import MotionPage from "@/app/study/[site]/(play)/motion/page";
const root = path.join(process.cwd(), "public/math-motion");
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
describe("math motion assets", () => {
 it("pins every advertised language to a complete immutable translation pack", () => {
  const index = read("i18n/public/index.json");
  expect(Object.keys(index.locales).length).toBe(46);
  expect(index.locales.sg).toBeUndefined();
  for (const r of Object.values(index.locales) as {path: string; sha256: string}[]) {
   const bytes = fs.readFileSync(path.join(root, r.path));
   expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(r.sha256);
   const pack = JSON.parse(bytes.toString());
   expect(pack.sourceCatalogSHA256).toBe(index.sourceCatalogSHA256);
   expect(Object.keys(pack.values).length).toBe(index.keyCount);
   expect(Object.values(pack.values).every(v => typeof v === "string" && v.trim())).toBe(true);
  }
 });
 it("retains all movies and the neutral alternatives needed for localized prose", () => {
  const data = read("episodes.public.json"), overlays = read("i18n/public/overlays.json");
  expect(data.episodes.length).toBe(455);
  expect(new Set(data.episodes.map((e: {id: string}) => e.id)).size).toBe(455);
  expect(Object.keys(overlays).length).toBe(193);
  for (const e of data.episodes) {
   expect(fs.statSync(path.join(root, e.video)).size).toBeGreaterThan(0);
   if (overlays[e.id]) expect(fs.statSync(path.join(root, "neutral", e.video)).size).toBeGreaterThan(0);
   expect(e.authoringContext).toBeUndefined();
   expect(e.nodes).toBeUndefined();
  }
 });
 it("does not publish private authoring or translation inputs", () => {
  for (const file of ["episodes.internal.json", "render-scenes.json", "i18n/source-catalog.json", "i18n/sg-authored.tsv"])
   expect(fs.existsSync(path.join(root, file))).toBe(false);
 });
 it("opens only on the math learning site", async () => {
  expect(await MotionPage({ params: Promise.resolve({ site: "math" }) })).toBeTruthy();
  for (const site of ["english", "korean"])
   await expect(MotionPage({ params: Promise.resolve({ site }) })).rejects.toThrow("404");
 });
});
