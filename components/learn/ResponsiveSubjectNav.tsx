"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Site } from "@/lib/learn/types";
import { MenuChevronUpDown } from "./MenuChevronUpDown";

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
                : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700"
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
          className="droplet-pill inline-flex items-center justify-between shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 transition px-2 sm:px-2.5 h-[34px] min-w-[72px] max-w-[125px] sm:max-w-[155px] cursor-pointer"
          style={{
            height: "34px",
            boxSizing: "border-box",
          }}
        >
          <div className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
            <span className="text-xs shrink-0 select-none" aria-hidden="true">📚</span>
            <select
              className="l-locale-select bg-transparent text-slate-800 dark:text-slate-100 font-bold text-[0.8rem] cursor-pointer outline-none appearance-none [appearance:none] [-webkit-appearance:none] truncate w-full"
              value={activeHref}
              onChange={handleSelectChange}
              aria-label="Select Subject"
              style={{
                border: 0,
                paddingRight: 0,
                paddingLeft: 0,
                background: "transparent",
              }}
            >
              {subjects.map((sub) => (
                <option key={sub.site} value={sub.href} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          {/* 메인 언어 및 병기 언어 메뉴와 100% 동일한 규격의 상하 화살표(ChevronUpDown) */}
          <MenuChevronUpDown className="ml-1" />
        </label>
      </div>
    </nav>
  );
}
