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
      <g fill="#18181B">
        {/* === 글자: 한 (Left) === */}
        {/* ㅎ: 머리점 (Calligraphic Top Drop) */}
        <path d="M12.5 11 C13.5 10.5 15.2 10.8 15.8 11.8 C16.2 12.5 15.2 13.5 14.2 13.5 C13.2 13.5 12 12.5 12.5 11 Z" />
        {/* ㅎ: 가로획 (예서 특유의 잠두안미 파책 磔: 좌측 머리는 묵직하고 우측은 부드럽게 뻗음) */}
        <path d="M8.5 15.5 C10.2 14.8 16.5 14.8 19 15.2 C20.2 15.5 20.2 16.5 19 17 C17.5 17.5 10.2 17.6 8.5 16.8 C7.8 16.5 8 15.8 8.5 15.5 Z" />
        {/* ㅎ: 이응 (Flattened Clerical Oval) */}
        <path d="M14 18.5 C11.8 18.5 10 19.8 10 21.8 C10 23.8 11.8 25.2 14 25.2 C16.2 25.2 18 23.8 18 21.8 C18 19.8 16.2 18.5 14 18.5 Z M14 20.3 C15 20.3 16 21 16 21.8 C16 22.6 15 23.4 14 23.4 C13 23.4 12 22.6 12 21.8 C12 21 13 20.3 14 20.3 Z" />
        {/* ㅏ: 굵은 세로 기둥 (Main Stem) */}
        <path d="M21.5 11.5 C22.2 11.5 22.8 12 22.8 12.8 L22.8 25 C22.8 25.8 22.2 26.2 21.5 26.2 C20.8 26.2 20.2 25.8 20.2 25 L20.2 12.8 C20.2 12 20.8 11.5 21.5 11.5 Z" />
        {/* ㅏ: 곁가지 점획 (Right Branch) */}
        <path d="M22.5 18 C23.5 18 25.2 17.6 25.8 18.2 C26.2 18.8 25.8 19.8 24.8 20 C23.8 20.2 22.8 20 22.5 19.8 Z" />
        {/* ㄴ: 꺾임과 하단 수평 받침획 (Base Corner with Clerical Wave) */}
        <path d="M10.5 27 C11.2 27 11.8 27.6 11.8 28.5 L11.8 33.8 C11.8 34.4 12.2 34.8 13 34.8 L23.5 34.8 C25 34.8 26.2 34.4 27 35.2 C27.5 35.7 27 37 25.8 37.2 C23.5 37.5 12.5 37.5 10.8 36.6 C9.8 36 9.5 34.8 9.5 33.8 L9.5 28.5 C9.5 27.6 9.8 27 10.5 27 Z" />

        {/* === 글자: 글 (Right) === */}
        {/* ㄱ: 상단 가로획 & 묵직한 꺾임 (Clerical Hook) */}
        <path d="M29.5 13.5 C31.5 13 38 13 39.5 13.5 C40.5 13.8 40.8 14.8 40.2 16 L39.2 19.8 C38.8 20.6 37.8 20.8 37.2 20.2 C36.8 19.8 37.2 19 37.5 18 L38.2 15.5 C38.2 15.2 37.8 15 37.2 15 L31.5 15.2 C30.5 15.2 29.8 14.8 29.5 14 C29.2 13.6 29.2 13.5 29.5 13.5 Z" />
        {/* ㅡ: 길고 시원하게 뻗은 가로 그음 (Expansive Wave) */}
        <path d="M28.5 22.2 C30.5 21.6 39 21.6 41.5 22 C42.8 22.2 43 23.2 42 23.8 C40.8 24.4 30.5 24.5 28.5 23.6 C27.8 23.2 28 22.5 28.5 22.2 Z" />
        {/* ㄹ: 굽이치는 율동적 전절과 끝 파책 (Rhythmic Calligraphic Zigzag) */}
        <path d="M30.5 25.8 C32 25.5 38 25.5 39.2 25.8 C40 26 40.2 27 39.8 27.8 L39 29.2 C38.6 29.8 37.8 30.2 37 30 L32.8 30 C32 30 31.6 30.5 31.6 31.2 L31.6 32.5 C31.6 33.2 32.2 33.4 33 33.4 L38.2 33.4 C39.8 33.4 41 33 41.8 33.8 C42.2 34.2 41.8 35.4 40.8 35.6 C38.8 36 32.2 36 30.8 35.2 C29.5 34.6 29.2 33.5 29.2 32 L29.2 30.2 C29.2 29.2 30 28.5 31 28.5 L36.8 28.5 L37.2 27.2 L31.2 27.2 C30.2 27.2 29.8 26.6 29.8 26.2 C29.8 25.9 30.2 25.8 30.5 25.8 Z" />
      </g>

      {/* Traditional Korean Red Calligraphy Seal Stamp (낙관 印章) */}
      <rect x="36.5" y="36.5" width="7" height="7" rx="2" fill="#DC2626" />
      <rect x="38" y="38" width="4" height="4" rx="1" fill="#FCFAF5" opacity="0.9" />
    </svg>
  );
}
