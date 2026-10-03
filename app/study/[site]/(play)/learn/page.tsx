import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnWorld } from "@/components/learn/LearnWorld";
import { getServerT } from "@/lib/learn/i18n/server";
import { isSite } from "@/lib/learn/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("learn.title") };
}

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  return <LearnWorld />;
}
