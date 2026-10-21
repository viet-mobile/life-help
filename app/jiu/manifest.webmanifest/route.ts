import { isJiuHost, jiuManifest } from "@/lib/jiu/brand";
export function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return Response.json(jiuManifest(!isJiuHost(host)), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" },
  });
}
