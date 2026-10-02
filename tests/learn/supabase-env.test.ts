import { afterEach, describe, expect, it, vi } from "vitest";
import { learnProjectRef, readLearnPublicConfig } from "@/lib/learn/server/supabase/config";
import { readLearnSecretKey } from "@/lib/learn/server/supabase/secret";
import { createLearnServiceClient, learnAccountsConfigured } from "@/lib/learn/server/supabase/service";

/**
 * Fail-closed environment matrix for the learning platform's Supabase access. The learning code reads ONLY
 * LEARN_SUPABASE_URL / LEARN_SUPABASE_PUBLISHABLE_KEY / LEARN_SUPABASE_SECRET_KEY / EXPECTED_LEARN_SUPABASE_REF.
 */
const LEARN_REF = "learnprojectref01";
const LEARN = {
  APP_ENV: "staging",
  LEARN_SUPABASE_URL: `https://${LEARN_REF}.supabase.co`,
  LEARN_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_learn_test_key",
  LEARN_SUPABASE_SECRET_KEY: "sb_secret_learn_test_key",
  EXPECTED_LEARN_SUPABASE_REF: LEARN_REF,
};
const GENERIC = {
  SUPABASE_URL: "https://genericprojectref1.supabase.co",
  NEXT_PUBLIC_SUPABASE_URL: "https://genericprojectref1.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "generic_anon",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_generic",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_generic",
  SUPABASE_SERVICE_ROLE_KEY: "generic_service_role",
  SUPABASE_SECRET_KEY: "sb_secret_generic",
  EXPECTED_SUPABASE_REF: "genericprojectref1",
};
const without = (env: Record<string, string>, ...keys: string[]) => Object.fromEntries(Object.entries(env).filter(([k]) => !keys.includes(k)));
const urlOf = (client: unknown) => (client as { supabaseUrl: string }).supabaseUrl;

afterEach(() => vi.unstubAllEnvs());

describe("CASE A: no LEARN_* at all", () => {
  it("accounts are off, no public config, no secret, no service client", () => {
    for (const env of [{}, { APP_ENV: "staging" }, { APP_ENV: "production" }, { APP_ENV: "local" }]) {
      expect(readLearnPublicConfig(env)).toBeNull();
      expect(readLearnSecretKey(env)).toBeUndefined();
      expect(createLearnServiceClient(env)).toBeNull();
      expect(learnAccountsConfigured(env)).toBe(false);
    }
  });
});

describe("CASE B: only generic marketplace SUPABASE_* present", () => {
  it("learning accounts stay disabled in every environment: generic names are never read, there is no fallback", () => {
    for (const appEnv of ["local", "staging", "production"]) {
      const env = { APP_ENV: appEnv, ...GENERIC };
      expect(readLearnPublicConfig(env)).toBeNull();
      expect(readLearnSecretKey(env)).toBeUndefined();
      expect(createLearnServiceClient(env)).toBeNull();
      expect(learnAccountsConfigured(env)).toBe(false);
    }
  });
  it("a partly set LEARN_* plus every generic name still does not borrow a generic value", () => {
    const base = { ...GENERIC, APP_ENV: "staging", LEARN_SUPABASE_URL: LEARN.LEARN_SUPABASE_URL, EXPECTED_LEARN_SUPABASE_REF: LEARN_REF };
    expect(learnAccountsConfigured(base)).toBe(false); // no publishable, no secret
    expect(learnAccountsConfigured({ ...base, LEARN_SUPABASE_PUBLISHABLE_KEY: "k" })).toBe(false); // the generic secret is not borrowed
  });
});

describe("CASE C: LEARN URL + publishable key only", () => {
  it("session credentials resolve, but accounts are NOT enabled and there is no service client (the account feature must not look ready)", () => {
    const env = without(LEARN, "LEARN_SUPABASE_SECRET_KEY");
    expect(readLearnPublicConfig(env)).toMatchObject({ url: LEARN.LEARN_SUPABASE_URL, publishableKey: LEARN.LEARN_SUPABASE_PUBLISHABLE_KEY, ref: LEARN_REF });
    expect(learnAccountsConfigured(env)).toBe(false);
    expect(createLearnServiceClient(env)).toBeNull();
  });
  it("a secret without URL / publishable key is equally not enough", () => {
    expect(learnAccountsConfigured(without(LEARN, "LEARN_SUPABASE_PUBLISHABLE_KEY"))).toBe(false);
    expect(learnAccountsConfigured(without(LEARN, "LEARN_SUPABASE_URL"))).toBe(false);
  });
});

describe("CASE D: LEARN URL + publishable key + secret key", () => {
  it("accounts are enabled and the service client points at the LEARN project", () => {
    expect(learnAccountsConfigured(LEARN)).toBe(true);
    expect(urlOf(createLearnServiceClient(LEARN))).toBe(LEARN.LEARN_SUPABASE_URL);
  });
  it("tolerates quoting / trailing slash / the REST suffix on the URL", () => {
    expect(readLearnPublicConfig({ ...LEARN, LEARN_SUPABASE_URL: `"${LEARN.LEARN_SUPABASE_URL}/rest/v1/"` })?.url).toBe(LEARN.LEARN_SUPABASE_URL);
  });
  it("local development may omit the ref guard and use localhost over http; staging / production may not", () => {
    const local = { APP_ENV: "local", LEARN_SUPABASE_URL: "http://127.0.0.1:54321", LEARN_SUPABASE_PUBLISHABLE_KEY: "k", LEARN_SUPABASE_SECRET_KEY: "s" };
    expect(learnAccountsConfigured(local)).toBe(true);
    expect(learnAccountsConfigured({ ...local, APP_ENV: "staging" })).toBe(false);
    expect(learnAccountsConfigured({ ...local, APP_ENV: "production" })).toBe(false);
    expect(learnAccountsConfigured({ ...LEARN, LEARN_SUPABASE_URL: `http://${LEARN_REF}.supabase.co` })).toBe(false); // plain http to a real project
  });
});

describe("CASE E: EXPECTED_LEARN_SUPABASE_REF disagrees with the URL", () => {
  it("fails closed for every state, so staging and production can never be cross-wired", () => {
    for (const appEnv of ["local", "staging", "production"]) {
      const env = { ...LEARN, APP_ENV: appEnv, EXPECTED_LEARN_SUPABASE_REF: "someotherprojectref" };
      expect(readLearnPublicConfig(env)).toBeNull();
      expect(createLearnServiceClient(env)).toBeNull();
      expect(learnAccountsConfigured(env)).toBe(false);
    }
  });
  it("staging and production require the ref guard; it is compared exactly, not as a substring", () => {
    expect(learnAccountsConfigured(without(LEARN, "EXPECTED_LEARN_SUPABASE_REF"))).toBe(false);
    expect(learnAccountsConfigured({ ...without(LEARN, "EXPECTED_LEARN_SUPABASE_REF"), APP_ENV: "production" })).toBe(false);
    expect(learnAccountsConfigured({ ...LEARN, EXPECTED_LEARN_SUPABASE_REF: "learnprojectref0" })).toBe(false); // prefix of the real ref
    expect(learnAccountsConfigured({ ...LEARN, EXPECTED_LEARN_SUPABASE_REF: LEARN_REF.toUpperCase() })).toBe(true); // refs are case-insensitive
    expect(learnAccountsConfigured({ ...LEARN, LEARN_SUPABASE_URL: `https://evil.example/${LEARN_REF}.supabase.co` })).toBe(false); // not a supabase host
    expect(learnProjectRef("https://abc123.supabase.co/rest/v1")).toBe("abc123");
    expect(learnProjectRef("https://abc123.supabase.co.evil.example")).toBeNull();
  });
  it("the generic EXPECTED_SUPABASE_REF is not a substitute for EXPECTED_LEARN_SUPABASE_REF", () => {
    expect(learnAccountsConfigured({ ...without(LEARN, "EXPECTED_LEARN_SUPABASE_REF"), EXPECTED_SUPABASE_REF: LEARN_REF })).toBe(false);
  });
});

describe("CASE F: generic credentials point at a DIFFERENT project than the LEARN credentials", () => {
  it("learning uses only the LEARN project: the service client targets it, whatever the generic variables say", () => {
    const env = { ...GENERIC, ...LEARN };
    expect(readLearnPublicConfig(env)?.url).toBe(LEARN.LEARN_SUPABASE_URL);
    expect(readLearnPublicConfig(env)?.publishableKey).toBe(LEARN.LEARN_SUPABASE_PUBLISHABLE_KEY);
    expect(readLearnSecretKey(env)).toBe(LEARN.LEARN_SUPABASE_SECRET_KEY);
    expect(urlOf(createLearnServiceClient(env))).toBe(LEARN.LEARN_SUPABASE_URL);
    expect(urlOf(createLearnServiceClient(env))).not.toContain("genericprojectref1");
  });
  it("the same holds through process.env (the runtime path): decoy generic variables never win and never enable accounts", async () => {
    for (const [k, v] of Object.entries({ ...GENERIC, ...LEARN })) vi.stubEnv(k, v);
    const { accountsEnabled, getLearnServiceClient } = await import("@/lib/learn/server/runtime");
    expect(accountsEnabled()).toBe(true);
    expect(urlOf(getLearnServiceClient())).toBe(LEARN.LEARN_SUPABASE_URL);
    vi.unstubAllEnvs();
    for (const [k, v] of Object.entries({ ...GENERIC, APP_ENV: "staging" })) vi.stubEnv(k, v);
    expect(accountsEnabled()).toBe(false); // generic only
    expect(getLearnServiceClient()).toBeNull();
  });
});
