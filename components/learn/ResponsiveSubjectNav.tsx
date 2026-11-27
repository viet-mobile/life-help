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
  subjects,
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
      {/* Desktop / Wide view (>= 960px): 박스 디자인 코드(droplet-btn) 적용된 과목 버튼 목록 */}
      <div className="hidden min-[960px]:inline-flex items-center gap-1.5 shrink-0">
        {subjects.map((sub) => (
          <Link
            key={sub.site}
            href={sub.href}
            className={`droplet-btn px-3 h-[34px] inline-flex items-center justify-center text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer ${
              sub.isCurrent
                ? "bg-blue-600 text-white border border-blue-600 pointer-events-none shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200"
            }`}
            data-testid={`subject-nav-${sub.site}`}
          >
            {sub.label}
          </Link>
        ))}
      </div>

      {/* Mobile & Narrow view (< 960px): 박스 디자인 코드(droplet-pill) 일률 적용 드롭다운 */}
      <div className="min-[960px]:hidden inline-flex items-center shrink-0 max-w-full">
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
              maxWidth: "min(32vw, 110px)",
              outline: "none",
            }}
          >
            {subjects.map((sub) => (
              <option key={sub.site} value={sub.href}>
                {sub.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
