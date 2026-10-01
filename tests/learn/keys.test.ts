import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublishableKey, resolveSecretKey } from "@/lib/supabase/keys";

describe("supabase key resolution", () => {
  it("prefers new publishable key names, falls back to legacy anon", () => {
    expect(resolvePublishableKey({ SUPABASE_PUBLISHABLE_KEY: "sb_publishable_a", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_b", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" })).toBe("sb_publishable_a");
    expect(resolvePublishableKey({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_b", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" })).toBe("sb_publishable_b");
    expect(resolvePublishableKey({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" })).toBe("anon");
    expect(resolvePublishableKey({})).toBeUndefined();
  });
  it("keeps the secret key resolution in main's serviceRole.ts: new name first, legacy name as fallback", () => {
    const src = readFileSync(path.join(__dirname, "../../lib/supabase/serviceRole.ts"), "utf8");
    const uses = src.match(/SUPABASE_SECRET_KEY \|\| (?:process.env|runtimeEnv)\.SUPABASE_SERVICE_ROLE_KEY/g) ?? [];
    expect(uses).toHaveLength(3);
    expect(resolveSecretKey({ SUPABASE_SECRET_KEY: "sb_secret_x", SUPABASE_SERVICE_ROLE_KEY: "legacy" })).toBe("sb_secret_x");
    expect(resolveSecretKey({ SUPABASE_SECRET_KEY: "" })).toBeUndefined();
  });
  it("never exposes the secret under a NEXT_PUBLIC_ name", () => {
    expect(resolveSecretKey({ NEXT_PUBLIC_SUPABASE_SECRET_KEY: "sb_secret_x" })).toBeUndefined();
  });
});
