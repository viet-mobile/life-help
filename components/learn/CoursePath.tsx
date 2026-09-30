"use client";

import Link from "next/link";
import { buildPath } from "@/lib/learn/domain/path";
import type { Course } from "@/lib/learn/types";
import { useLearner } from "./LearnerProvider";

export function CoursePath({ course }: { course: Course }) {
  const { state, index, t, href } = useLearner();
  const nodes = new Map(buildPath(state, index).map((n) => [n.lessonId, n]));
  return (
    <section className="l-stack" aria-labelledby={`c-${course.id}`}>
      <div className="l-card l-card-accent">
        <div style={{ fontSize: "2.4rem" }} aria-hidden="true">{course.world.emoji}</div>
        <h2 id={`c-${course.id}`} className="l-h1">{course.world.name}</h2>
        <p>{course.world.tagline} · {course.title}</p>
      </div>
      {course.units.map((unit) => (
        <div key={unit.id} className="l-stack">
          <h3 className="l-h2">{t("learn.unit")} · {unit.title}</h3>
          <ol className="l-path">
            {unit.lessons.map((lesson) => {
              const node = nodes.get(lesson.id);
              const status = node?.status ?? "locked";
              const icon = status === "done" ? "✅" : status === "current" ? "▶️" : "🔒";
              const inner = (
                <>
                  <span className="l-node-ico" aria-hidden="true">{icon}</span>
                  <span style={{ flex: 1 }}>
                    <strong>{lesson.title}</strong>
                    <br />
                    <span className="l-muted">
                      {status === "done" ? (node?.placedOut && !node.stars ? t("learn.lesson.placed") : `${"★".repeat(node?.stars ?? 0)}${"☆".repeat(3 - (node?.stars ?? 0))} ${t("learn.lesson.done")}`) : status === "current" ? t("learn.lesson.current") : t("learn.lesson.locked")}
                    </span>
                  </span>
                  {status !== "locked" && <span className="l-chip">{status === "done" ? t("learn.lesson.replay") : t("learn.lesson.start")}</span>}
                </>
              );
              return (
                <li key={lesson.id}>
                  {status === "locked" ? (
                    <div className="l-node" data-status={status} aria-disabled="true">{inner}</div>
                  ) : (
                    <Link className="l-node" data-status={status} href={href(`/lesson/${lesson.id}`)}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
