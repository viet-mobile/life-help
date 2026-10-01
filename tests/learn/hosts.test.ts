import { describe, expect, it } from "vitest";
import { parseLearnHost } from "@/lib/learn/hosts";
import { getAppEnv, supabaseMatchesEnvironment } from "@/lib/env";

describe("learn hostnames (explicit allowlist)", () => {
  it("maps production, staging and local hosts", () => {
    expect(parseLearnHost("math.life.help")).toEqual({ site: "math", stage: "production" });
    expect(parseLearnHost("english.life.help:443")).toEqual({ site: "english", stage: "production" });
    expect(parseLearnHost("Math-Staging.life.help")).toEqual({ site: "math", stage: "staging" });
    expect(parseLearnHost("english-staging.life.help")).toEqual({ site: "english", stage: "staging" });
    expect(parseLearnHost("math.localhost:3000")).toEqual({ site: "math", stage: "local" });
  });
  it("does not capture existing LIFE.HELP hosts or look-alikes", () => {
    for (const h of ["life.help", "korea.life.help", "tech.life.help", "sys.korea.life.help", "vietnam.life.help",
      "math.evil.com", "math.life.help.evil.com", "xmath.life.help", "math-prod.life.help", "a.math.life.help", "localhost"]) {
      expect(parseLearnHost(h), h).toBeNull();
    }
  });
});

describe("environment resolution", () => {
  it("defaults safely", () => {
    expect(getAppEnv({ NODE_ENV: "production" })).toBe("production");
    expect(getAppEnv({ NODE_ENV: "development" })).toBe("local");
    expect(getAppEnv({ APP_ENV: "staging", NODE_ENV: "production" })).toBe("staging");
    expect(getAppEnv({ APP_ENV: "bogus", NODE_ENV: "production" })).toBe("production");
  });
  it("blocks a database that does not belong to the environment", () => {
    expect(supabaseMatchesEnvironment({ APP_ENV: "staging", NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" })).toBe(false);
    expect(supabaseMatchesEnvironment({ APP_ENV: "staging", EXPECTED_SUPABASE_REF: "stgref", NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" })).toBe(false);
    expect(supabaseMatchesEnvironment({ APP_ENV: "staging", EXPECTED_SUPABASE_REF: "stgref", NEXT_PUBLIC_SUPABASE_URL: "https://stgref.supabase.co" })).toBe(true);
    expect(supabaseMatchesEnvironment({ APP_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://prodref.supabase.co" })).toBe(true);
  });
});
