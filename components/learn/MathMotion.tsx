"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLearner } from "@/components/learn/LearnerProvider";

type Labels = { brand: string; intro: string };
function useMotionLabels() {
  const { locale } = useLearner();
  const [labels, setLabels] = useState<Labels | null>(null);
  useEffect(() => {
    let active = true;
    setLabels(null);
    (async () => {
      const index = await fetch("/math-motion/i18n/public/index.json?v=redball-20261021").then(r => { if (!r.ok) throw Error("index"); return r.json(); });
      const record = index.locales[locale];
      if (!record) return;
      const bytes = await fetch("/math-motion/" + record.path).then(r => { if (!r.ok) throw Error("pack"); return r.arrayBuffer(); });
      const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(n => n.toString(16).padStart(2, "0")).join("");
      if (digest !== record.sha256) throw Error("integrity");
      const pack = JSON.parse(new TextDecoder().decode(bytes));
      if (pack.sourceCatalogSHA256 !== index.sourceCatalogSHA256) throw Error("source");
      const brand = pack.values[index.ui.brand], intro = pack.values[index.ui.intro];
      if (typeof brand !== "string" || typeof intro !== "string") throw Error("labels");
      if (active) setLabels({ brand, intro });
    })().catch(() => {});
    return () => { active = false; };
  }, [locale]);
  return labels;
}

export function MathMotionEntry() {
  const { site, href } = useLearner();
  const labels = useMotionLabels();
  if (site !== "math" || !labels) return null;
  return <Link className="l-card l-stack" href={href("/motion")} data-testid="math-motion-entry" style={{ textDecoration: "none", color: "inherit" }}><h2 className="l-h2">▶ {labels.brand}</h2><p className="l-muted">{labels.intro}</p></Link>;
}

export function MathMotion() {
  const { locale, state } = useLearner();
  const labels = useMotionLabels();
  const query = new URLSearchParams({ lang: locale });
  if (state.profile?.grade) query.set("grade", state.profile.grade);
  return <iframe title={labels?.brand ?? "MATH.LIFE.HELP"} src={`/math-motion/index.html?v=redball-20261021&${query}`} style={{ width: "100%", minHeight: "85dvh", border: 0, borderRadius: 16 }} allow="fullscreen" />;
}
