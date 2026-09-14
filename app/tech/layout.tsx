import type { Metadata } from "next";
import { headers } from "next/headers";
import { HelperProvider } from "@/lib/helper/HelperContext";
import {
  getPortalMetadata,
  resolveLanguageFromHeaders,
  resolveCountryFromHeaders,
  getIconMetadata,
} from "@/lib/i18n/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const lang = resolveLanguageFromHeaders(headersList);
  const country = resolveCountryFromHeaders(headersList);
  const portalMeta = getPortalMetadata("tech", lang);
  return {
    ...portalMeta,
    icons: getIconMetadata(country),
  };
}

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <HelperProvider>{children}</HelperProvider>;
}
