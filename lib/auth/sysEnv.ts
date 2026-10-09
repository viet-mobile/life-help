import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAppEnv } from "@/lib/env";

export type SysEnvName = "LIFE_HELP_SYS_ADMIN_ID" | "LIFE_HELP_SYS_ADMIN_PASSWORD" | "LIFE_HELP_SYS_SESSION_SECRET";

/**
 * Admin credentials. On the Worker they come from the Cloudflare environment, exactly as before. Only outside production
 * (APP_ENV local / staging, i.e. a developer machine or the test server) may the same names come from process.env, so a
 * production build can never read an admin secret from anywhere else.
 */
export async function readSysEnv(name: SysEnvName): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const v = (env as unknown as Record<string, unknown>)[name];
    if (typeof v === "string" && v) return v;
  } catch {
    /* not running on a Worker */
  }
  if (getAppEnv() === "production") return undefined;
  return process.env[name] || undefined;
}
