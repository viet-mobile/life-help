import { isSite } from "@/lib/learn/types";
import { LearnError } from "@/lib/learn/server/errors";
import { assertSameOrigin, errorResponse, jsonResponse, rateLimit, readJson } from "@/lib/learn/server/http";
import { getLearnService, resolveActor } from "@/lib/learn/server/runtime";

/**
 * Learning API. Every action:
 *  - requires a same-origin JSON POST (CSRF),
 *  - is rate limited per user/IP,
 *  - validates input server-side, and
 *  - checks answers on the server (answer keys never leave it).
 * Signed-in students are identified only by the verified Supabase session.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/learn/[action]">) {
  try {
    assertSameOrigin(request);
    const { action } = await ctx.params;
    const body = await readJson(request);
    if (!isSite(body.site)) throw new LearnError("invalid_site");
    const site = body.site;

    const actor = await resolveActor(body.state);
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "local";
    rateLimit(`${actor.userId ?? ip}:${action}`, action === "attempt" ? 120 : 60, 60_000);

    const svc = getLearnService();
    switch (action) {
      case "state":
        return jsonResponse({ state: await svc.getState(actor, site) });
      case "onboard":
        return jsonResponse({ state: await svc.saveOnboarding(actor, site, body as never) });
      case "diagnostic":
        return jsonResponse(
          await svc.diagnosticStep(actor, site, {
            history: Array.isArray(body.history) ? (body.history as never) : [],
            answer: body.answer && typeof body.answer === "object" ? (body.answer as never) : undefined,
          }),
        );
      case "start": {
        const kind = body.kind;
        if (kind !== "lesson" && kind !== "review" && kind !== "practice") throw new LearnError("invalid_kind");
        return jsonResponse(
          await svc.startSession(actor, site, {
            kind,
            lessonId: typeof body.lessonId === "string" ? body.lessonId : undefined,
            skillId: typeof body.skillId === "string" ? body.skillId : undefined,
          }),
        );
      }
      case "hint":
        return jsonResponse(
          await svc.requestHint(actor, site, {
            questionId: String(body.questionId ?? ""),
            level: Number(body.level),
          }),
        );
      case "attempt":
        return jsonResponse(
          await svc.submitAttempt(actor, site, {
            questionId: String(body.questionId ?? ""),
            sessionId: String(body.sessionId ?? ""),
            answer: body.answer,
            attemptNo: typeof body.attemptNo === "number" ? body.attemptNo : undefined,
            hintsUsed: typeof body.hintsUsed === "number" ? body.hintsUsed : undefined,
            timeMs: typeof body.timeMs === "number" ? body.timeMs : undefined,
            isReview: body.isReview === true,
            seenIds: Array.isArray(body.seenIds) ? body.seenIds.filter((x): x is string => typeof x === "string").slice(0, 60) : [],
          }),
        );
      case "complete":
        return jsonResponse(
          await svc.completeLesson(actor, site, {
            sessionId: String(body.sessionId ?? ""),
            lessonId: String(body.lessonId ?? ""),
            firstTryCorrect: typeof body.firstTryCorrect === "number" ? body.firstTryCorrect : undefined,
          }),
        );
      default:
        throw new LearnError("not_found", 404);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
