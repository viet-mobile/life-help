import type { Metadata } from "next";
import { VisaFinder } from "@/components/visa/VisaFinder";
import { pageMetadata } from "@/lib/i18n/serverText";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("visa.title", "visa.subtitle");
}

export default function VisaPage() {
  return <VisaFinder />;
}
