"use client";

import React from "react";
import Image from "next/image";
import { useCountry, getLogoForCountry } from "@/lib/country/CountryContext";

export interface BrandLogoProps {
  country?: string;
  portal?: "tech" | "chat" | "sys";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
  priority?: boolean;
}

const SIZE_MAP = {
  sm: {
    classes: "h-8 w-8 sm:h-9 sm:w-9",
    pixelSize: 48,
  },
  md: {
    classes: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16",
    pixelSize: 96,
  },
  lg: {
    classes: "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24",
    pixelSize: 128,
  },
  xl: {
    classes: "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32",
    pixelSize: 160,
  },
};

export function BrandLogo({
  country: countryProp,
  portal,
  size = "md",
  className = "",
  alt,
  priority = false,
}: BrandLogoProps) {
  const countryContext = useCountry();
  
  let logoUrl = countryContext.logoUrl;
  let displayName = countryContext.countryDisplayName;

  if (portal) {
    logoUrl = `/logos/logo-${portal}.png`;
    displayName = portal.toUpperCase();
  } else if (countryProp) {
    const customCountry = getLogoForCountry(countryProp);
    logoUrl = customCountry.logoUrl;
    displayName = customCountry.countryDisplayName;
  }

  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const altText = alt || `${displayName} LIFE.HELP`;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeConfig.classes} ${className}`}
    >
      <Image
        src={logoUrl}
        alt={altText}
        width={sizeConfig.pixelSize}
        height={sizeConfig.pixelSize}
        priority={priority}
        className="h-full w-full object-contain rounded-lg shadow-xs transition-transform duration-150 hover:scale-105"
      />
    </span>
  );
}

