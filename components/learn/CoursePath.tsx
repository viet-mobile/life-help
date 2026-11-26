"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildPath } from "@/lib/learn/domain/path";
import type { Course } from "@/lib/learn/types";
import type { LearnLocale } from "@/lib/learn/i18n";
import { currentSemester, hasSemesters, semesterOf, type Semester } from "@/lib/learn/content/semesters";
import { previousLevel } from "@/lib/learn/korean-grades";
import { courseTopic } from "@/lib/learn/korean-bands";
import { BandChip } from "./BandChip";
import { OfficialGradeChip } from "./OfficialGradeChip";
import { useLearner } from "./LearnerProvider";

const SEMESTER_KEY = "learn:semester";

export function CoursePath({ course }: { course: Course }) {
  const { state, index, t, href, access, plan, site, secondaryLocale, secondaryIndex, secondaryIndices = [], secondaryTranslatorsMap = {}, tSecondary, isBilingual } = useLearner();
  const currentCourse = index.bundle?.catalog?.courses?.find((c) => c.id === course.id) || course;
  
  const secCourses: Array<{ locale: LearnLocale; course: Course; t: typeof tSecondary }> = useMemo(() => {
    if (!isBilingual) return [];
    if (secondaryIndices && secondaryIndices.length > 0) {
      return secondaryIndices
        .map((si) => {
          const sc = si.index.bundle?.catalog?.courses?.find((c) => c.id === currentCourse.id);
          const tr = secondaryTranslatorsMap[si.locale] ?? tSecondary;
          return sc ? { locale: si.locale, course: sc, t: tr } : null;
        })
        .filter((x): x is { locale: LearnLocale; course: Course; t: typeof tSecondary } => x !== null);
    }
    if (secondaryIndex) {
      const sc = secondaryIndex.bundle?.catalog?.courses?.find((c) => c.id === currentCourse.id);
      return sc ? [{ locale: (secondaryLocale || "ko") as LearnLocale, course: sc, t: tSecondary }] : [];
    }
    return [];
  }, [isBilingual, secondaryIndices, secondaryIndex, currentCourse.id, secondaryTranslatorsMap, tSecondary, secondaryLocale]);
  const split = hasSemesters(site) && currentCourse.units.some((u) => u.lessons.some((l) => semesterOf(site, l.id) !== 0));
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
  const visible = (id: string) => !split || semesterOf(site, id) === semester;
  const nodes = new Map(buildPath(state, index).map((n) => [n.lessonId, n]));
  // when Premium is switched off (every item Free) the Free / Premium chips would only be noise
  const showTier = plan.courses.some((c) => c.premiumUnits > 0);
  return (
    <section className="l-stack" aria-labelledby={`c-${currentCourse.id}`}>
      <div className="l-card l-card-accent">
        <div style={{ fontSize: "2.4rem" }} aria-hidden="true">{currentCourse.world.emoji}</div>
        <h2 id={`c-${currentCourse.id}`} className="l-h1">
          <div>{currentCourse.world.name}</div>
          {secCourses.map(({ locale: secLoc, course: sc }) => (
            <div key={secLoc || sc.id} style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.85, marginTop: "0.2rem" }}>
              {secCourses.length > 1 && secLoc && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                  {secLoc}
                </span>
              )}
              {sc.world.name}
            </div>
          ))}
        </h2>
        <p>
          <span>{currentCourse.world.tagline} · {currentCourse.title}</span>
          {secCourses.map(({ locale: secLoc, course: sc }) => (
            <span key={secLoc || sc.id} style={{ display: "block", fontSize: "0.9em", opacity: 0.85, marginTop: "0.15rem" }}>
              {secCourses.length > 1 && secLoc && (
                <span className="text-[10px] uppercase font-bold px-1 py-0.5 rounded mr-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                  {secLoc}
                </span>
              )}
              {sc.world.tagline} · {sc.title}
            </span>
          ))}
        </p>
        {site === "korean" && (
          <p className="l-muted" data-testid="course-official">
            <OfficialGradeChip level={course.grade} t={t} />
            {previousLevel(course.grade) && <span> · {t("korean.official.prev", { level: courseTopic(t(`grade.${previousLevel(course.grade)}` as never)) })}</span>}
          </p>
        )}
      </div>
      {split && (
        <div role="tablist" aria-label={t("semester.title")} className="l-options" style={{ gridTemplateColumns: "1fr 1fr" }} data-testid="semester-tabs">
          {([1, 2] as const).map((n) => (
            <button key={n} type="button" role="tab" aria-selected={semester === n} data-selected={semester === n} data-testid={`semester-${n}`} className="l-option" onClick={() => pick(n)}>
              <span>{t(`semester.${n}` as never)}</span>
              {secCourses.map(({ locale: secLoc, t: secT }) => (
                <span key={secLoc} style={{ display: "block", fontSize: "0.8em", opacity: 0.85 }}>
                  
                  {secT(`semester.${n}` as never)}
                </span>
              ))}
            </button>
          ))}
        </div>
      )}
      {split && currentCourse.units.every((u) => u.lessons.every((l) => !visible(l.id))) && <div className="l-panel l-panel-hint" role="status">{t("semester.empty")}</div>}
      {currentCourse.units.map((unit) => {
        return (
          <div key={unit.id} className="l-stack">
            <h3 className="l-h2">
              <div>{t("learn.unit")} · {unit.title}</div>
              {secCourses.map(({ locale: secLoc, course: sc, t: secT }) => {
                const su = sc.units.find((u) => u.id === unit.id);
                if (!su) return null;
                return (
                  <div key={secLoc || sc.id} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginTop: "0.15rem" }}>
                    
                    {secT("learn.unit")} · {su.title}
                  </div>
                );
              })}
            </h3>
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
                      <strong>{lesson.title}</strong>
                      {secCourses.map(({ locale: secLoc, course: sc }) => {
                        const sl = sc.units.find((u) => u.id === unit.id)?.lessons.find((l) => l.id === lesson.id);
                        if (!sl) return null;
                        return (
                          <span key={secLoc || sc.id} style={{ display: "block", fontSize: "0.88em", fontWeight: 400, opacity: 0.85 }}>
                            
                            {sl.title}
                          </span>
                        );
                      })}
                      {site === "korean" && <> <BandChip lessonId={lesson.id} t={t} /></>}
                      
                      {showTier && " "}
                      {showTier && <span className="l-tier" data-tier={tier.toLowerCase()} data-testid={`tier-${lesson.id}`}>{tier === "PARTIAL" ? `${t("premium.free")} + ${t("premium.premium")}` : t(premium ? "premium.premium" : "premium.free")}</span>}
                      <br />
                      <span className="l-muted">
                        {status === "done" ? (
                          <>
                            <span>{node?.placedOut && !node.stars ? t("learn.lesson.placed") : `${"★".repeat(node?.stars ?? 0)}${"☆".repeat(3 - (node?.stars ?? 0))} ${t("learn.lesson.done")}`}</span>
                            {secCourses.map(({ locale: secLoc, t: secT }) => (
                              <span key={secLoc} style={{ opacity: 0.85, marginLeft: "0.3rem" }}>
                                
                                ({secT(node?.placedOut && !node.stars ? "learn.lesson.placed" : "learn.lesson.done")})
                              </span>
                            ))}
                          </>
                        ) : status === "current" ? (
                          <>
                            <span>{t("learn.lesson.current")}</span>
                            {secCourses.map(({ locale: secLoc, t: secT }) => (
                              <span key={secLoc} style={{ opacity: 0.85, marginLeft: "0.3rem" }}>
                                
                                ({secT("learn.lesson.current")})
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            <span>{t("learn.lesson.locked")}</span>
                            {secCourses.map(({ locale: secLoc, t: secT }) => (
                              <span key={secLoc} style={{ opacity: 0.85, marginLeft: "0.3rem" }}>
                                
                                ({secT("learn.lesson.locked")})
                              </span>
                            ))}
                          </>
                        )}
                      </span>
                    </span>
                    {premiumLocked ? (
                      <span className="l-chip">
                        <span>{t("premium.locked")}</span>
                        {secCourses.map(({ locale: secLoc, t: secT }) => (
                          <span key={secLoc} style={{ display: "block", fontSize: "0.75em", opacity: 0.85 }}>
                            
                            {secT("premium.locked")}
                          </span>
                        ))}
                      </span>
                    ) : status !== "locked" && (
                      <span className="l-chip">
                        <span>{status === "done" ? t("learn.lesson.replay") : t("learn.lesson.start")}</span>
                        {secCourses.map(({ locale: secLoc, t: secT }) => (
                          <span key={secLoc} style={{ display: "block", fontSize: "0.75em", opacity: 0.85 }}>
                            
                            {status === "done" ? secT("learn.lesson.replay") : secT("learn.lesson.start")}
                          </span>
                        ))}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={lesson.id}>
                    {premiumLocked ? (
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
        );
      })}
    </section>
  );
}
