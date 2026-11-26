import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KoreanStandardsView } from "@/components/standards/KoreanStandardsView";

export const metadata: Metadata = {
  title: "한국어 표준어 규정 전체 · Standard Korean Norms | LIFE.HELP",
  description: "대한민국 국립국어원 표준어 사정 원칙(26항) 및 표준 발음법(30항) 공식 규정 다국어 병기 포털",
};

export default async function StandardsPage({
  params,
}: {
  params: Promise<{ site: string }>;
}) {
  const { site } = await params;
  if (site !== "korean") {
    notFound();
  }

  return <KoreanStandardsView />;
}
