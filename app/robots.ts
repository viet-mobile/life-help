import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { originFromHost } from "@/lib/i18n/seo";
import { isJiuHost } from "@/lib/jiu/brand";

/** Paths that are never meant to be crawled: staff/technician consoles, APIs, personal or token-bearing pages, the private journal. */
export const PRIVATE_PATHS = ["/admin", "/api/", "/tech/workspace", "/tech/contract", "/jiu", "/chat", "/login", "/auth/", "/payment", "/sys", "/study", "/think-pilot"] as const;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = rawHost.split(":")[0].toLowerCase();
  const portalHost = /^(tech|chat|sys)\./.test(host);
  // Private journal and staff/technician/chat portal hosts: nothing to index.
  if (isJiuHost(rawHost) || portalHost) return { rules: { userAgent: "*", disallow: "/" } };

  const origin = originFromHost(rawHost) || "https://life.help";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
