import { notFound } from "next/navigation";
import { CoursePath } from "@/components/learn/CoursePath";
import { loadContent } from "@/lib/learn/server/runtime";
import { isSite } from "@/lib/learn/types";

export default async function Page({ params }: { params: Promise<{ site: string; courseId: string }> }) {
  const { site, courseId } = await params;
  if (!isSite(site)) notFound();
  const { bundle } = await loadContent(site);
  const course = bundle.catalog.courses.find((c) => c.id === courseId);
  if (!course) notFound();
  return (
    <div className="l-wrap l-wrap-wide">
      <CoursePath course={course} />
    </div>
  );
}
