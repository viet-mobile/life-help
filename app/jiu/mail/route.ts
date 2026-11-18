import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHash } from "node:crypto";
import { canSendJiuMail } from "@/lib/jiu/admin";
import { formatMailReport, MAIL_RECIPIENT, MAIL_SENDER, parseMailReport } from "@/lib/jiu/mailReport";
import { rateLimit } from "@/lib/learn/server/http";
interface MailEnv {
  JIU_EMAIL?: { send(message: { to: string; from: string; subject: string; text: string }): Promise<{ messageId: string }> };
  JIU_MAIL_STATE?: { get(key: string): Promise<string | null>; put(key: string, value: string, options: { expirationTtl: number }): Promise<void> };
}
function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
function permittedHost(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  return host === "jiu.life.help" || (process.env.NODE_ENV !== "production" && /^(localhost|jiu\.localhost)(:\d+)?$/.test(host));
}
export async function GET(request: Request) {
  if (!permittedHost(request)) return json({ error: "not_found" }, 404);
  const enabled = await canSendJiuMail();
  return json({ enabled, recipient: MAIL_RECIPIENT });
}
export async function POST(request: Request) {
  if (!permittedHost(request)) return json({ error: "not_found" }, 404);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let origin: URL;
  try { origin = new URL(request.headers.get("origin") || ""); } catch { return json({ error: "bad_origin" }, 403); }
  if (origin.host !== host) return json({ error: "bad_origin" }, 403);
  if (!(await canSendJiuMail())) return json({ error: "login_required" }, 401);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "invalid_body" }, 415);
  const raw = await request.text();
  if (raw.length > 100_000) return json({ error: "payload_too_large" }, 413);
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return json({ error: "invalid_body" }, 400); }
  const report = parseMailReport(input);
  if (!report) return json({ error: "invalid_report" }, 400);
  let env: MailEnv;
  try { env = (await getCloudflareContext({ async: true })).env as unknown as MailEnv; } catch { return json({ error: "mail_not_configured" }, 503); }
  if (!env.JIU_EMAIL || !env.JIU_MAIL_STATE) return json({ error: "mail_not_configured" }, 503);
  const hash = createHash("sha256").update(JSON.stringify(report)).digest("hex");
  try {
    if (await env.JIU_MAIL_STATE.get(`sent:${hash}`)) return json({ sent: true, duplicate: true });
    rateLimit("jiu-mail", 12, 60 * 60_000);
    const result = await env.JIU_EMAIL.send({ from: MAIL_SENDER, to: MAIL_RECIPIENT, ...formatMailReport(report) });
    await env.JIU_MAIL_STATE.put(`sent:${hash}`, result.messageId || "sent", { expirationTtl: 90 * 24 * 60 * 60 });
    return json({ sent: true });
  } catch (error) {
    console.error("[jiu] journal mail failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "mail_delivery_failed" }, 503);
  }
}
