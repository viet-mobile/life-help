import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "이용약관 · Terms of Service | LIFE.HELP" };

export default function TermsPage() {
  return <LegalPage kind="terms" other={{ href: "/privacy", label: "개인정보처리방침 · Privacy" }} />;
}
