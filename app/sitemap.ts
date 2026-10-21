import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { originFromHost, localePathSegment } from "@/lib/i18n/seo";
import { isJiuHost } from "@/lib/jiu/brand";
import { services } from "@/lib/services";
import { locales } from "@/messages/registry";

/** The five support landing slugs (app/support/[service]). */
const SUPPORT_SLUGS = ["bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help"] as const;

/** Main public routes for the requesting host. services/* lists the current catalog (everything before the "legacy" block of lib/services.ts). */
export function publicPaths(): string[] {
  const legacyStart = services.findIndex((s) => s.slug === "toilet-clog");
  const current = (legacyStart > 0 ? services.slice(0, legacyStart) : services).map((s) => s.slug);
  return ["/", "/visa", "/privacy", "/terms", ...current.map((s) => `/services/${s}`), ...SUPPORT_SLUGS.map((s) => `/support/${s}`)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const rawHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = rawHost.split(":")[0].toLowerCase();
  if (isJiuHost(rawHost) || /^(tech|chat|sys)\./.test(host)) return [];
  const origin = originFromHost(rawHost) || "https://life.help";
  return publicPaths().map((path) => {
    const suffix = path === "/" ? "" : path;
    return {
      url: `${origin}${path}`,
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${origin}/${localePathSegment(l)}${suffix}`])),
      },
    };
  });
}
