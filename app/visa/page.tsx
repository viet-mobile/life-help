import type { Metadata } from "next";
import { VisaFinder } from "@/components/visa/VisaFinder";

export const metadata: Metadata = {
  title: "LIFE.HELP · Visa document guide",
  description: "Documents to prepare and official application links by country and visa type, in your language. Information only.",
};

export default function VisaPage() {
  return <VisaFinder />;
}
