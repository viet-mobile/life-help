import type { Metadata } from "next";
import { services } from "@/lib/services";
import { pageMetadata } from "@/lib/i18n/serverText";
import { dictionaries } from "@/messages";

/** Title / description from the service's own dictionary keys; an unknown slug keeps the generic site title (the page renders its own not-found state). */
export async function serviceMetadata(slug: string): Promise<Metadata> {
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  const hasDesc = service.key in (dictionaries.en.serviceDesc as Record<string, string>);
  return pageMetadata(`service.${service.key}`, hasDesc ? `serviceDesc.${service.key}` : "system.servicesDesc");
}
