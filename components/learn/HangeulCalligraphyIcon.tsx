"use client";

import React from "react";

interface HangeulCalligraphyIconProps {
  className?: string;
  size?: number;
}

/**
 * Clean, modern Korean language icon featuring crisp "가나다" typography.
 * High-legibility badge designed for 14px~32px rendering across all themes.
 */
export function HangeulCalligraphyIcon({
  className = "w-5 h-5",
  size = 24,
}: HangeulCalligraphyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      fill="none"
      aria-label="가나다"
      role="img"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        fill="#EEF2FF"
        stroke="#6366F1"
        strokeWidth="2.5"
      />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontSize="17"
        fontWeight="900"
        letterSpacing="-0.5px"
        fill="#312E81"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        가나다
      </text>
    </svg>
  );
}
