import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChatProvider } from "@/lib/chat/ChatContext";
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
  const portalMeta = getPortalMetadata("chat", lang);
  return {
    ...portalMeta,
    icons: getIconMetadata(country),
  };
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>;
}
