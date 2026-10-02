import { LEARN_FAVICONS } from "@/lib/learn/faviconData";

// math.life.help / english.life.help `/favicon.ico` (proxy.ts rewrites to this route). The bytes are embedded: the Worker serves
// `/favicon.ico` Worker-first and has no access to public/ files.
export async function GET(_request: Request, { params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const encoded = Object.prototype.hasOwnProperty.call(LEARN_FAVICONS, site) ? LEARN_FAVICONS[site] : null;
  if (!encoded) return new Response("Not found", { status: 404 });
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=3600" },
  });
}
