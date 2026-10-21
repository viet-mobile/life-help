import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isKnownServiceSlug } from "@/lib/support/knownService";
import { POST } from "@/app/api/review/route";
import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

const read = (p: string) => readFileSync(path.resolve(__dirname, "../..", p), "utf8");

describe("service slugs", () => {
  it("knows the real services", () => {
    for (const s of ["boiler", "cleaning", "housing", "job-help", "bank-help", "mobile-help", "clog-clearing", "leak-plumbing"]) expect(isKnownServiceSlug(s)).toBe(true);
  });
  it("rejects unknown slugs, including prototype keys", () => {
    for (const s of ["nonexistent", "zzz", "visa-docs", "constructor", "__proto__", ""]) expect(isKnownServiceSlug(s)).toBe(false);
  });
  it("both service routes call notFound() for unknown slugs", () => {
    for (const f of ["app/services/[service]/page.tsx", "app/support/[service]/page.tsx"]) {
      const src = read(f);
      expect(src).toContain("isKnownServiceSlug(slug)");
      expect(src).toContain("notFound()");
    }
  });
});

describe("review", () => {
  it("has no seeded reviews", () => {
    const src = read("lib/review/reviewStore.ts");
    expect(src).not.toContain("SEED_REVIEWS");
    expect(src).not.toContain("rev-seed");
  });
  it("API does not claim storage or delivery", async () => {
    const req = new Request("https://life.help/api/review", {
      method: "POST",
      headers: { origin: "https://life.help", host: "life.help", "content-type": "application/json" },
      body: JSON.stringify({ rating: 5, content: "hello" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.delivered).toBe(false);
  });
  it("page never shows a delivered/success state", () => {
    const src = read("app/review/page.tsx");
    for (const k of ["deliveredBadge", "successTitle", "saveReview", "getStoredReviews"]) expect(src).not.toContain(k);
    expect(src).toContain("review.pendingNotice");
  });
});

describe("no fake success states", () => {
  it("service card form no longer saves or claims receipt", () => {
    const src = read("components/support/SupportServiceView.tsx");
    for (const k of ["saveSupportRequest", "registerSupportPartner", "접수 완료", "안심 연결 완료", "support.successTitle"]) expect(src).not.toContain(k);
    expect(src).toContain("/request?service=");
    expect(src).toContain('href="/tech/register"');
  });
  it("counselor mock is gone", () => {
    const src = read("app/chat/counselor/page.tsx");
    expect(src).not.toContain("requestCounselorAccessKey");
    expect(src).toContain('href="/chat"');
  });
  it("request page has no file input", () => {
    expect(read("app/request/page.tsx")).not.toContain('type="file"');
  });
  it("new notice strings exist in en and ko", () => {
    const keys: Array<[string, string]> = [["support", "notSentTitle"], ["support", "providerNoticeCta"], ["review", "pendingNotice"], ["review", "noReviewsYet"], ["request", "photosNotUploaded"], ["counselorPortal", "desc"]];
    for (const d of [en, ko] as Array<Record<string, Record<string, string>>>) for (const [s, k] of keys) expect(d[s][k]).toBeTruthy();
  });
});
