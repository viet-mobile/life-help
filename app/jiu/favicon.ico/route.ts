import { JIU_FAVICONS } from "@/lib/jiu/faviconData";
export function GET() {
  return new Response(Uint8Array.from(atob(JIU_FAVICONS.jiu), c => c.charCodeAt(0)), {
    headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=3600" },
  });
}
