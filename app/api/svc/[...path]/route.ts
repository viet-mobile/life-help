import { cookies } from "next/headers";
import { locales } from "@/messages";
import { SYS_SESSION_COOKIE, verifySysSessionToken } from "@/lib/auth/sysSession";
import { createServiceHandler } from "@/lib/service/http";
import { getServiceCore } from "@/lib/service/runtime";

/**
 * Customer <-> helper service API. Every route re-checks who is calling inside the database (see 202610090040_service_core.sql);
 * this file only wires the signed admin session and the product's locale list into the handler.
 */
const handle = createServiceHandler({
  core: () => getServiceCore(),
  locales,
  verifyAdmin: async () => {
    const store = await cookies();
    const session = await verifySysSessionToken(store.get(SYS_SESSION_COOKIE)?.value);
    return session?.id ?? null;
  },
});

type Ctx = { params: Promise<{ path: string[] }> };
const run = async (request: Request, ctx: Ctx) => handle(request, (await ctx.params).path);
export const GET = run;
export const POST = run;
export const PATCH = run;
export const dynamic = "force-dynamic";
