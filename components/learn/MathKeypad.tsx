"use client";

import { useState } from "react";

interface MathKeypadProps {
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function MathKeypad({ onInsert, onBackspace, onClear, onSubmit, disabled }: MathKeypadProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Groups of keys for elementary through high school math
  const keyRows = [
    [
      { label: "x", val: "x" },
      { label: "y", val: "y" },
      { label: "/", val: "/" },
      { label: "x²", val: "²" },
      { label: "√", val: "√" },
      { label: "π", val: "π" },
    ],
    [
      { label: "7", val: "7" },
      { label: "8", val: "8" },
      { label: "9", val: "9" },
      { label: "÷", val: "÷" },
      { label: "(", val: "(" },
      { label: ")", val: ")" },
    ],
    [
      { label: "4", val: "4" },
      { label: "5", val: "5" },
      { label: "6", val: "6" },
      { label: "×", val: "×" },
      { label: "<", val: "<" },
      { label: ">", val: ">" },
    ],
    [
      { label: "1", val: "1" },
      { label: "2", val: "2" },
      { label: "3", val: "3" },
      { label: "-", val: "-" },
      { label: "≤", val: "≤" },
      { label: "≥", val: "≥" },
    ],
    [
      { label: "0", val: "0" },
      { label: ".", val: "." },
      { label: "=", val: "=" },
      { label: "+", val: "+" },
      { label: "±", val: "±" },
      { label: "⌫", action: "backspace", cls: "bg-amber-100 dark:bg-amber-900/40 font-bold" },
    ],
  ];

  return (
    <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 shadow-sm transition-all">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <span className="font-medium flex items-center gap-1.5">
          <span>🧮</span> 수학 전용 스마트 키패드
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="hover:text-red-500 transition-colors px-1"
          >
            전체지우기
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium px-1"
          >
            {isOpen ? "접기 ▲" : "키패드 열기 ▼"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-2 space-y-1.5 select-none" role="region" aria-label="수학 키패드">
          {keyRows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-6 gap-1.5">
              {row.map((k, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (k.action === "backspace") {
                      onBackspace();
                    } else if (k.val) {
                      onInsert(k.val);
                    }
                  }}
                  className={`h-10 rounded-lg text-base font-semibold flex items-center justify-center transition-all active:scale-95 shadow-xs ${
                    k.cls
                      ? k.cls
                      : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  } disabled:opacity-40 disabled:pointer-events-none`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          ))}

          <div className="pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={onSubmit}
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>입력 완료 및 정답 제출</span>
              <span>↵</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

