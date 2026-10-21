import type { Metadata } from "next";
import { LegalLinksFooter } from "@/components/shared/LegalLinksFooter";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/i18n/serverText";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("request.title", "system.requestDesc");
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}<LegalLinksFooter /></>;
}
