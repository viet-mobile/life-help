"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Site } from "@/lib/learn/types";

export interface SubjectItem {
  site: Site;
  href: string;
  isCurrent: boolean;
  label: string;
  icon?: string;
}

interface ResponsiveSubjectNavProps {
  currentSite: Site;
  subjects: SubjectItem[];
  standardsHref?: string;
  standardsLabel?: string;
}

export function ResponsiveSubjectNav({
  currentSite,
  subjects,
  standardsHref,
  standardsLabel = "표준어 규정",
}: ResponsiveSubjectNavProps) {
  const router = useRouter();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetUrl = e.target.value;
    if (targetUrl) {
      if (targetUrl.startsWith("http")) {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    }
  };

  const activeHref = subjects.find((s) => s.isCurrent)?.href || "";

  return (
    <nav aria-label="Subject Navigation" className="inline-flex items-center min-w-0 max-w-full">
      {/* Desktop / Wide view (>= 960px): Individual pill buttons, height 34px, text-xs font-bold */}
      <div className="hidden min-[960px]:inline-flex items-center gap-1.5 shrink-0">
        {subjects.map((sub) => (
          <Link
            key={sub.site}
            href={sub.href}
            className={`droplet-btn px-3 h-[34px] inline-flex items-center justify-center text-xs font-bold rounded-full transition shadow-2xs whitespace-nowrap cursor-pointer ${
              sub.isCurrent
                ? "bg-blue-600 text-white border border-blue-600 pointer-events-none shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200"
            }`}
            data-testid={`subject-nav-${sub.site}`}
          >
            {sub.label}
          </Link>
        ))}

        {standardsHref && (
          <Link
            href={standardsHref}
            className="droplet-btn px-3 h-[34px] inline-flex items-center justify-center gap-1 text-xs font-bold rounded-full transition shadow-2xs whitespace-nowrap cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            title="국립국어원 한국어 표준어 규정"
            data-testid="subject-nav-standards"
          >
            <span>📜</span>
            <span>{standardsLabel}</span>
          </Link>
        )}
      </div>

      {/* Mobile & Narrow view (< 960px): Dropdown select matching LocaleSwitch design */}
      <div className="min-[960px]:hidden inline-flex items-center max-w-full">
        <label
          className="l-locale inline-flex items-center shrink-0 max-w-full"
          style={{
            height: "34px",
            padding: "0 8px 0 10px",
            border: "1.5px solid var(--l-line, #dfe3f2)",
            borderRadius: "9999px",
            background: "#fff",
            boxSizing: "border-box",
          }}
        >
          <span className="text-xs mr-1 shrink-0" aria-hidden="true">📚</span>
          <select
            className="l-locale-select"
            value={activeHref}
            onChange={handleSelectChange}
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
              maxWidth: "min(40vw, 160px)",
              outline: "none",
            }}
          >
            {subjects.map((sub) => (
              <option key={sub.site} value={sub.href}>
                {sub.label}
              </option>
            ))}
            {standardsHref && (
              <option value={standardsHref}>
                📜 {standardsLabel}
              </option>
            )}
          </select>
        </label>
      </div>
    </nav>
  );
}
