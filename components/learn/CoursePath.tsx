"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildPath } from "@/lib/learn/domain/path";
import type { Course } from "@/lib/learn/types";
import { currentSemester, hasSemesters, semesterOf, type Semester } from "@/lib/learn/content/semesters";
import { previousLevel } from "@/lib/learn/korean-grades";
import { OfficialGradeChip } from "./OfficialGradeChip";
import { useLearner } from "./LearnerProvider";

const SEMESTER_KEY = "learn:semester";

export function CoursePath({ course }: { course: Course }) {
  const { state, index, t, href, access, plan, site } = useLearner();
  const split = hasSemesters(site) && course.units.some((u) => u.lessons.some((l) => semesterOf(site, l.id) !== 0));
  // first paint is semester 1 (same on server and client); the effect then picks the remembered / current semester
  const [semester, setSemester] = useState<1 | 2>(1);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(SEMESTER_KEY); } catch { /* storage unavailable */ }
    setSemester(saved === "1" ? 1 : saved === "2" ? 2 : currentSemester());
  }, []);
  const pick = (n: 1 | 2) => {
    setSemester(n);
    try { window.localStorage.setItem(SEMESTER_KEY, String(n)); } catch { /* storage unavailable */ }
  };
  const visible = (id: string) => !split || ((semesterOf(site, id) as Semester) === 0 || semesterOf(site, id) === semester);
  const nodes = new Map(buildPath(state, index).map((n) => [n.lessonId, n]));
  // when Premium is switched off (every item Free) the Free / Premium chips would only be noise
  const showTier = plan.courses.some((c) => c.premiumUnits > 0);
  return (
    <section className="l-stack" aria-labelledby={`c-${course.id}`}>
      <div className="l-card l-card-accent">
        <div style={{ fontSize: "2.4rem" }} aria-hidden="true">{course.world.emoji}</div>
        <h2 id={`c-${course.id}`} className="l-h1">{course.world.name}</h2>
        <p>{course.world.tagline} · {course.title}</p>
        {site === "korean" && (
          <p className="l-muted" data-testid="course-official">
            <OfficialGradeChip level={course.grade} t={t} />
            {previousLevel(course.grade) && <span> · {t("korean.official.prev", { level: t(`grade.${previousLevel(course.grade)}` as never) })}</span>}
          </p>
        )}
      </div>
      {split && (
        <div role="tablist" aria-label={t("semester.title")} className="l-options" style={{ gridTemplateColumns: "1fr 1fr" }} data-testid="semester-tabs">
          {([1, 2] as const).map((n) => (
            <button key={n} type="button" role="tab" aria-selected={semester === n} data-selected={semester === n} data-testid={`semester-${n}`} className="l-option" onClick={() => pick(n)}>
              {t(`semester.${n}` as never)}
            </button>
          ))}
        </div>
      )}
      {split && course.units.every((u) => u.lessons.every((l) => !visible(l.id))) && <div className="l-panel l-panel-hint" role="status">{t("semester.empty")}</div>}
      {course.units.map((unit) => (
        <div key={unit.id} className="l-stack">
          <h3 className="l-h2">{t("learn.unit")} · {unit.title}</h3>
          <ol className="l-path">
            {unit.lessons.filter((lesson) => visible(lesson.id)).map((lesson) => {
              const node = nodes.get(lesson.id);
              const tier = plan.lessonTier.get(lesson.id) ?? "PREMIUM";
              const premium = tier !== "FREE";
              const premiumLocked = tier === "PREMIUM" && access.tier !== "PREMIUM";
              const status = node?.status ?? "locked";
              const icon = premiumLocked ? "💎" : status === "done" ? "✅" : status === "current" ? "▶️" : "🔒";
              const inner = (
                <>
                  <span className="l-node-ico" aria-hidden="true">{icon}</span>
                  <span style={{ flex: 1 }}>
                    <strong>{lesson.title}</strong>{split && semesterOf(site, lesson.id) === 0 && <span className="l-muted"> · {t("semester.shared")}</span>}{showTier && " "}
                    {showTier && <span className="l-tier" data-tier={tier.toLowerCase()} data-testid={`tier-${lesson.id}`}>{tier === "PARTIAL" ? `${t("premium.free")} + ${t("premium.premium")}` : t(premium ? "premium.premium" : "premium.free")}</span>}
                    <br />
                    <span className="l-muted">
                      {status === "done" ? (node?.placedOut && !node.stars ? t("learn.lesson.placed") : `${"★".repeat(node?.stars ?? 0)}${"☆".repeat(3 - (node?.stars ?? 0))} ${t("learn.lesson.done")}`) : status === "current" ? t("learn.lesson.current") : t("learn.lesson.locked")}
                    </span>
                  </span>
                  {premiumLocked ? <span className="l-chip">{t("premium.locked")}</span> : status !== "locked" && <span className="l-chip">{status === "done" ? t("learn.lesson.replay") : t("learn.lesson.start")}</span>}
                </>
              );
              return (
                <li key={lesson.id}>
                  {premiumLocked ? (
                    // a premium lesson opens the lesson page, which shows why it is locked (the server sends no lesson content)
                    <Link className="l-node" data-status="premium" href={href(`/lesson/${lesson.id}`)}>{inner}</Link>
                  ) : status === "locked" ? (
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
