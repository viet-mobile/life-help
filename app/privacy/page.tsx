import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "개인정보처리방침 · Privacy Policy | LIFE.HELP" };

export default function PrivacyPage() {
  return <LegalPage kind="privacy" other={{ href: "/terms", label: "이용약관 · Terms" }} />;
}
