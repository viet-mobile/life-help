import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flashcards } from "@/components/learn/Flashcards";
import { getServerT } from "@/lib/learn/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getServerT()).t("words.title") };
}

/** Saved words / flashcards: an ENGLISH-site page (the math site has no vocabulary). */
export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (site !== "english") notFound();
  return <Flashcards />;
}
