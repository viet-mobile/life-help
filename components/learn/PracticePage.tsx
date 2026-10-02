"use client";

import { useSearchParams } from "next/navigation";
import { LessonRunner } from "./LessonRunner";

/** Review / targeted-practice sessions reuse the lesson runner. */
export function PracticePage() {
  const params = useSearchParams();
  const kind = params.get("kind") === "review" ? "review" : "practice";
  const skill = params.get("skill") ?? undefined;
  return <LessonRunner kind={kind} skillId={skill} />;
}
