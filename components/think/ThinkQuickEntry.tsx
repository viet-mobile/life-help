"use client";

import Link from "next/link";
import { useState } from "react";
import { useLearner } from "../learn/LearnerProvider";
import { siteConfig } from "@/lib/learn/sites";
import { thinkLangFor } from "@/lib/think/lang";
import { fieldInfo, fieldList } from "@/lib/think/areas";
import { hasThinkSemesters } from "@/lib/think/semesters";
import { gradeLabel } from "@/lib/think/grades";
import { KOREAN_LEVELS, isLevelCode, levelCode, levelName, priorLevelFor } from "@/lib/think/korean-levels";
import { ELECTIVE_NAMES, hubLabels } from "./hubLabels";

/** Main-screen shortcut into the thinking hub: pick grade, semester (math) and field, then go. The hub reads ?grade= &semester= &field=. */
export function ThinkQuickEntry() {
  const { site, state, locale, href, t, isBilingual, secondaryTranslators } = useLearner();
  const lang = thinkLangFor(locale, site);
  const H = hubLabels(t);
  const ownGrade = (state.profile?.grade ?? siteConfig(site).levels[0]) as string;
  const own = site === "korean" ? levelCode(priorLevelFor(ownGrade)) : ownGrade;
  const [grade, setGrade] = useState<string>(own);
  const [semester, setSemester] = useState("all");
  const [field, setField] = useState("all");
  const grades = site === "korean" ? KOREAN_LEVELS.map(levelCode) : [...siteConfig(site).levels, ...(site === "math" ? Object.keys(ELECTIVE_NAMES) : [])];
  const fields = fieldList(site);
  const isElective = grade.startsWith("EL-");
  const q = new URLSearchParams({ grade });
  if (hasThinkSemesters(site) && !isElective && semester !== "all") q.set("semester", semester);
  if (field !== "all") q.set("field", field);
  return (
    <section className="l-card l-stack" aria-labelledby="think-quick-h" data-testid="think-quick">
      <h2 id="think-quick-h" className="l-h2">
        <div>🧠 {H.title} · {H.quick}</div>
        {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
          <div key={secLoc} style={{ fontSize: "0.8em", fontWeight: 400, opacity: 0.85, marginTop: "0.2rem" }}>
            🧠 {hubLabels(secT).title} · {hubLabels(secT).quick}
          </div>
        ))}
      </h2>
      <div className="l-stack" style={{ gap: 8 }}>
        <label className="l-stack" style={{ gap: 4 }}>
          <span className="l-muted">
            {H.grade}
            {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).grade).join(" / ")})`}
          </span>
          <select className="l-input" data-testid="think-quick-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {grades.map((g) => {
              const pri = g.startsWith("EL-") ? `${H.electives}: ${ELECTIVE_NAMES[g][lang]}` : isLevelCode(g) ? levelName(Number(g.slice(1)), lang) : gradeLabel(g, lang);
              const sec = isBilingual && secondaryTranslators && secondaryTranslators.length > 0
                ? " / " + secondaryTranslators.map((s) => {
                    const secLang = thinkLangFor(s.locale, site);
                    return g.startsWith("EL-") ? `${hubLabels(s.t).electives}: ${ELECTIVE_NAMES[g][secLang]}` : isLevelCode(g) ? levelName(Number(g.slice(1)), secLang) : gradeLabel(g, secLang);
                  }).join(" / ")
                : "";
              return <option key={g} value={g}>{pri}{sec}</option>;
            })}
          </select>
        </label>
        {hasThinkSemesters(site) && !isElective && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">
              {t("semester.title")}
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => s.t("semester.title")).join(" / ")})`}
            </span>
            <select className="l-input" data-testid="think-quick-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="all">
                {H.allSemesters}
                {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).allSemesters).join(" / ")})`}
              </option>
              <option value="1">
                {t("semester.1")}
                {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => s.t("semester.1")).join(" / ")})`}
              </option>
              <option value="2">
                {t("semester.2")}
                {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => s.t("semester.2")).join(" / ")})`}
              </option>
            </select>
          </label>
        )}
        {fields.length > 0 && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">
              {H.field}
              {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).field).join(" / ")})`}
            </span>
            <select className="l-input" data-testid="think-quick-field" value={field} onChange={(e) => setField(e.target.value)}>
              <option value="all">
                {H.allFields}
                {isBilingual && secondaryTranslators && secondaryTranslators.length > 0 && ` (${secondaryTranslators.map((s) => hubLabels(s.t).allFields).join(" / ")})`}
              </option>
              {fields.map((f) => {
                const pri = fieldInfo(site, f, lang).full;
                const sec = isBilingual && secondaryTranslators && secondaryTranslators.length > 0
                  ? " / " + secondaryTranslators.map((s) => fieldInfo(site, f, thinkLangFor(s.locale, site)).full).join(" / ")
                  : "";
                return <option key={f} value={f}>{pri}{sec}</option>;
              })}
            </select>
          </label>
        )}
      </div>
      <Link className="l-btn l-btn-block" data-testid="think-quick-go" href={href(`/think?${q.toString()}`)}>
        <span>{H.enter}</span>
        {isBilingual && secondaryTranslators && secondaryTranslators.map(({ locale: secLoc, t: secT }) => (
          <span key={secLoc} style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.4rem" }}>
            · {hubLabels(secT).enter}
          </span>
        ))}
      </Link>
    </section>
  );
}
