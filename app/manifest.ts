import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";
import { parseLearnHost } from "@/lib/learn/hosts";
import { t } from "@/lib/learn/i18n";

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

  // math.life.help / english.life.help ship their own installable identity.
  const learn = parseLearnHost(host);
  if (learn) {
    const name = learn.site === "math" ? t("brand.math") : t("brand.english");
    return {
      name,
      short_name: learn.site === "math" ? t("site.math.name") : t("site.english.name"),
      description: t(learn.site === "math" ? "site.math.description" : "site.english.description"),
      start_url: "/dashboard",
      scope: "/",
      id: `/${learn.site}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: learn.site === "math" ? "#4f46e5" : "#059669",
      lang: "ko",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    };
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
    theme_color: "#000000",
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
        src: details.iconPngUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: details.iconIcoUrl,
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
