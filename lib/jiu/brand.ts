import type { Metadata, MetadataRoute } from "next";
export const JIU_TITLE = "JIU · 나의 배움 일지";
export const JIU_DESCRIPTION = "매일의 배움이 나만의 이야기로";
export const JIU_ORIGIN = "https://jiu.life.help";
const VERSION = "jiu-1";
export function isJiuHost(rawHost: string) {
  return ["jiu.life.help", "jiu.localhost"].includes(rawHost.split(":")[0].toLowerCase().trim());
}
export const jiuMetadata: Metadata = {
  metadataBase: new URL(JIU_ORIGIN),
  title: { absolute: JIU_TITLE },
  description: JIU_DESCRIPTION,
  applicationName: JIU_TITLE,
  manifest: `/jiu/manifest.webmanifest?v=${VERSION}`,
  icons: {
    icon: [
      { url: `/logos/favicon-jiu.ico?v=${VERSION}`, sizes: "any", type: "image/x-icon" },
      { url: `/logos/favicon-jiu-32.png?v=${VERSION}`, sizes: "32x32", type: "image/png" },
      { url: `/logos/favicon-jiu.png?v=${VERSION}`, sizes: "192x192", type: "image/png" },
    ],
    shortcut: `/logos/favicon-jiu.ico?v=${VERSION}`,
    apple: { url: `/logos/apple-touch-icon-jiu.png?v=${VERSION}`, sizes: "180x180", type: "image/png" },
  },
  appleWebApp: { title: JIU_TITLE, capable: true, statusBarStyle: "default" },
  openGraph: { title: JIU_TITLE, description: JIU_DESCRIPTION, siteName: JIU_TITLE, url: JIU_ORIGIN, locale: "ko_KR", type: "website", images: [{ url: "/logos/logo-jiu.png", width: 512, height: 512, alt: JIU_TITLE }] },
  twitter: { card: "summary", title: JIU_TITLE, description: JIU_DESCRIPTION, images: ["/logos/logo-jiu.png"] },
  robots: { index: false, follow: false },
};
export function jiuManifest(local = false): MetadataRoute.Manifest {
  const start = local ? "/jiu" : "/";
  return {
    name: JIU_TITLE,
    short_name: "JIU",
    description: JIU_DESCRIPTION,
    id: start,
    start_url: start,
    scope: local ? "/jiu" : "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#253b35",
    lang: "ko",
    icons: [
      { src: `/logos/favicon-jiu.png?v=${VERSION}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/logos/logo-jiu.png?v=${VERSION}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/logos/maskable-jiu.png?v=${VERSION}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
