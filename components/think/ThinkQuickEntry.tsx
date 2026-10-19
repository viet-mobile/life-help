"use client";

import Link from "next/link";
import { useState } from "react";
import { useLearner } from "../learn/LearnerProvider";
import { siteConfig } from "@/lib/learn/sites";
import { thinkLangFor } from "@/lib/think/lang";
import { fieldInfo, fieldList } from "@/lib/think/areas";
import { hasThinkSemesters } from "@/lib/think/semesters";
import { gradeLabel } from "@/lib/think/grades";
import { ELECTIVE_NAMES, HUB } from "./hubLabels";

/** Main-screen shortcut into the thinking hub: pick grade, semester (math) and field, then go. The hub reads ?grade= &semester= &field=. */
export function ThinkQuickEntry() {
  const { site, state, locale, href, t } = useLearner();
  const lang = thinkLangFor(locale, site);
  const H = HUB[lang];
  const own = (state.profile?.grade ?? siteConfig(site).levels[0]) as string;
  const [grade, setGrade] = useState<string>(own);
  const [semester, setSemester] = useState("all");
  const [field, setField] = useState("all");
  const grades = [...siteConfig(site).levels, ...(site === "math" ? Object.keys(ELECTIVE_NAMES) : [])];
  const fields = fieldList(site);
  const isElective = grade.startsWith("EL-");
  const q = new URLSearchParams({ grade });
  if (hasThinkSemesters(site) && !isElective && semester !== "all") q.set("semester", semester);
  if (field !== "all") q.set("field", field);
  return (
    <section className="l-card l-stack" aria-labelledby="think-quick-h" data-testid="think-quick">
      <h2 id="think-quick-h" className="l-h2">🧠 {H.title} · {H.quick}</h2>
      <div className="l-stack" style={{ gap: 8 }}>
        <label className="l-stack" style={{ gap: 4 }}>
          <span className="l-muted">{H.grade}</span>
          <select className="l-input" data-testid="think-quick-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {grades.map((g) => <option key={g} value={g}>{g.startsWith("EL-") ? `${H.electives}: ${ELECTIVE_NAMES[g][lang]}` : gradeLabel(g, lang)}</option>)}
          </select>
        </label>
        {hasThinkSemesters(site) && !isElective && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">{t("semester.title")}</span>
            <select className="l-input" data-testid="think-quick-semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="all">{H.allSemesters}</option>
              <option value="1">{t("semester.1")}</option>
              <option value="2">{t("semester.2")}</option>
            </select>
          </label>
        )}
        {fields.length > 0 && (
          <label className="l-stack" style={{ gap: 4 }}>
            <span className="l-muted">{H.field}</span>
            <select className="l-input" data-testid="think-quick-field" value={field} onChange={(e) => setField(e.target.value)}>
              <option value="all">{H.allFields}</option>
              {fields.map((f) => <option key={f} value={f}>{fieldInfo(site, f, lang).full}</option>)}
            </select>
          </label>
        )}
      </div>
      <Link className="l-btn l-btn-block" data-testid="think-quick-go" href={href(`/think?${q.toString()}`)}>{H.enter}</Link>
    </section>
  );
}
