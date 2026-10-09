import { NextResponse } from "next/server";
import { locales } from "@/messages";
import { resolveTranslator } from "@/lib/service/runtime";

/**
 * Machine translation endpoint. Contract (changed on purpose):
 *   request  { text, from, to }   (also accepted: sourceLang / targetLang) - the SOURCE language is required, never guessed
 *   success  { ok: true,  translatedText, provider, originalText, sourceLang, targetLang }
 *   failure  { ok: false, reason, originalText }   - NO translatedText: a failed translation is never presented as a translation
 * (It used to assume English when no source was given and answered with a canned phrase or the unchanged text on failure.)
 */
const MAX_LENGTH = 500;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const from = String(body.from ?? body.sourceLang ?? "");
  const to = String(body.to ?? body.targetLang ?? "");
  if (!text) return NextResponse.json({ ok: false, reason: "empty", originalText: "" }, { status: 400 });
  if (text.length > MAX_LENGTH) return NextResponse.json({ ok: false, reason: "too_long", originalText: text }, { status: 413 });
  if (!(locales as readonly string[]).includes(from) || !(locales as readonly string[]).includes(to)) {
    return NextResponse.json({ ok: false, reason: "language_required", originalText: text }, { status: 400 });
  }
  if (from === to) return NextResponse.json({ ok: true, translatedText: text, provider: "same-language", originalText: text, sourceLang: from, targetLang: to });
  const result = await resolveTranslator().translate(text, from, to);
  if (!result.ok) return NextResponse.json({ ok: false, reason: result.reason, originalText: text }, { status: 200 });
  return NextResponse.json({ ok: true, translatedText: result.text, provider: result.provider, originalText: text, sourceLang: from, targetLang: to });
}
