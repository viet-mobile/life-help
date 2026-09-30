import type { Metadata } from "next";
import { AuthForm } from "@/components/learn/AuthForm";
import { accountsEnabled } from "@/lib/learn/server/runtime";
import { t } from "@/lib/learn/i18n";

export const metadata: Metadata = { title: t("auth.title.login"), robots: { index: false, follow: false } };

export default function Page() {
  return <AuthForm enabled={accountsEnabled()} />;
}
