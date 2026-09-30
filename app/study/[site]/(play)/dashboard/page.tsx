import type { Metadata } from "next";
import { Dashboard } from "@/components/learn/Dashboard";
import { t } from "@/lib/learn/i18n";

export const metadata: Metadata = { title: t("nav.home") };
export default function Page() {
  return <Dashboard />;
}
