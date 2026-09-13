"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";

interface WorkHoursPickerProps {
  initialValue?: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  dayLabel?: string;
}

// 30-minute intervals from 00:00 to 24:00 (49 steps)
export const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, "0");
  TIME_OPTIONS.push(`${hh}:00`);
  TIME_OPTIONS.push(`${hh}:30`);
}
TIME_OPTIONS.push("24:00");

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calculateHoursDiff(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (endMin <= startMin) {
    // Cross midnight
    return Math.max(0, (24 * 60 - startMin + endMin) / 60);
  }
  return Math.max(0, (endMin - startMin) / 60);
}

export function WorkHoursPicker({
  initialValue = "24시간 즉시 출동 가능",
  onSave,
  onCancel,
  dayLabel,
}: WorkHoursPickerProps) {
  const { locale, t, formatBilingual } = useLocale();
  const isKorean = locale === "ko";

  // Parse initial state
  const isInitially24h =
    initialValue.includes("24시간") ||
    initialValue.includes("24h") ||
    initialValue.includes("24/7");

  const [mode, setMode] = useState<"24h" | "custom">(isInitially24h ? "24h" : "custom");

  // Parse custom times
  const parsed = useMemo(() => {
    // Check if break format: e.g. "09:00 - 12:00, 13:00 - 18:00" or "(휴게 12:00 - 13:00)"
    const timeMatches = initialValue.match(/\d{2}:\d{2}/g);
    if (timeMatches && timeMatches.length >= 4) {
      return {
        hasBreak: true,
        start1: timeMatches[0] || "09:00",
        end1: timeMatches[1] || "12:00",
        breakStart: timeMatches[1] || "12:00",
        breakEnd: timeMatches[2] || "13:00",
        start2: timeMatches[2] || "13:00",
        end2: timeMatches[3] || "18:00",
      };
    } else if (timeMatches && timeMatches.length >= 2) {
      return {
        hasBreak: false,
        start1: timeMatches[0] || "09:00",
        end1: timeMatches[1] || "18:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        start2: "13:00",
        end2: "18:00",
      };
    }
    return {
      hasBreak: true,
      start1: "09:00",
      end1: "12:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      start2: "13:00",
      end2: "18:00",
    };
  }, [initialValue]);

  const [hasBreak, setHasBreak] = useState(parsed.hasBreak);
  const [start1, setStart1] = useState(parsed.start1);
  const [end1, setEnd1] = useState(parsed.end1);
  const [breakStart, setBreakStart] = useState(parsed.breakStart);
  const [breakEnd, setBreakEnd] = useState(parsed.breakEnd);
  const [start2, setStart2] = useState(parsed.start2);
  const [end2, setEnd2] = useState(parsed.end2);

  // When end1 changes, synchronize break start
  const handleEnd1Change = (newEnd: string) => {
    setEnd1(newEnd);
    if (hasBreak && timeToMinutes(newEnd) >= timeToMinutes(start1)) {
      setBreakStart(newEnd);
      // default break 1 hour
      const nextHour = Math.min(24 * 60, timeToMinutes(newEnd) + 60);
      const nextH = String(Math.floor(nextHour / 60)).padStart(2, "0");
      const nextM = String(nextHour % 60).padStart(2, "0");
      const nextTime = `${nextH}:${nextM}`;
      setBreakEnd(nextTime);
      setStart2(nextTime);
    }
  };

  // When breakEnd changes, synchronize start2
  const handleBreakEndChange = (newBreakEnd: string) => {
    setBreakEnd(newBreakEnd);
    setStart2(newBreakEnd);
  };

  // Calculate work duration
  const duration1 = calculateHoursDiff(start1, end1);
  const durationBreak = hasBreak ? calculateHoursDiff(breakStart, breakEnd) : 0;
  const duration2 = hasBreak ? calculateHoursDiff(start2, end2) : 0;
  const totalWorkHours = duration1 + duration2;

  // Generate result string
  const currentFormattedResult = useMemo(() => {
    if (mode === "24h") {
      return "24시간 즉시 출동 가능";
    }
    if (hasBreak) {
      return `${start1} - ${end1}, ${start2} - ${end2} (휴게 ${breakStart} - ${breakEnd})`;
    }
    return `${start1} - ${end1}`;
  }, [mode, hasBreak, start1, end1, start2, end2, breakStart, breakEnd]);

  const handleApplyPreset = (preset: {
    start1: string;
    end1: string;
    hasBreak: boolean;
    breakStart?: string;
    breakEnd?: string;
    start2?: string;
    end2?: string;
  }) => {
    setMode("custom");
    setStart1(preset.start1);
    setEnd1(preset.end1);
    setHasBreak(preset.hasBreak);
    if (preset.hasBreak) {
      setBreakStart(preset.breakStart || preset.end1);
      setBreakEnd(preset.breakEnd || "13:00");
      setStart2(preset.start2 || preset.breakEnd || "13:00");
      setEnd2(preset.end2 || "18:00");
    }
  };

  return (
    <div className="rounded-2xl border border-blue-500/80 bg-slate-900 p-4 shadow-xl text-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⏰</span>
          <h4 className="text-xs font-black text-white">
            {dayLabel
              ? `${dayLabel} ${isKorean ? "근무 시간 설정" : "Work Hours Setup"}`
              : isKorean
              ? "근무 시간대 자유 설정 (30분 단위)"
              : "Work Hours Setup (30-min steps)"}
          </h4>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mode selection: 24h vs Custom */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("24h")}
          className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mode === "24h"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <span>⚡</span>
          <span>{formatBilingual(t("workspace.hours24"), "24시간 즉시 출동 가능")}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mode === "custom"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <span>⏱️</span>
          <span>{formatBilingual(t("workspace.customHours"), "직접 시간대 선택 (30분 단위)")}</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 block">
          {isKorean ? "⚡ 추천 시간대 바로 선택:" : "⚡ Quick Presets:"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                start1: "09:00",
                end1: "12:00",
                hasBreak: true,
                breakStart: "12:00",
                breakEnd: "13:00",
                start2: "13:00",
                end2: "18:00",
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-900/40 hover:text-blue-200"
          >
            {isKorean ? "주간 09:00~18:00 (점심 1시간)" : "09:00~18:00 (1h lunch)"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                start1: "08:30",
                end1: "12:00",
                hasBreak: true,
                breakStart: "12:00",
                breakEnd: "13:30",
                start2: "13:30",
                end2: "17:30",
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-900/40 hover:text-blue-200"
          >
            {isKorean ? "08:30~17:30 (휴게 1.5시간)" : "08:30~17:30 (1.5h break)"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                start1: "08:00",
                end1: "13:00",
                hasBreak: false,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-900/40 hover:text-blue-200"
          >
            {isKorean ? "오전 집중 08:00~13:00" : "Morning 08:00~13:00"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                start1: "13:00",
                end1: "19:00",
                hasBreak: false,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-900/40 hover:text-blue-200"
          >
            {isKorean ? "오후 집중 13:00~19:00" : "Afternoon 13:00~19:00"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                start1: "18:00",
                end1: "24:00",
                hasBreak: false,
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-blue-900/40 hover:text-blue-200"
          >
            {isKorean ? "야간 18:00~24:00" : "Night 18:00~24:00"}
          </button>
        </div>
      </div>

      {/* Custom Time Selector in 30-min increments */}
      {mode === "custom" && (
        <div className="space-y-3.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          {/* Shift 1 */}
          <div>
            <span className="text-[11px] font-black text-blue-400 block mb-1.5 flex items-center justify-between">
              <span>{formatBilingual(t("workspace.shift1"), "1차 근무 시간")}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {duration1.toFixed(1)} {isKorean ? "시간" : "h"}
              </span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  {formatBilingual(t("workspace.startTime"), "시작 시간")}
                </label>
                <select
                  value={start1}
                  onChange={(e) => setStart1(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-white outline-none focus:border-blue-500"
                >
                  {TIME_OPTIONS.slice(0, -1).map((tOpt) => (
                    <option key={`s1-${tOpt}`} value={tOpt}>
                      {tOpt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  {formatBilingual(t("workspace.endTime"), "종료 시간")}
                </label>
                <select
                  value={end1}
                  onChange={(e) => handleEnd1Change(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-white outline-none focus:border-blue-500"
                >
                  {TIME_OPTIONS.map((tOpt) => (
                    <option key={`e1-${tOpt}`} value={tOpt}>
                      {tOpt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Break Time Toggle */}
          <div className="border-t border-slate-800/80 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-amber-300">
              <input
                type="checkbox"
                checked={hasBreak}
                onChange={(e) => setHasBreak(e.target.checked)}
                className="h-4 w-4 rounded-md accent-amber-500 cursor-pointer"
              />
              <span>☕ {formatBilingual(t("workspace.hasBreak"), "하루 중 중간에 쉬는 시간(휴게) 갖기")}</span>
            </label>
            <p className="text-[10px] text-slate-400 mt-0.5 pl-6">
              {isKorean
                ? "체크하시면 중간 휴게 시간 동안 배차를 중단하고, 휴게 후 2차 근무를 재개합니다."
                : "Dispatches are paused during break and resumed for the 2nd shift."}
            </p>
          </div>

          {/* Break Time Inputs & Shift 2 */}
          {hasBreak && (
            <div className="space-y-3 pl-3 border-l-2 border-amber-500/50 pt-1">
              {/* Break Window */}
              <div>
                <span className="text-[11px] font-black text-amber-300 block mb-1.5 flex items-center justify-between">
                  <span>☕ {formatBilingual(t("workspace.breakTime"), "중간 쉬는 시간 (휴게)")}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {durationBreak.toFixed(1)} {isKorean ? "시간 휴식" : "h break"}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {isKorean ? "휴게 시작" : "Break Start"}
                    </label>
                    <select
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-amber-200 outline-none focus:border-amber-500"
                    >
                      {TIME_OPTIONS.slice(0, -1).map((tOpt) => (
                        <option key={`bs-${tOpt}`} value={tOpt}>
                          {tOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {isKorean ? "휴게 종료 (근무 재개)" : "Break End"}
                    </label>
                    <select
                      value={breakEnd}
                      onChange={(e) => handleBreakEndChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-amber-200 outline-none focus:border-amber-500"
                    >
                      {TIME_OPTIONS.map((tOpt) => (
                        <option key={`be-${tOpt}`} value={tOpt}>
                          {tOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Shift 2 */}
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-black text-emerald-400 block mb-1.5 flex items-center justify-between">
                  <span>{formatBilingual(t("workspace.shift2"), "2차 근무 시간")}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {duration2.toFixed(1)} {isKorean ? "시간" : "h"}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {formatBilingual(t("workspace.startTime"), "시작 시간")}
                    </label>
                    <select
                      value={start2}
                      onChange={(e) => setStart2(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-white outline-none focus:border-emerald-500"
                    >
                      {TIME_OPTIONS.slice(0, -1).map((tOpt) => (
                        <option key={`s2-${tOpt}`} value={tOpt}>
                          {tOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      {formatBilingual(t("workspace.endTime"), "종료 시간")}
                    </label>
                    <select
                      value={end2}
                      onChange={(e) => setEnd2(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs font-black text-white outline-none focus:border-emerald-500"
                    >
                      {TIME_OPTIONS.map((tOpt) => (
                        <option key={`e2-${tOpt}`} value={tOpt}>
                          {tOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary preview */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
            {isKorean ? "설정될 시간대 요약" : "Summary Preview"}
          </span>
          <p className="text-xs font-black text-blue-300 mt-0.5">
            {currentFormattedResult}
          </p>
        </div>
        {mode === "custom" && (
          <div className="text-right sm:self-center text-xs font-bold text-slate-300">
            <span>{isKorean ? "총 실근무: " : "Work: "}</span>
            <span className="text-emerald-400 font-extrabold">{totalWorkHours.toFixed(1)}시간</span>
            {hasBreak && (
              <span className="text-slate-400 text-[11px] block">
                (휴게 {durationBreak.toFixed(1)}시간)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            {formatBilingual(t("workspace.calendarClose"), "취소")}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSave(currentFormattedResult)}
          className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white shadow-md hover:bg-blue-500 transition flex items-center gap-1.5"
        >
          <span>✓</span>
          <span>{formatBilingual(t("workspace.saveHours"), "설정 완료 및 저장")}</span>
        </button>
      </div>
    </div>
  );
}

