import type { Metadata } from "next";
import { QuestPage } from "@/components/learn/QuestPage";
import { getServerT } from "@/lib/learn/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("quest.title") };
}

export default function Page() {
  return <QuestPage />;
}
