"use client";

import React from "react";
import Image from "next/image";
import { useCountry, getLogoForCountry } from "@/lib/country/CountryContext";

export interface BrandLogoProps {
  country?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: {
    classes: "h-7 w-7 sm:h-8 sm:w-8",
    pixelSize: 32,
  },
  md: {
    classes: "h-8 w-8 sm:h-9 sm:w-9",
    pixelSize: 36,
  },
  lg: {
    classes: "h-10 w-10 sm:h-12 sm:w-12",
    pixelSize: 48,
  },
  xl: {
    classes: "h-14 w-14 sm:h-16 sm:w-16",
    pixelSize: 64,
  },
};

export function BrandLogo({
  country: countryProp,
  size = "md",
  className = "",
  alt,
  priority = false,
}: BrandLogoProps) {
  const countryContext = useCountry();
  const activeLogo = countryProp
    ? getLogoForCountry(countryProp)
    : countryContext;

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const altText = alt || `${activeLogo.countryDisplayName} LIFE.HELP`;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeConfig.classes} ${className}`}
    >
      <Image
        src={activeLogo.logoUrl}
        alt={altText}
        width={sizeConfig.pixelSize}
        height={sizeConfig.pixelSize}
        priority={priority}
        className="h-full w-full object-contain rounded-md shadow-xs transition-transform duration-150 hover:scale-105"
      />
    </span>
  );
}

