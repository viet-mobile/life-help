import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/learn/LessonRunner";
import { loadIndex } from "@/lib/learn/content/repository";
import { isSite } from "@/lib/learn/types";

export default async function Page({ params }: { params: Promise<{ site: string; lessonId: string }> }) {
  const { site, lessonId } = await params;
  if (!isSite(site)) notFound();
  const { index } = await loadIndex(site);
  if (!index.lessons.has(lessonId)) notFound();
  return <LessonRunner kind="lesson" lessonId={lessonId} />;
}
