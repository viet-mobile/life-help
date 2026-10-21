import { isJiuHost, jiuManifest } from "@/lib/jiu/brand";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getDomainShortcutDetails } from "@/lib/shortcut/desktopShortcut";
import { parseLearnHost } from "@/lib/learn/hosts";
import { createTranslator } from "@/lib/learn/i18n";
import { loadMessages } from "@/lib/learn/i18n/catalog";
import { siteConfig } from "@/lib/learn/sites";

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

  if (isJiuHost(host)) return jiuManifest();

  // math.life.help / english.life.help / study.korean.life.help ship their own installable identity (in the site's default locale).
  const learn = parseLearnHost(host);
  if (learn) {
    const cfg = siteConfig(learn.site);
    const t = createTranslator(await loadMessages(cfg.defaultLocale));
    return {
      name: t(cfg.brandKey),
      short_name: t(`site.${learn.site}.name`),
      description: t(`site.${learn.site}.description`),
      start_url: "/dashboard",
      scope: "/",
      id: `/${learn.site}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: cfg.themeColor,
      lang: cfg.defaultLocale,
      icons: [
        { src: `/logos/favicon-${learn.site}.png`, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: `/logos/logo-${learn.site}.png`, sizes: "512x512", type: "image/png", purpose: "any" },
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
