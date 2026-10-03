import type { Metadata } from "next";
import { Dashboard } from "@/components/learn/Dashboard";
import { getServerT } from "@/lib/learn/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("nav.home") };
}

export default function Page() {
  return <Dashboard />;
}
