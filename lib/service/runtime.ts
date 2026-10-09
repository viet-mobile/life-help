import { getAppEnv } from "@/lib/env";
import type { ServiceDb } from "./db";
import { createSupabaseDb, readSupabaseConfig } from "./dbSupabase";
import { ServiceCore } from "./core";
import { FakeTranslator, MyMemoryTranslator, type Translator } from "./translate";

type Env = Record<string, string | undefined>;
export type Backend = "local" | "supabase" | "off";

/**
 * Which database the service core uses:
 *   supabase - SERVICE_CORE_SUPABASE_* complete and the project-ref guard passes (staging / production)
 *   local    - SERVICE_CORE_BACKEND=local on a NON-production app env: the real migration on an embedded Postgres, for development and tests
 *   off      - anything else. The API answers 503; there is no silent fallback to browser storage or seed data.
 * A production build can never select "local", whatever the variables say.
 */
export function resolveBackend(env: Env = process.env, appEnv = getAppEnv(env)): Backend {
  if (env.SERVICE_CORE_BACKEND === "local") return appEnv === "production" ? "off" : "local";
  return readSupabaseConfig(env) ? "supabase" : "off";
}

/** The fake translator exists for local / test runs only. */
export function resolveTranslator(env: Env = process.env, appEnv = getAppEnv(env)): Translator {
  if (env.SERVICE_CORE_TRANSLATOR === "fake" && appEnv !== "production") return new FakeTranslator();
  return new MyMemoryTranslator();
}

const g = globalThis as unknown as { __svcCore?: Promise<ServiceCore | null> };

export function getServiceCore(env: Env = process.env): Promise<ServiceCore | null> {
  if (!g.__svcCore) {
    g.__svcCore = (async () => {
      const backend = resolveBackend(env);
      if (backend === "off") return null;
      let db: ServiceDb;
      if (backend === "local") {
        const { createLocalDb } = await import("./dbLocal");
        db = await createLocalDb();
      } else {
        db = createSupabaseDb(readSupabaseConfig(env)!);
      }
      return new ServiceCore(db, resolveTranslator(env));
    })();
  }
  return g.__svcCore;
}
