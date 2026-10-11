import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGAL_DOCS } from "@/lib/legal/documents";
import { LEGAL_VERSION, OPERATOR } from "@/lib/legal/operator";
import { GET as health } from "@/app/api/health/route";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const text = (kind: "privacy" | "terms", lang: "ko" | "en") => JSON.stringify(LEGAL_DOCS[kind][lang]);

describe("legal documents", () => {
  it("Korean and English have the same sections in the same order", () => {
    for (const kind of ["privacy", "terms"] as const) {
      expect(LEGAL_DOCS[kind].en.sections.map((s) => s.id)).toEqual(LEGAL_DOCS[kind].ko.sections.map((s) => s.id));
    }
  });
  it("the privacy policy covers the items the Personal Information Protection Act requires", () => {
    const ids = LEGAL_DOCS.privacy.ko.sections.map((s) => s.id);
    for (const id of ["items", "purpose", "retention", "third", "processors", "destroy", "rights", "children", "cookies", "security", "officer", "remedy", "changes"]) expect(ids).toContain(id);
  });
  it("names the processors and the stored address field, and the children procedure", () => {
    const ko = text("privacy", "ko");
    for (const w of ["Supabase", "Cloudflare", "MyMemory", "상세 주소", "법정대리인", "만 14세 미만"]) expect(ko).toContain(w);
    const en = text("privacy", "en");
    for (const w of ["Supabase", "Cloudflare", "MyMemory", "detailed address", "legal guardian", "under 14"]) expect(en).toContain(w);
  });
  it("never claims what the Service does not do", () => {
    for (const lang of ["ko", "en"] as const) {
      const all = text("privacy", lang) + text("terms", lang);
      expect(all).not.toMatch(/광고 목적으로 이용합니다|sell(s)? (your )?(personal )?information/i);
    }
  });
  it("operator facts are strings and the version is set (launch-check reports the empty ones)", () => {
    expect(LEGAL_VERSION.length).toBeGreaterThan(4);
    for (const v of Object.values(OPERATOR)) expect(typeof v).toBe("string");
  });
});

describe("sign-up consent", () => {
  const actions = read("app/study/[site]/actions.ts");
  it("the server action refuses sign-up without age basis and agreement, and records the consent", () => {
    expect(actions).toContain('formData.get("agree") !== "on"');
    expect(actions).toContain('"14plus"');
    expect(actions).toContain('"guardian"');
    expect(actions).toContain("legal_consent");
    expect(actions).toContain("LEGAL_VERSION");
  });
  it("the form asks for it and links the two documents", () => {
    const form = read("components/learn/AuthForm.tsx");
    expect(form).toContain('name="ageBasis"');
    expect(form).toContain('name="agree"');
    expect(form).toContain('href("/privacy")');
    expect(form).not.toMatch(/[가-힣]/); // learner-language only: every label comes from the dictionary
    expect(form).toContain('href("/terms")');
  });
});

describe("health endpoint", () => {
  it("answers ok without touching secrets", async () => {
    const res = health();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, service: "life-help" });
    expect(JSON.stringify(body)).not.toMatch(/key|secret|password/i);
  });
});

describe("pages and configuration", () => {
  it("privacy and terms exist on the main site and on the learning sites", () => {
    for (const p of ["app/privacy/page.tsx", "app/terms/page.tsx", "app/study/[site]/(public)/privacy/page.tsx", "app/study/[site]/(public)/terms/page.tsx"]) {
      expect(fs.existsSync(path.join(root, p)), p).toBe(true);
    }
  });
  it("observability is enabled for both Workers", () => {
    for (const f of ["wrangler.jsonc", "wrangler.staging.jsonc"]) expect(read(f)).toMatch(/"observability"\s*:\s*\{\s*"enabled"\s*:\s*true/);
  });
  it("the backup script never prints the connection string", () => {
    const sh = read("scripts/ops/pg-backup.sh");
    expect(sh).not.toMatch(/echo[^\n]*SUPABASE_DB_URL/);
    expect(sh).toContain("gpg");
  });
});
