"use client";

import React from "react";

interface HangeulCalligraphyIconProps {
  className?: string;
  size?: number;
}

/**
 * Traditional Korean Clerical Script (예서체 隸書體) "한글" Calligraphy Brush Icon
 * Replaces the national flag with traditional Korean cultural calligraphy aesthetics.
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
      aria-label="한글 (예서체 붓글씨)"
      role="img"
    >
      {/* Soft Hanji/Ceramic Calligraphy Seal Canvas */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        fill="#FCFAF5"
        stroke="#E2D8C3"
        strokeWidth="1.5"
      />
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="8"
        fill="#F8F3E6"
        opacity="0.9"
      />

      {/* 예서체 (Clerical Script) "한글" Traditional Ink Brush Strokes */}
      {/* "한" (HAN) Glyph: Authentic calligraphy curves with terminal flick */}
      <path
        d="M9 13.5C11.5 13.2 15 13 18.5 13.3M7.5 18C11 17.5 16 17.2 20 17.6M14 13.2V22.5M16.5 17.5H19M21.5 12.5V26.5M21.5 19H23.5M10 24C10 21.8 11.5 20.5 13.8 20.5C16.2 20.5 17.8 22 17.8 24.2C17.8 26.5 16 28 13.8 28C11.4 28 10 26.3 10 24Z"
        stroke="#1E232F"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "글" (GEUL) Glyph: Clerical horizontal balance with silken bottom hooks */}
      <path
        d="M27.5 14C30.5 13.5 35 13.2 38.5 13.6C39.2 13.7 39.5 14.3 39 15.2C38 17 36.8 19 35.8 20.5M26.5 20C30 19.5 35.5 19.2 40.5 19.6M28 25C31.5 24.6 37 24.3 40 24.8M34 25V28C34 29 32.5 29.5 30 29.5M30 30H38.5C39.2 30 39.5 30.5 39 31.5L37.5 33.5C36 34.5 33 35 29.5 35.2"
        stroke="#1E232F"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Traditional cinnabar red ink artist seal accent (인장/낙관 印章) in bottom corner */}
      <rect
        x="33.5"
        y="33.5"
        width="8"
        height="8"
        rx="2"
        fill="#C93B2B"
        opacity="0.9"
      />
      <path
        d="M35.5 35.5H39.5M37.5 35.5V39.5"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
