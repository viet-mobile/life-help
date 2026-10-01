import type { Metadata } from "next";
import { QuestPage } from "@/components/learn/QuestPage";
import { t } from "@/lib/learn/i18n";

export const metadata: Metadata = { title: t("quest.title") };
export default function Page() {
  return <QuestPage />;
}
