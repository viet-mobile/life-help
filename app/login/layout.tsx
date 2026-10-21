import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/i18n/serverText";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("login.title", "login.subtitle");
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
