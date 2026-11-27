"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLearner } from "./LearnerProvider";
import { type Site } from "@/lib/learn/types";
import { buildLearnUrl } from "@/lib/learn/hosts";
import { HangeulCalligraphyIcon } from "./HangeulCalligraphyIcon";

interface SubjectSwitchProps {
  currentSite: Site;
}

export function SubjectSwitch({ currentSite }: SubjectSwitchProps) {
  const { t, locale } = useLearner();
  const [isOpen, setIsOpen] = useState(false);
  const [host, setHost] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const subjects: { site: Site; label: string; icon: React.ReactNode }[] = [
    { site: "korean", label: t("site.korean.name" as never) || "한국어", icon: <HangeulCalligraphyIcon className="w-3.5 h-3.5 inline-block" /> },
    { site: "english", label: t("site.english.name" as never) || "영어", icon: "🔤" },
    { site: "math", label: t("site.math.name" as never) || "수학", icon: "➗" },
    { site: "physics", label: t("site.physics.name" as never) || "물리", icon: "🔬" },
    { site: "chemistry", label: t("site.chemistry.name" as never) || "화학", icon: "🧪" },
  ];

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Desktop & Wide Screens: Clean horizontal pills directly next to the 2 language selectors */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0">
        {subjects.map((sub) => {
          const isCurrent = sub.site === currentSite;
          return (
            <Link
              key={sub.site}
              href={host ? buildLearnUrl(sub.site, host, locale) : `/study/${sub.site}/dashboard`}
              className={`droplet-btn px-3 h-[34px] inline-flex items-center justify-center text-xs font-bold transition shadow-2xs cursor-pointer whitespace-nowrap ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-xs pointer-events-none"
                  : "bg-white/90 hover:bg-white text-slate-700 hover:text-blue-700 border border-slate-200"
              }`}
            >
              {sub.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile & Compact Screens: 박스 디자인 코드(droplet-pill) 일률 적용 */}
      <div className="md:hidden inline-flex items-center shrink-0 max-w-full">
        <label
          className="droplet-pill inline-flex items-center shrink-0 border border-slate-200 bg-white shadow-2xs hover:border-blue-400 transition"
          style={{
            height: "34px",
            padding: "0 6px 0 8px",
            boxSizing: "border-box",
          }}
        >
          <span className="text-xs mr-1 shrink-0" aria-hidden="true">📚</span>
          <select
            className="l-locale-select"
            value={currentSite}
            onChange={(e) => {
              const targetSite = e.target.value as Site;
              if (targetSite && targetSite !== currentSite) {
                const targetUrl = host ? buildLearnUrl(targetSite, host, locale) : `/study/${targetSite}/dashboard`;
                if (targetUrl.startsWith("http")) {
                  window.location.href = targetUrl;
                } else {
                  window.location.assign(targetUrl);
                }
              }
            }}
            aria-label="Select Subject"
            style={{
              height: "34px",
              minHeight: "34px",
              lineHeight: "34px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: 0,
              background: "transparent",
              color: "var(--l-accent-dark, #1e3a8a)",
              cursor: "pointer",
              maxWidth: "min(32vw, 110px)",
              outline: "none",
            }}
          >
            {subjects.map((sub) => (
              <option key={sub.site} value={sub.site}>
                {sub.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
