"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { scopeToGrade } from "@/lib/learn/content/indexer";
import { hasSemesters } from "@/lib/learn/content/semesters";
import { levelsOf } from "@/lib/learn/domain/flow";
import type { Grade } from "@/lib/learn/types";
import { useLearner } from "./LearnerProvider";

/** Start continuous play straight at the level, field (unit) and semester the learner wants - no detour through the course map. */
export function FlowLauncher() {
  const { state, meta, site, t, href, api } = useLearner();
  const router = useRouter();
  const current = (state.profile?.grade ?? levelsOf(site)[0]) as Grade;
  const [level, setLevel] = useState<Grade>(current);
  const [semester, setSemester] = useState<"" | "1" | "2">("");
  const [unit, setUnit] = useState("");
  const [busy, setBusy] = useState(false);
  const units = useMemo(
    () => scopeToGrade(meta, level).catalog.courses.filter((c) => !c.elective).flatMap((c) => c.units.map((u) => ({ id: u.id, title: u.title }))),
    [meta, level],
  );

  const go = async () => {
    setBusy(true);
    try {
      const p = state.profile;
      if (p && level !== p.grade) await api("onboard", { nickname: p.nickname, grade: level, goal: p.goal, avatar: p.avatar });
      const q = new URLSearchParams();
      if (semester) q.set("semester", semester);
      if (unit && units.some((u) => u.id === unit)) q.set("unit", unit);
      router.push(href(`/flow${q.size ? `?${q}` : ""}`));
    } catch {
      setBusy(false);
    }
  };

  return (
    <section className="l-card l-stack" aria-labelledby="fl-h" data-testid="flow-launcher">
      <h2 id="fl-h" className="l-h2">{t("flow.launch.title")}</h2>
      <label className="l-stack" style={{ gap: 4 }}>
        <span className="l-muted">{t("dash.level")}</span>
        <select className="l-input" data-testid="flow-level" value={level} onChange={(e) => { setLevel(e.target.value as Grade); setUnit(""); }}>
          {levelsOf(site).map((g) => <option key={g} value={g}>{t(`grade.${g}` as never)}</option>)}
        </select>
      </label>
      <label className="l-stack" style={{ gap: 4 }}>
        <span className="l-muted">{t("flow.area")}</span>
        <select className="l-input" data-testid="flow-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">{t("flow.all")}</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
        </select>
      </label>
      {hasSemesters(site) && (
        <label className="l-stack" style={{ gap: 4 }}>
          <span className="l-muted">{t("semester.title")}</span>
          <select className="l-input" data-testid="flow-semester" value={semester} onChange={(e) => setSemester(e.target.value as "" | "1" | "2")}>
            <option value="">{t("flow.all")}</option>
            <option value="1">{t("semester.1")}</option>
            <option value="2">{t("semester.2")}</option>
          </select>
        </label>
      )}
      <button className="l-btn l-btn-block" data-testid="flow-go" onClick={go} disabled={busy}>▶ {t("flow.start")}</button>
    </section>
  );
}
