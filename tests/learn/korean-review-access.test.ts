import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const state: { accounts: boolean; user: unknown; staff: boolean | "throw"; getUserThrows: boolean } = { accounts: true, user: null, staff: false, getUserThrows: false };
vi.mock("@/lib/learn/server/runtime", () => ({ accountsEnabled: () => state.accounts, getLearnServiceClient: () => ({}) }));
vi.mock("@/lib/learn/server/supabase/session", () => ({
  createLearnSessionClient: async () => ({ auth: { getUser: async () => { if (state.getUserThrows) throw new Error("boom"); return { data: { user: state.user } }; } } }),
}));
vi.mock("@/lib/learn/server/adminAccess", () => ({ isLearnStaff: async () => { if (state.staff === "throw") throw new Error("db"); return state.staff; } }));

import { isReviewer, reviewAccess, reviewModeEnabled, reviewerEmails } from "@/lib/learn/review/access";

const staging = { APP_ENV: "staging", KOREAN_REVIEW_MODE: "1", KOREAN_REVIEWER_EMAILS: " Alice@Example.com, bob@example.com ," };
const user = (over: object = {}) => ({ id: "u1", email: "alice@example.com", email_confirmed_at: "2026-01-01T00:00:00Z", is_anonymous: false, ...over });
const root = path.resolve(__dirname, "../..");

beforeEach(() => { state.accounts = true; state.user = null; state.staff = false; state.getUserThrows = false; });

describe("Korean review console: environment switch", () => {
  it("is on only for a staging / local environment with KOREAN_REVIEW_MODE=1", () => {
    expect(reviewModeEnabled(staging)).toBe(true);
    expect(reviewModeEnabled({ ...staging, APP_ENV: "local" })).toBe(true);
    expect(reviewModeEnabled({ ...staging, KOREAN_REVIEW_MODE: undefined })).toBe(false);
    for (const v of ["0", "true", "", "yes", " 1"]) expect(reviewModeEnabled({ ...staging, KOREAN_REVIEW_MODE: v }), v).toBe(false);
  });
  it("can never be enabled on a production environment, whatever else is set", () => {
    expect(reviewModeEnabled({ ...staging, APP_ENV: "production" })).toBe(false);
    expect(reviewModeEnabled({ KOREAN_REVIEW_MODE: "1" }, )).toBe(process.env.NODE_ENV !== "production"); // no APP_ENV: only a non-production build / runtime
  });
  it("the production Worker config and the staging config do not carry the switch; only the review Worker config does", () => {
    for (const f of ["wrangler.jsonc", "wrangler.staging.jsonc"]) expect(readFileSync(path.join(root, f), "utf8"), f).not.toMatch(/KOREAN_REVIEW_MODE|KOREAN_REVIEWER_EMAILS/);
    const review = readFileSync(path.join(root, "wrangler.korean-review.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, "");
    expect(review).toMatch(/"KOREAN_REVIEW_MODE":\s*"1"/);
    expect(review).toMatch(/"APP_ENV":\s*"staging"/);
    expect(review).not.toMatch(/KOREAN_REVIEWER_EMAILS/); // reviewer addresses are set per deployment, never committed
    expect(review).not.toMatch(/"routes"|"route"|custom_domain/); // workers.dev only: no route on any life.help host
  });
});

describe("Korean review console: who is a reviewer", () => {
  it("pure decision: staff, or a CONFIRMED e-mail on the allow list; never anonymous, unconfirmed or unlisted", () => {
    const allow = reviewerEmails(staging);
    expect([...allow].sort()).toEqual(["alice@example.com", "bob@example.com"]);
    expect(isReviewer(user() as never, false, allow)).toBe(true);
    expect(isReviewer(user({ email: "ALICE@example.com" }) as never, false, allow)).toBe(true);
    expect(isReviewer(user({ email_confirmed_at: undefined }) as never, false, allow)).toBe(false);
    expect(isReviewer(user({ email: "eve@example.com" }) as never, false, allow)).toBe(false);
    expect(isReviewer(user({ email: undefined }) as never, false, allow)).toBe(false);
    expect(isReviewer(user({ is_anonymous: true }) as never, true, allow)).toBe(false);
    expect(isReviewer(null, true, allow)).toBe(false);
    expect(isReviewer(user({ email: "eve@example.com" }) as never, true, allow)).toBe(true); // learn_staff_users row
    expect(isReviewer(user() as never, false, new Set())).toBe(false);
  });
  it("service-level states", async () => {
    expect(await reviewAccess({ APP_ENV: "production", KOREAN_REVIEW_MODE: "1" })).toEqual({ state: "disabled" });
    state.accounts = false;
    expect((await reviewAccess(staging)).state).toBe("forbidden");
    state.accounts = true;
    expect(await reviewAccess(staging)).toEqual({ state: "login" });
    state.user = user({ is_anonymous: true });
    expect(await reviewAccess(staging)).toEqual({ state: "login" });
    state.user = user({ email: "eve@example.com" });
    expect((await reviewAccess(staging)).state).toBe("forbidden");
    state.user = user();
    expect(await reviewAccess(staging)).toEqual({ state: "ok", email: "alice@example.com" });
    state.user = user({ email: "eve@example.com" }); state.staff = true;
    expect((await reviewAccess(staging)).state).toBe("ok");
  });
  it("fails closed when the session or the staff lookup throws", async () => {
    state.getUserThrows = true;
    expect(await reviewAccess(staging)).toEqual({ state: "login" });
    state.getUserThrows = false; state.user = user({ email: "eve@example.com" }); state.staff = "throw";
    expect((await reviewAccess(staging)).state).toBe("forbidden");
  });
});

describe("Korean review console: routes", () => {
  const pages = ["app/study/[site]/(review)/review/page.tsx", "app/study/[site]/(review)/review/[level]/page.tsx"];
  it("every review page goes through ReviewFrame (access gate), is noindex, dynamic and korean-only", () => {
    for (const f of pages) {
      const src = readFileSync(path.join(root, f), "utf8");
      expect(src, f).toMatch(/<ReviewFrame>/);
      expect(src, f).toMatch(/robots:\s*{\s*index:\s*false/);
      expect(src, f).toMatch(/dynamic = "force-dynamic"/);
      expect(src, f).toMatch(/!==\s*"korean"/);
    }
  });
  it("the frame answers 404 when the environment is not a review environment and states the unreviewed status", () => {
    const src = readFileSync(path.join(root, "components/learn/review/ReviewFrame.tsx"), "utf8");
    expect(src).toMatch(/access\.state === "disabled"\) notFound\(\)/);
    expect(src).toMatch(/REVIEW ENVIRONMENT/);
    expect(src).toMatch(/끝나지 않았습니다/);
    expect(src).not.toMatch(/reviewed: true|검토 완료/);
  });
  it("the console never writes to a database or to learner progress", () => {
    for (const f of ["lib/learn/review/korean.ts", "lib/learn/review/access.ts", "components/learn/review/ReviewList.tsx", ...pages]) {
      const src = readFileSync(path.join(root, f), "utf8");
      expect(src, f).not.toMatch(/\.insert\(|\.upsert\(|\.rpc\(|\.from\(|saveOnboarding|submitAttempt|fetch\(|createLearnServiceClient/);
    }
  });
});
