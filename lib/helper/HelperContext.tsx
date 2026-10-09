"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, helperApi } from "@/lib/service/client";
import type { SvcHelper } from "@/lib/service/clientTypes";

export interface HelperRegionItem {
  sido: string;
  gungu: string;
}

export interface HelperContract {
  helperId?: string;
  name: string;
  residentNumber: string;
  email: string;
  phone?: string;
  services: string[];
  regions: HelperRegionItem[];
  availableDays: string[];
  availableHours: string;
  dayHours?: Record<string, string>;
  excludedDates?: string[];
  extraWorkDates?: string[];
  signedAt: string;
  signatureDataUrl?: string;
  agreedToTerms: boolean;
}

export interface HelperProfile {
  helperId?: string;
  email: string;
  phone?: string;
  /** true only for an APPROVED helper (decided by staff on the server) */
  isVerified: boolean;
  /** the server's availability flag (an APPROVED helper taking new work) */
  isActive: boolean;
  contract?: HelperContract;
  lastStatusUpdatedAt?: string;
  accessKeyExpiresAt?: string;
}

/**
 * Helper session = the SERVER. Who the helper is, whether they are approved, which services / regions they may take and whether they
 * are available all come from /api/svc/h/me (credential cookie). The browser keeps only the weekly schedule / terms the helper typed
 * (a local convenience, never used for matching or authorization). There are no seed helpers and no client-issued access keys.
 */
interface ScheduleCache {
  availableDays: string[];
  availableHours: string;
  dayHours?: Record<string, string>;
  excludedDates?: string[];
  extraWorkDates?: string[];
  signedAt?: string;
  signatureDataUrl?: string;
}
const SCHEDULE_KEY = "life_help_helper_schedule_v1";
const DEFAULT_SCHEDULE: ScheduleCache = {
  availableDays: ["월", "화", "수", "목", "금", "토"],
  availableHours: "24시간 즉시 출동 가능",
};

function readSchedule(): ScheduleCache {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (raw) return { ...DEFAULT_SCHEDULE, ...(JSON.parse(raw) as Partial<ScheduleCache>) };
  } catch { /* cache only */ }
  return DEFAULT_SCHEDULE;
}
function writeSchedule(s: ScheduleCache) {
  try { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s)); } catch { /* cache only */ }
}

const toRegions = (items: HelperRegionItem[]) => items.map((r) => ({ country: "KR", sido: r.sido, gungu: r.gungu }));

export type HelperAuthResult = { success: true } | { success: false; error: string };

interface HelperContextType {
  helper: HelperProfile | null;
  /** the raw server record (status, capabilities, regions, availability) */
  serverHelper: SvcHelper | null;
  /** "loading" until the first answer from the server */
  sessionState: "loading" | "anonymous" | "ready";
  isLoggedIn: boolean;
  hasContract: boolean;
  remainingDays: number;
  /** Signs in with the access code the server issued at registration. */
  verifyAccessKey: (code: string) => Promise<HelperAuthResult>;
  /** Registers an applicant (PENDING until staff approve). Returns the access code, shown once. */
  register: (data: { name: string; email?: string; primaryLocale: string; spokenLocales?: string[]; services: string[]; regions: HelperRegionItem[] }) => Promise<{ success: true; credential: string } | { success: false; error: string }>;
  saveContract: (contract: Omit<HelperContract, "email" | "phone" | "signedAt"> & { email?: string; phone?: string }) => Promise<void>;
  toggleActiveStatus: () => Promise<HelperAuthResult>;
  updateServices: (services: string[]) => Promise<HelperAuthResult>;
  updateRegions: (regions: HelperRegionItem[]) => Promise<HelperAuthResult>;
  updateSchedule: (days: string[], hours: string, dayHours?: Record<string, string>, excludedDates?: string[], extraWorkDates?: string[]) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const HelperContext = createContext<HelperContextType | null>(null);
const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : "NETWORK");

export function HelperProvider({ children }: { children: React.ReactNode }) {
  const [serverHelper, setServerHelper] = useState<SvcHelper | null>(null);
  const [sessionState, setSessionState] = useState<"loading" | "anonymous" | "ready">("loading");
  const [schedule, setSchedule] = useState<ScheduleCache>(DEFAULT_SCHEDULE);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const me = await helperApi.me();
      if (!alive.current) return;
      setServerHelper(me);
      setSessionState("ready");
    } catch (e) {
      if (!alive.current) return;
      // FORBIDDEN = no valid credential (never logged in, expired, disabled); a network blip keeps what we know
      if (e instanceof ApiError && (e.status === 403 || e.status === 503)) {
        setServerHelper(null);
        setSessionState("anonymous");
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates from the server / browser cache after mount
    setSchedule(readSchedule());
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15_000);
    return () => { alive.current = false; clearInterval(timer); };
  }, [refresh]);

  const verifyAccessKey = useCallback(async (code: string): Promise<HelperAuthResult> => {
    try {
      const { helper } = await helperApi.login(code.trim());
      setServerHelper(helper);
      setSessionState("ready");
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  }, []);

  const register = useCallback<HelperContextType["register"]>(async (data) => {
    try {
      const { helper, credential } = await helperApi.register({
        name: data.name, email: data.email, primaryLocale: data.primaryLocale, spokenLocales: data.spokenLocales ?? [data.primaryLocale],
        services: data.services, regions: toRegions(data.regions),
      });
      // the session cookie is already set; the helper context is refreshed when the person confirms they saved the code, so the pages
      // do not navigate away from the one-time code screen
      void helper;
      return { success: true, credential };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- hydrates from the server / browser cache after mount
  const toggleActiveStatus = useCallback(async (): Promise<HelperAuthResult> => {
    try {
      setServerHelper(await helperApi.setAvailable(!serverHelper?.isAvailable));
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) };
    }
  }, [serverHelper?.isAvailable]);

  const patch = useCallback(async (p: Parameters<typeof helperApi.update>[0]): Promise<HelperAuthResult> => {
    try {
      setServerHelper(await helperApi.update(p));
      return { success: true };
    } catch (e) {
      return { success: false, error: errorCode(e) }; // NOT_ALLOWED once approved: staff change what a helper may take
    }
  }, []);
  const updateServices = useCallback((services: string[]) => patch({ services }), [patch]);
  const updateRegions = useCallback((regions: HelperRegionItem[]) => patch({ regions: toRegions(regions) }), [patch]);

  const updateSchedule = useCallback<HelperContextType["updateSchedule"]>((days, hours, dayHours, excludedDates, extraWorkDates) => {
    setSchedule((cur) => {
      const next = { ...cur, availableDays: days, availableHours: hours, dayHours: dayHours ?? cur.dayHours, excludedDates: excludedDates ?? cur.excludedDates, extraWorkDates: extraWorkDates ?? cur.extraWorkDates };
      writeSchedule(next);
      return next;
    });
  }, []);

  const saveContract = useCallback<HelperContextType["saveContract"]>(async (c) => {
    const next: ScheduleCache = { availableDays: c.availableDays, availableHours: c.availableHours, dayHours: c.dayHours, excludedDates: c.excludedDates, extraWorkDates: c.extraWorkDates, signedAt: new Date().toISOString(), signatureDataUrl: c.signatureDataUrl };
    writeSchedule(next);
    setSchedule(next);
    // services / regions only reach the server while the application is still PENDING (afterwards only staff change them)
    if (serverHelper?.status === "PENDING") await patch({ name: c.name, services: c.services, regions: toRegions(c.regions) });
  }, [serverHelper?.status, patch]);

  const logout = useCallback(async () => {
    try { await helperApi.logout(); } catch { /* the cookie is cleared by the server when reachable */ }
    setServerHelper(null);
    setSessionState("anonymous");
  }, []);

  const helper = useMemo<HelperProfile | null>(() => {
    if (!serverHelper) return null;
    return {
      helperId: serverHelper.id,
      email: "",
      isVerified: serverHelper.status === "APPROVED",
      isActive: serverHelper.isAvailable,
      accessKeyExpiresAt: serverHelper.credentialExpiresAt,
      contract: {
        helperId: serverHelper.id,
        name: serverHelper.displayName,
        residentNumber: "",
        email: "",
        services: serverHelper.capabilities,
        regions: serverHelper.regions.map((r) => ({ sido: r.sido ?? "", gungu: r.gungu ?? "" })),
        availableDays: schedule.availableDays,
        availableHours: schedule.availableHours,
        dayHours: schedule.dayHours,
        excludedDates: schedule.excludedDates ?? [],
        extraWorkDates: schedule.extraWorkDates ?? [],
        signedAt: schedule.signedAt ?? serverHelper.createdAt,
        signatureDataUrl: schedule.signatureDataUrl,
        agreedToTerms: true,
      },
    };
  }, [serverHelper, schedule]);

  // eslint-disable-next-line react-hooks/purity -- hydrates from the server / browser cache after mount
  const remainingDays = serverHelper ? Math.max(0, Math.ceil((Date.parse(serverHelper.credentialExpiresAt) - Date.now()) / 86_400_000)) : 0;

  const value: HelperContextType = {
    helper, serverHelper, sessionState, isLoggedIn: !!serverHelper, hasContract: !!serverHelper, remainingDays,
    verifyAccessKey, register, saveContract, toggleActiveStatus, updateServices, updateRegions, updateSchedule, refresh, logout,
  };
  return <HelperContext.Provider value={value}>{children}</HelperContext.Provider>;
}

export function useHelper(): HelperContextType {
  const ctx = useContext(HelperContext);
  if (!ctx) throw new Error("useHelper must be used within a HelperProvider");
  return ctx;
}
