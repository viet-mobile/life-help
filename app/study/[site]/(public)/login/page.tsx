import type { Metadata } from "next";
import { AuthForm } from "@/components/learn/AuthForm";
import { accountsEnabled } from "@/lib/learn/server/runtime";
import { getServerT } from "@/lib/learn/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("auth.title.login"), robots: { index: false, follow: false } };
}

export default function Page() {
  return <AuthForm enabled={accountsEnabled()} />;
}
