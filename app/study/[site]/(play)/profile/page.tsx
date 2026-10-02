import type { Metadata } from "next";
import { ProfilePage } from "@/components/learn/ProfilePage";
import { t } from "@/lib/learn/i18n";
import { signOutAction } from "../../actions";

export const metadata: Metadata = { title: t("profile.title") };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  return <ProfilePage signOutAction={signOutAction.bind(null, site)} />;
}
