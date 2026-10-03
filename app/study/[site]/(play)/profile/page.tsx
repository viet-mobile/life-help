import type { Metadata } from "next";
import { ProfilePage } from "@/components/learn/ProfilePage";
import { getServerT } from "@/lib/learn/i18n/server";
import { signOutAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("profile.title") };
}

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  return <ProfilePage signOutAction={signOutAction.bind(null, site)} />;
}
