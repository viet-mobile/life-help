import { NextResponse, type NextRequest } from "next/server";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";

export async function GET(request: NextRequest) {
  const host =
    request.nextUrl.searchParams.get("host") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const lang = request.nextUrl.searchParams.get("lang") || undefined;
  const path = request.nextUrl.searchParams.get("path") || "/";

  const details = getDomainShortcutDetails({
    host,
    pathname: path,
    localeOverride: lang,
    searchParams: request.nextUrl.searchParams,
  });

  const encodedFileName = encodeURIComponent(details.suggestedFileName);

  return new NextResponse(details.urlFileContent, {
    status: 200,
    headers: {
      "Content-Type": "application/x-mswinurl; charset=utf-8",
      "Content-Disposition": `attachment; filename="${details.suggestedFileName}"; filename*=UTF-8''${encodedFileName}`,
      "Cache-Control": "no-cache",
    },
  });
}
