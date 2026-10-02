import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePath } from "@/components/learn/CoursePath";
import { t } from "@/lib/learn/i18n";
import { loadContent } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

export const metadata: Metadata = { title: t("learn.title") };

export default async function Page({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (!isSite(site)) notFound();
  const { bundle } = await loadContent(site);
  return (
    <div className="l-wrap l-wrap-wide l-stack">
      <h1 className="l-h1">🗺️ {t("learn.title")}</h1>
      {bundle.catalog.courses.map((c) => (
        <CoursePath key={c.id} course={c} />
      ))}
    </div>
  );
}
