import React from "react";

interface MenuChevronUpDownProps {
  className?: string;
}

/**
 * Standard ChevronUpDown icon for menu selectors (Main Language, Multilingual, Subject).
 * Ensures 100% pixel-perfect uniform size, stroke, and appearance across all platforms.
 */
export function MenuChevronUpDown({ className = "" }: MenuChevronUpDownProps) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 select-none pointer-events-none ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.25 9.48a.75.75 0 011.1.02L10 15.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.05-1.04z"
        clipRule="evenodd"
      />
    </svg>
  );
}
