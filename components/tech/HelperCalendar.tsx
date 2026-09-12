"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface HelperCalendarProps {
  availableDays: string[];
  excludedDates?: string[];
  extraWorkDates?: string[];
  dayHours?: Record<string, string>;
  onUpdateExclusions: (excludedDates: string[], extraWorkDates: string[]) => void;
}

const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function HelperCalendar({
  availableDays,
  excludedDates = [],
  extraWorkDates = [],
  dayHours = {},
  onUpdateExclusions,
}: HelperCalendarProps) {
  const { locale } = useLocale();
  const isKo = locale === "ko";

  // Current date info
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  // State for active view tab (this month vs next month, or view both)
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<0 | 1>(0);

  // Month 0: current month, Month 1: next month
  const targetYear = selectedMonthOffset === 0 ? currentYear : currentMonth === 11 ? currentYear + 1 : currentYear;
  const targetMonth = selectedMonthOffset === 0 ? currentMonth : (currentMonth + 1) % 12;

  // Build calendar grid for a given year & month
  const calendarData = useMemo(() => {
    const firstDayOfWeek = new Date(targetYear, targetMonth, 1).getDay();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const cells: Array<{
      dateNumber: number | null;
      isoDate: string;
      dayOfWeek: number;
      dayName: string;
      isToday: boolean;
      isPast: boolean;
      isWorkday: boolean;
      isExplicitlyExcluded: boolean;
      isExtraWork: boolean;
    }> = [];

    // Empty cells before 1st day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({
        dateNumber: null,
        isoDate: "",
        dayOfWeek: i,
        dayName: WEEKDAY_NAMES[i],
        isToday: false,
        isPast: false,
        isWorkday: false,
        isExplicitlyExcluded: false,
        isExtraWork: false,
      });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(targetYear, targetMonth, day);
      const dayOfWeek = dateObj.getDay();
      const dayName = WEEKDAY_NAMES[dayOfWeek];
      const isoDate = formatIsoDate(targetYear, targetMonth, day);

      const isToday =
        today.getFullYear() === targetYear &&
        today.getMonth() === targetMonth &&
        today.getDate() === day;

      const isPast =
        dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const isWeeklySelected = availableDays.includes(dayName);
      const isExplicitlyExcluded = excludedDates.includes(isoDate);
      const isExtraWork = extraWorkDates.includes(isoDate);

      // A date is a workday if:
      // (Weekly active AND not explicitly excluded) OR explicitly added as extra workday
      const isWorkday = (isWeeklySelected && !isExplicitlyExcluded) || isExtraWork;

      cells.push({
        dateNumber: day,
        isoDate,
        dayOfWeek,
        dayName,
        isToday,
        isPast,
        isWorkday,
        isExplicitlyExcluded,
        isExtraWork,
      });
    }

    return cells;
  }, [targetYear, targetMonth, availableDays, excludedDates, extraWorkDates, today]);

  // Statistics
  const monthStats = useMemo(() => {
    const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthVal = (currentMonth + 1) % 12;
    const nextMonthDays = new Date(nextMonthYear, nextMonthVal + 1, 0).getDate();

    let thisMonthWorkCount = 0;
    let thisMonthExcludedCount = 0;
    for (let d = 1; d <= currentMonthDays; d++) {
      const iso = formatIsoDate(currentYear, currentMonth, d);
      const dayName = WEEKDAY_NAMES[new Date(currentYear, currentMonth, d).getDay()];
      const isWeekly = availableDays.includes(dayName);
      const isEx = excludedDates.includes(iso);
      const isExtra = extraWorkDates.includes(iso);
      if (isEx) thisMonthExcludedCount++;
      if ((isWeekly && !isEx) || isExtra) thisMonthWorkCount++;
    }

    let nextMonthWorkCount = 0;
    let nextMonthExcludedCount = 0;
    for (let d = 1; d <= nextMonthDays; d++) {
      const iso = formatIsoDate(nextMonthYear, nextMonthVal, d);
      const dayName = WEEKDAY_NAMES[new Date(nextMonthYear, nextMonthVal, d).getDay()];
      const isWeekly = availableDays.includes(dayName);
      const isEx = excludedDates.includes(iso);
      const isExtra = extraWorkDates.includes(iso);
      if (isEx) nextMonthExcludedCount++;
      if ((isWeekly && !isEx) || isExtra) nextMonthWorkCount++;
    }

    return {
      thisMonthWorkCount,
      thisMonthExcludedCount,
      nextMonthWorkCount,
      nextMonthExcludedCount,
      totalExcluded: excludedDates.length,
    };
  }, [currentYear, currentMonth, availableDays, excludedDates, extraWorkDates]);

  // Toggle individual date
  const handleToggleDate = (cell: (typeof calendarData)[number]) => {
    if (!cell.dateNumber || !cell.isoDate) return;

    const isWeekly = availableDays.includes(cell.dayName);
    const wasWorkday = cell.isWorkday;

    let nextExcluded = [...excludedDates];
    let nextExtra = [...extraWorkDates];

    if (wasWorkday) {
      // User is UNCHECKING this date (making it a Day Off)
      if (isWeekly) {
        if (!nextExcluded.includes(cell.isoDate)) {
          nextExcluded.push(cell.isoDate);
        }
      }
      nextExtra = nextExtra.filter((d) => d !== cell.isoDate);
    } else {
      // User is CHECKING this date (making it an Active Workday)
      nextExcluded = nextExcluded.filter((d) => d !== cell.isoDate);
      if (!isWeekly) {
        if (!nextExtra.includes(cell.isoDate)) {
          nextExtra.push(cell.isoDate);
        }
      }
    }

    onUpdateExclusions(nextExcluded, nextExtra);
  };

  // Reset all exclusions
  const handleResetExclusions = () => {
    if (confirm(isKo ? "당월 및 익월의 개별 휴무일 설정을 모두 초기화(기본 요일 일정으로 복구)하시겠습니까?" : "Reset all individual day-off exclusions for this and next month?")) {
      onUpdateExclusions([], []);
    }
  };

  const nextMonthYearLabel = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthLabel = ((currentMonth + 1) % 12) + 1;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
      {/* Header and Month Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>📅</span>
            <span>
              {isKo
                ? "월간 출동 달력 (당월 및 익월 개별 휴무일 설정)"
                : "Monthly Dispatch Calendar (Day-Off Toggle)"}
            </span>
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            {isKo
              ? "기본 설정된 활동 요일은 자동으로 '출동 가능'으로 표시됩니다. 일할 수 없는 날짜를 클릭하여 체크 해제(휴무 지정)하세요."
              : "Days matching weekly settings are auto-marked as active. Click any date to uncheck and set as Day Off."}
          </p>
        </div>

        {/* Tab Buttons for This Month & Next Month */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedMonthOffset(0)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedMonthOffset === 0
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {isKo ? `당월 (${currentMonth + 1}월)` : `This Month (${currentMonth + 1})`}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMonthOffset(1)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedMonthOffset === 1
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {isKo
              ? `익월 (${nextMonthLabel}월)`
              : `Next Month (${nextMonthLabel})`}
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>
              {selectedMonthOffset === 0
                ? `${currentMonth + 1}월 출동 가능:`
                : `${nextMonthLabel}월 출동 가능:`}
            </span>
            <strong className="text-white">
              {selectedMonthOffset === 0
                ? monthStats.thisMonthWorkCount
                : monthStats.nextMonthWorkCount}
              {isKo ? "일" : " days"}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>
              {selectedMonthOffset === 0
                ? `${currentMonth + 1}월 개별 휴무:`
                : `${nextMonthLabel}월 개별 휴무:`}
            </span>
            <strong className="text-rose-400">
              {selectedMonthOffset === 0
                ? monthStats.thisMonthExcludedCount
                : monthStats.nextMonthExcludedCount}
              {isKo ? "일" : " days"}
            </strong>
          </span>

          <span className="text-[11px] text-slate-500 hidden md:inline">
            ({isKo ? "총 개별 휴무 지정: " : "Total exclusions: "}
            <strong className="text-slate-400">{monthStats.totalExcluded}</strong>
            {isKo ? "건" : ""})
          </span>
        </div>

        {monthStats.totalExcluded > 0 && (
          <button
            type="button"
            onClick={handleResetExclusions}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            🔄 {isKo ? "휴무일 전체 초기화" : "Reset Exclusions"}
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="mt-4">
        {/* Month Header Label */}
        <div className="text-center py-2 mb-2 font-black text-white text-base">
          {targetYear}년 {targetMonth + 1}월
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs pb-2 border-b border-slate-800">
          {WEEKDAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`py-1 ${
                i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {calendarData.map((cell, idx) => {
            if (!cell.dateNumber) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[64px] rounded-xl border border-transparent bg-slate-950/20"
                />
              );
            }

            const daySpecificHours = dayHours[cell.dayName];

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => handleToggleDate(cell)}
                className={`group relative flex flex-col justify-between rounded-xl p-2 text-left transition min-h-[72px] sm:min-h-[80px] border ${
                  cell.isWorkday
                    ? "border-blue-500/80 bg-blue-950/40 hover:bg-blue-900/50 shadow-sm"
                    : cell.isExplicitlyExcluded
                    ? "border-rose-900/60 bg-rose-950/20 hover:bg-rose-900/30"
                    : "border-slate-800 bg-slate-950/50 hover:bg-slate-800/40 text-slate-500"
                } ${cell.isToday ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900" : ""}`}
                title={`${cell.isoDate} (${cell.dayName}): ${
                  cell.isWorkday
                    ? isKo
                      ? "출동 가능일 (클릭 시 개별 휴무로 변경)"
                      : "Workday (Click to set day off)"
                    : isKo
                    ? "휴무일 (클릭 시 출동일로 활성화)"
                    : "Day Off (Click to activate)"
                }`}
              >
                {/* Top Row: Date Number and Indicators */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      cell.isWorkday
                        ? "text-white"
                        : cell.isExplicitlyExcluded
                        ? "text-rose-400 line-through"
                        : "text-slate-500"
                    } ${
                      cell.dayOfWeek === 0
                        ? "text-rose-400"
                        : cell.dayOfWeek === 6
                        ? "text-blue-400"
                        : ""
                    }`}
                  >
                    {cell.dateNumber}
                  </span>

                  {cell.isToday && (
                    <span className="rounded bg-blue-600 px-1 py-0.2 text-[9px] font-extrabold text-white">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="mt-1 w-full">
                  {cell.isWorkday ? (
                    <div className="flex items-center gap-1 rounded bg-blue-600/30 px-1 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/40">
                      <span className="text-emerald-400">✓</span>
                      <span className="truncate">
                        {cell.isExtraWork
                          ? isKo
                            ? "추가근무"
                            : "Extra"
                          : isKo
                          ? "출동가능"
                          : "Active"}
                      </span>
                    </div>
                  ) : cell.isExplicitlyExcluded ? (
                    <div className="flex items-center gap-1 rounded bg-rose-950/60 px-1 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-800/60">
                      <span>✕</span>
                      <span className="truncate">{isKo ? "개별휴무" : "Off"}</span>
                    </div>
                  ) : (
                    <div className="rounded bg-slate-900 px-1 py-0.5 text-[10px] font-medium text-slate-500 text-center">
                      {isKo ? "정기휴무" : "Off"}
                    </div>
                  )}
                </div>

                {/* Day Hours snippet if workday */}
                {cell.isWorkday && daySpecificHours && (
                  <div className="mt-0.5 text-[9px] text-slate-400 truncate hidden sm:block">
                    {daySpecificHours.includes("24시간")
                      ? "24H"
                      : daySpecificHours.includes("09:00")
                      ? "09-18"
                      : daySpecificHours.includes("18:00")
                      ? "야간"
                      : daySpecificHours}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Excluded Dates Tag List */}
      {excludedDates.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/70">
          <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <span className="text-rose-400">🚫</span>
            <span>
              {isKo ? "지정된 개별 휴무일 목록:" : "Individual Day-Off Exclusions:"}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {excludedDates.map((dateStr) => {
              const [y, m, d] = dateStr.split("-").map(Number);
              const dayName = WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()];
              return (
                <span
                  key={dateStr}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-200"
                >
                  <span>
                    {m}월 {d}일 ({dayName})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextEx = excludedDates.filter((x) => x !== dateStr);
                      onUpdateExclusions(nextEx, extraWorkDates);
                    }}
                    className="rounded text-rose-400 hover:text-white transition"
                    title={isKo ? "휴무 해제 (근무일 복구)" : "Restore workday"}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

