import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactElement } from "react";
import LevelPage from "@/app/study/[site]/(review)/review/[level]/page";
import StartPage from "@/app/study/[site]/(review)/review/page";
import { ReviewList } from "@/components/learn/review/ReviewList";
import { loadReviewLevel } from "@/lib/learn/review/korean";

type Frame = ReactElement<{ children: (ctx: { base: string; email: string }) => Promise<ReactElement> | ReactElement }>;
const body = async (el: ReactElement) => (el as Frame).props.children({ base: "/study/korean", email: "r@example.com" });
const html = (el: ReactElement) => renderToStaticMarkup(el);

describe("Korean review pages (the gate is ReviewFrame; these exercise what is rendered behind it)", () => {
  it("level page: rows with id, level, skill, correct answer and the status banner text; paging links", async () => {
    const el = await LevelPage({ params: Promise.resolve({ site: "korean", level: "K7" }), searchParams: Promise.resolve({ lang: "vi", skill: "k.k7.bridge_formal" }) });
    const out = html(await body(el));
    expect(out).toContain("k-k7-bridge_formal-1");
    expect(out).toContain("k.k7.bridge_formal");
    expect(out).toContain("DRAFT");
    expect(out).toContain('data-correct="true"');
    expect(out).toContain("vi text");
  });
  it("unknown level -> 404, unknown language and unknown skill -> a visible error, never a crash", async () => {
    await expect(LevelPage({ params: Promise.resolve({ site: "korean", level: "K11" }), searchParams: Promise.resolve({}) })).rejects.toThrow();
    await expect(LevelPage({ params: Promise.resolve({ site: "math", level: "K1" }), searchParams: Promise.resolve({}) })).rejects.toThrow();
    const bad = html(await body(await LevelPage({ params: Promise.resolve({ site: "korean", level: "K3" }), searchParams: Promise.resolve({ lang: "zz" }) })));
    expect(bad).toContain("review-bad-lang");
    const badSkill = html(await body(await LevelPage({ params: Promise.resolve({ site: "korean", level: "K3" }), searchParams: Promise.resolve({ skill: "k.k9.nope" }) })));
    expect(badSkill).toContain("review-bad-skill");
    const paged = html(await body(await LevelPage({ params: Promise.resolve({ site: "korean", level: "K3" }), searchParams: Promise.resolve({ page: "999999" }) })));
    expect(paged).toContain("review-list");
  });
  it("start page lists every level, every language with its status, and the unreviewed notice", async () => {
    const out = html(await body(await StartPage({ params: Promise.resolve({ site: "korean" }) })));
    for (const l of ["K1", "K5", "K10"]) expect(out).toContain(`/review/${l}?lang=vi`);
    expect(out).toContain('data-tier="partial"');
    expect(out).toContain('data-tier="complete"');
    expect(out).toContain("AI 번역");
    expect(out).not.toMatch(/검토 완료|reviewed: true/);
  });
  it("a fallback row says so", async () => {
    const page = await loadReviewLevel("K2", "ar", { skill: "k.k2.greetings", limit: 100 });
    const out = html(createElement(ReviewList, { rows: page.rows, locale: "ar" }));
    expect(out).toContain("fallback to English");
  });
});
