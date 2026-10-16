"use client";

import { useSearchParams } from "next/navigation";
import { isReviewMode } from "@/lib/learn/reviewModes";
import { LessonRunner } from "./LessonRunner";

/** Review / targeted-practice sessions reuse the lesson runner. */
export function PracticePage() {
  const params = useSearchParams();
  const kind = params.get("kind") === "review" ? "review" : "practice";
  const skill = params.get("skill") ?? undefined;
  const m = params.get("mode");
  return <LessonRunner kind={kind} skillId={skill} mode={isReviewMode(m) ? m : undefined} />;
}
