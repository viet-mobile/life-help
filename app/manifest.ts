import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let host = "";
  try {
    const headersList = await headers();
    host =
      headersList.get("x-forwarded-host") ??
      headersList.get("host") ??
      "";
  } catch {
    // ignore
  }

  const details = getDomainShortcutDetails({
    host,
    pathname: "/",
  });

  return {
    name: details.title,
    short_name: details.shortName,
    description: details.description,
    start_url: details.canonicalUrl,
    scope: "/",
    id: details.canonicalUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e3a8a",
    lang: details.lang,
    icons: [
      {
        src: details.iconPngUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: details.iconPngUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: details.iconIcoUrl,
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
