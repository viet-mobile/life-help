import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/learn/LessonRunner";
import { loadContent } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

export default async function Page({ params }: { params: Promise<{ site: string; lessonId: string }> }) {
  const { site, lessonId } = await params;
  if (!isSite(site)) notFound();
  const { index } = await loadContent(site);
  if (!index.lessons.has(lessonId)) notFound();
  return <LessonRunner kind="lesson" lessonId={lessonId} />;
}
