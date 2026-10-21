"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLearner } from "@/components/learn/LearnerProvider";

type Labels = { brand: string; intro: string };

function useMotionLabels() {
  const { locale } = useLearner();
  const [labels, setLabels] = useState<Labels | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLabels(null);
    setError(false);

    void (async () => {
      try {
        const indexResponse = await fetch("/math-motion/i18n/public/index.json");
        if (!indexResponse.ok) throw new Error(`Motion locale index returned ${indexResponse.status}`);
        const index = await indexResponse.json();
        const record = index.locales[locale];
        if (!record) throw new Error(`No motion translation is available for ${locale}`);

        const packResponse = await fetch(`/math-motion/${record.path}`);
        if (!packResponse.ok) throw new Error(`Motion translation pack returned ${packResponse.status}`);
        const bytes = await packResponse.arrayBuffer();
        const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
          .map((value) => value.toString(16).padStart(2, "0"))
          .join("");
        if (digest !== record.sha256) throw new Error(`Motion translation integrity check failed for ${locale}`);

        const pack = JSON.parse(new TextDecoder().decode(bytes));
        if (pack.sourceCatalogSHA256 !== index.sourceCatalogSHA256) throw new Error("Motion translation source catalog mismatch");
        const brand = pack.values[index.ui.brand];
        const intro = pack.values[index.ui.intro];
        if (typeof brand !== "string" || typeof intro !== "string") throw new Error(`Motion labels are incomplete for ${locale}`);
        if (active) setLabels({ brand, intro });
      } catch (cause) {
        if (!active) return;
        console.error("Failed to load localized math motion labels", cause);
        setError(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [locale]);

  return { labels, error };
}

export function MathMotionEntry() {
  const { site, href } = useLearner();
  const { labels, error } = useMotionLabels();
  if (site !== "math") return null;
  if (error) return <p role="alert">Math motion videos are temporarily unavailable.</p>;
  if (!labels) return null;

  return (
    <Link
      className="l-card l-stack"
      href={href("/motion")}
      data-testid="math-motion-entry"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <h2 className="l-h2">▶ {labels.brand}</h2>
      <p className="l-muted">{labels.intro}</p>
    </Link>
  );
}

export function MathMotion() {
  const { locale, state } = useLearner();
  const { labels } = useMotionLabels();
  const query = new URLSearchParams({ lang: locale });
  if (state.profile?.grade) query.set("grade", state.profile.grade);

  return (
    <iframe
      title={labels?.brand ?? "Math motion"}
      src={`/math-motion/index.html?${query}`}
      style={{ width: "100%", minHeight: "85dvh", border: 0, borderRadius: 16 }}
      allow="fullscreen"
    />
  );
}
