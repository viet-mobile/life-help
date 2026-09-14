"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CountryContextType {
  country: string;
  countryDisplayName: string;
  logoUrl: string;
  faviconUrl: string;
}

const CountryContext = createContext<CountryContextType>({
  country: "default",
  countryDisplayName: "LIFE.HELP",
  logoUrl: "/logos/logo-default.png",
  faviconUrl: "/logos/favicon-default.png",
});

const COUNTRY_NAMES: Record<string, string> = {
  korea: "KOREA",
  japan: "JAPAN",
  china: "CHINA",
  taiwan: "TAIWAN",
  vietnam: "VIETNAM",
  philippines: "PHILIPPINES",
  indonesia: "INDONESIA",
  russia: "RUSSIA",
  uzbek: "UZBEKISTAN",
  nepal: "NEPAL",
  india: "INDIA",
  cambodia: "CAMBODIA",
  thailand: "THAILAND",
  myanmar: "MYANMAR",
  srilanka: "SRI LANKA",
  kazakh: "KAZAKHSTAN",
  france: "FRANCE",
  deutsch: "GERMANY",
  turkiye: "TURKEY",
  ukraina: "UKRAINE",
  timorleste: "TIMOR-LESTE",
  uae: "UAE",
  italia: "ITALY",
  egypt: "EGYPT",
  espania: "SPAIN",
  iran: "IRAN",
  netherland: "NETHERLANDS",
  poland: "POLAND",
  ethiopia: "ETHIOPIA",
  sweden: "SWEDEN",
  israel: "ISRAEL",
  denmark: "DENMARK",
  norway: "NORWAY",
  mongol: "MONGOLIA",
  mexico: "MEXICO",
  brazil: "BRAZIL",
  greece: "GREECE",
  portugal: "PORTUGAL",
  southafrica: "SOUTH AFRICA",
  swiss: "SWITZERLAND",
  pakistan: "PAKISTAN",
  saudiarabia: "SAUDI ARABIA",
  yemen: "YEMEN",
  iraq: "IRAQ",
  bangladesh: "BANGLADESH",
  us: "USA",
  uk: "UK",
  canada: "CANADA",
  australia: "AUSTRALIA",
  newzealand: "NEW ZEALAND",
};

export function resolveCountryFromHost(host?: string | null): string | null {
  if (!host) return null;
  const cleanHost = host.split(":")[0].toLowerCase();
  const parts = cleanHost.split(".");

  // 1. Check country.life.help
  if (parts.length >= 3 && parts[parts.length - 1] === "help" && parts[parts.length - 2] === "life") {
    // If tech.japan.life.help -> parts[1] is country, parts[0] is portal
    if (parts.length === 4) {
      const c = parts[1];
      if (COUNTRY_NAMES[c]) return c;
    }
    // japan.life.help -> parts[0] is country
    const c = parts[0];
    if (COUNTRY_NAMES[c]) return c;
  }

  // 2. Also support localhost subdomains (e.g. japan.localhost)
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    const c = parts[0];
    if (COUNTRY_NAMES[c]) return c;
  }

  return null;
}

export function getLogoForCountry(countryKey?: string | null) {
  const c = countryKey?.toLowerCase();
  if (c && COUNTRY_NAMES[c]) {
    return {
      country: c,
      countryDisplayName: COUNTRY_NAMES[c],
      logoUrl: `/logos/logo-${c}.png`,
      faviconUrl: `/logos/favicon-${c}.png`,
    };
  }
  return {
    country: "default",
    countryDisplayName: "LIFE.HELP",
    logoUrl: "/logos/logo-default.png",
    faviconUrl: "/logos/favicon-default.png",
  };
}

export function CountryProvider({
  children,
  initialCountry,
}: {
  children: React.ReactNode;
  initialCountry?: string | null;
}) {
  const [currentCountry, setCurrentCountry] = useState<string>(() => {
    return initialCountry && COUNTRY_NAMES[initialCountry.toLowerCase()]
      ? initialCountry.toLowerCase()
      : "default";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check query param (e.g. ?country=japan) for instant local testing
    const params = new URLSearchParams(window.location.search);
    const qCountry = params.get("country")?.toLowerCase();
    if (qCountry && COUNTRY_NAMES[qCountry]) {
      setCurrentCountry(qCountry);
      return;
    }

    // Check hostname
    const hostCountry = resolveCountryFromHost(window.location.hostname);
    if (hostCountry && COUNTRY_NAMES[hostCountry]) {
      setCurrentCountry(hostCountry);
      return;
    }

    if (initialCountry && COUNTRY_NAMES[initialCountry.toLowerCase()]) {
      setCurrentCountry(initialCountry.toLowerCase());
    }
  }, [initialCountry]);

  const value = useMemo(() => {
    return getLogoForCountry(currentCountry);
  }, [currentCountry]);

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  return useContext(CountryContext);
}

