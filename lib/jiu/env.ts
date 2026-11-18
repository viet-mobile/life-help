import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
export async function readJiuEnv(name: string): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value) return value;
  } catch { /* Local Next.js execution. */ }
  return process.env.NODE_ENV !== "production" ? process.env[name] : undefined;
}
