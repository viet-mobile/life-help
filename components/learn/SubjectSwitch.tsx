"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLearner } from "./LearnerProvider";
import { type Site } from "@/lib/learn/types";
import { buildLearnUrl } from "@/lib/learn/hosts";

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

  const subjects: { site: Site; label: string; icon: string }[] = [
    { site: "korean", label: t("site.korean.name" as never) || "한국어", icon: "🇰🇷" },
    { site: "english", label: t("site.english.name" as never) || "영어", icon: "🔤" },
    { site: "math", label: t("site.math.name" as never) || "수학", icon: "➗" },
    { site: "physics", label: t("site.physics.name" as never) || "물리", icon: "🔬" },
    { site: "chemistry", label: t("site.chemistry.name" as never) || "화학", icon: "🧪" },
  ];

  const currentSubject = subjects.find((s) => s.site === currentSite) || subjects[0];

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
              className={`droplet-pill px-2.5 py-1 text-xs font-extrabold rounded-full transition shadow-2xs cursor-pointer whitespace-nowrap ${
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

      {/* Mobile & Compact Screens: Compact dropdown pill */}
      <div className="md:hidden relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="droplet-pill inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-full transition shadow-2xs cursor-pointer shrink-0"
          title={currentSubject.label}
        >
          <span>{currentSubject.label}</span>
          <span className="text-[10px] text-blue-600">▾</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50">
            {subjects.map((sub) => {
              const isCurrent = sub.site === currentSite;
              return (
                <Link
                  key={sub.site}
                  href={host ? buildLearnUrl(sub.site, host, locale) : `/study/${sub.site}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-bold transition ${
                    isCurrent
                      ? "bg-blue-50 text-blue-700 font-extrabold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{sub.icon}</span>
                    <span>{sub.label}</span>
                  </span>
                  {isCurrent && <span className="text-blue-600">✓</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
