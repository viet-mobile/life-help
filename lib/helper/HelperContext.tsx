"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  generateAccessKey,
  calculateAccessKeyExpiry,
  isAccessKeyExpired,
  getRemainingDays,
  formatAccessKeyNotice,
} from "@/lib/auth/accessKey";

export interface HelperRegionItem {
  sido: string;
  gungu: string;
}

export interface HelperContract {
  name: string;
  residentNumber: string; // Stored securely/locally, masked in UI
  phone: string;
  services: string[]; // List of service slugs
  regions: HelperRegionItem[]; // List of regions
  availableDays: string[]; // e.g. ["월", "화", "수", "목", "금"]
  availableHours: string; // e.g. "09:00 - 18:00" or "24시간"
  dayHours?: Record<string, string>; // e.g. { "월": "24시간", "화": "09:00 - 18:00", ... }
  excludedDates?: string[]; // e.g. ["2026-09-18", "2026-10-03"] (개별 uncheck 휴무일)
  extraWorkDates?: string[]; // e.g. ["2026-09-20"] (개별 추가 근무일)
  signedAt: string;
  signatureDataUrl?: string;
  agreedToTerms: boolean;
}

export interface HelperProfile {
  phone: string;
  isVerified: boolean;
  isActive: boolean; // 실시간 가용 상태 (즉시 출동 가능 vs 일시적 업무 중단)
  contract?: HelperContract;
  lastStatusUpdatedAt?: string;
  // 3-Month (90-Day) Security Access Key
  accessKey?: string;
  accessKeyIssuedAt?: string;
  accessKeyExpiresAt?: string;
}

// Initial seed helpers across regions for sys.life.help administration
export const SEED_HELPERS: HelperProfile[] = [
  {
    phone: "010-3456-7890",
    isVerified: true,
    isActive: true,
    accessKey: "LH-8291-KCS4-9921-2026",
    accessKeyIssuedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 75 * 86400000).toISOString(),
    lastStatusUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    contract: {
      name: "김철수",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-3456-7890",
      services: ["toilet-clog", "sink-drain", "floor-drain", "pipe-thaw", "high-pressure"],
      regions: [
        { sido: "전북특별자치도", gungu: "익산시" },
        { sido: "전북특별자치도", gungu: "전주시" },
      ],
      availableDays: ["월", "화", "수", "목", "금", "토"],
      availableHours: "24시간 즉시 출동 가능",
      dayHours: {
        월: "24시간 즉시 출동 가능",
        화: "24시간 즉시 출동 가능",
        수: "24시간 즉시 출동 가능",
        목: "24시간 즉시 출동 가능",
        금: "24시간 즉시 출동 가능",
        토: "주간 (09:00 ~ 18:00)",
      },
      excludedDates: ["2026-09-20", "2026-10-03"],
      extraWorkDates: [],
      signedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      signatureDataUrl: "김철수 (서명 완료)",
      agreedToTerms: true,
    },
  },
  {
    phone: "010-2345-6789",
    isVerified: true,
    isActive: true,
    accessKey: "LH-5120-PYH7-3184-2026",
    accessKeyIssuedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 70 * 86400000).toISOString(),
    lastStatusUpdatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    contract: {
      name: "박영희",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-2345-6789",
      services: ["boiler-repair", "water-heater", "pipe-freeze", "floor-heating"],
      regions: [
        { sido: "서울특별시", gungu: "강남구" },
        { sido: "서울특별시", gungu: "서초구" },
        { sido: "서울특별시", gungu: "송파구" },
      ],
      availableDays: ["월", "화", "수", "목", "금"],
      availableHours: "주간 (09:00 ~ 18:00)",
      dayHours: {
        월: "주간 (09:00 ~ 18:00)",
        화: "주간 (09:00 ~ 18:00)",
        수: "주간 (09:00 ~ 18:00)",
        목: "주간 (09:00 ~ 18:00)",
        금: "주간 (09:00 ~ 18:00)",
      },
      excludedDates: ["2026-09-25"],
      extraWorkDates: [],
      signedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      signatureDataUrl: "박영희 (전자서명)",
      agreedToTerms: true,
    },
  },
  {
    phone: "010-4567-8901",
    isVerified: true,
    isActive: false, // Currently on break
    accessKey: "LH-9932-LJH1-4482-2026",
    accessKeyIssuedAt: new Date(Date.now() - 85 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 5 * 86400000).toISOString(), // Expiring in 5 days!
    lastStatusUpdatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    contract: {
      name: "이준호",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-4567-8901",
      services: ["leak-detection", "waterproofing", "roof-leak", "pipe-inspection"],
      regions: [
        { sido: "경기도", gungu: "수원시" },
        { sido: "경기도", gungu: "화성시" },
        { sido: "경기도", gungu: "용인시" },
      ],
      availableDays: ["화", "수", "목", "금", "토", "일"],
      availableHours: "24시간 즉시 출동 가능",
      dayHours: {
        화: "24시간 즉시 출동 가능",
        수: "24시간 즉시 출동 가능",
        목: "24시간 즉시 출동 가능",
        금: "24시간 즉시 출동 가능",
        토: "야간 및 긴급 (18:00 ~ 익일 09:00)",
        일: "야간 및 긴급 (18:00 ~ 익일 09:00)",
      },
      excludedDates: ["2026-09-18", "2026-09-19"],
      extraWorkDates: [],
      signedAt: new Date(Date.now() - 85 * 86400000).toISOString(),
      signatureDataUrl: "이준호 (서명 완료)",
      agreedToTerms: true,
    },
  },
  {
    phone: "010-9876-5432",
    isVerified: true,
    isActive: true,
    accessKey: "LH-7721-NVH5-6612-2026",
    accessKeyIssuedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 80 * 86400000).toISOString(),
    lastStatusUpdatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    contract: {
      name: "응우옌 반 훙 (Nguyen Van Hung)",
      residentNumber: "AUTH-VERIFIED",
      phone: "010-9876-5432",
      services: ["toilet-clog", "sink-drain", "floor-drain", "faucet-replacement"],
      regions: [
        { sido: "전북특별자치도", gungu: "익산시" },
        { sido: "전북특별자치도", gungu: "군산시" },
      ],
      availableDays: ["월", "화", "수", "목", "금"],
      availableHours: "주간 (09:00 ~ 18:00)",
      dayHours: {
        월: "주간 (09:00 ~ 18:00)",
        화: "주간 (09:00 ~ 18:00)",
        수: "주간 (09:00 ~ 18:00)",
        목: "주간 (09:00 ~ 18:00)",
        금: "주간 (09:00 ~ 18:00)",
      },
      excludedDates: [],
      extraWorkDates: [],
      signedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      signatureDataUrl: "Nguyen Van Hung (Verified)",
      agreedToTerms: true,
    },
  },
];

interface HelperContextType {
  helper: HelperProfile | null;
  isLoggedIn: boolean;
  hasContract: boolean;
  remainingDays: number;
  loginPhone: (phone: string) => Promise<boolean>;
  verifyPhoneCode: (phone: string, code: string) => Promise<boolean>;
  requestAccessKey: (phone: string) => Promise<{
    success: boolean;
    accessKey: string;
    expiresAt: string;
    notice: ReturnType<typeof formatAccessKeyNotice>;
  }>;
  verifyAccessKey: (
    keyOrPhone: string,
    maybeKey?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  registerHelper: (data: {
    name: string;
    phone: string;
    regions?: HelperRegionItem[];
    services?: string[];
    accessKey?: string;
    accessKeyExpiresAt?: string;
  }) => void;
  saveContract: (contract: Omit<HelperContract, "phone" | "signedAt">) => void;
  toggleActiveStatus: () => void;
  updateServices: (services: string[]) => void;
  updateRegions: (regions: HelperRegionItem[]) => void;
  updateSchedule: (
    days: string[],
    hours: string,
    dayHours?: Record<string, string>,
    excludedDates?: string[],
    extraWorkDates?: string[],
  ) => void;
  logout: () => void;
}

const HelperContext = createContext<HelperContextType | null>(null);

const HELPER_STORAGE_KEY = "life_help_helper_profile";
const HELPER_CHANGE_EVENT = "life_help_helper_change";
export const HELPERS_REGISTRY_KEY = "life_help_helpers_registry";

let cachedHelper: HelperProfile | null = null;

// Registry functions for sys.life.help system admin
export function getRegisteredHelpers(): HelperProfile[] {
  if (typeof window === "undefined") return SEED_HELPERS;
  try {
    const raw = localStorage.getItem(HELPERS_REGISTRY_KEY);
    if (!raw) {
      localStorage.setItem(HELPERS_REGISTRY_KEY, JSON.stringify(SEED_HELPERS));
      return SEED_HELPERS;
    }
    const parsed: HelperProfile[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return SEED_HELPERS;
}

export function syncHelperToRegistry(profile: HelperProfile): void {
  if (typeof window === "undefined" || !profile || !profile.phone) return;
  try {
    const registry = getRegisteredHelpers();
    const cleanPhone = profile.phone.replace(/[^0-9]/g, "");
    const existingIndex = registry.findIndex(
      (h) => h.phone.replace(/[^0-9]/g, "") === cleanPhone,
    );

    let updated: HelperProfile[];
    if (existingIndex >= 0) {
      updated = [...registry];
      updated[existingIndex] = { ...updated[existingIndex], ...profile };
    } else {
      updated = [profile, ...registry];
    }
    localStorage.setItem(HELPERS_REGISTRY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function getClientHelperSnapshot(): HelperProfile | null {
  if (cachedHelper !== null) return cachedHelper;
  try {
    const saved = localStorage.getItem(HELPER_STORAGE_KEY);
    if (saved) {
      const parsed: HelperProfile = JSON.parse(saved);
      // Auto-invalidate if 90-day access key has expired
      if (!parsed.accessKeyExpiresAt || isAccessKeyExpired(parsed.accessKeyExpiresAt)) {
        parsed.isVerified = false;
      }
      cachedHelper = parsed;
      return cachedHelper;
    }
  } catch {
    // ignore
  }
  return null;
}

function getServerHelperSnapshot(): HelperProfile | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === HELPER_STORAGE_KEY) {
      cachedHelper = null;
      callback();
    }
  };
  const handleCustom = () => {
    cachedHelper = null;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(HELPER_CHANGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(HELPER_CHANGE_EVENT, handleCustom);
  };
}

function persistHelper(profile: HelperProfile | null) {
  cachedHelper = profile;
  try {
    if (profile) {
      localStorage.setItem(HELPER_STORAGE_KEY, JSON.stringify(profile));
      syncHelperToRegistry(profile);
    } else {
      localStorage.removeItem(HELPER_STORAGE_KEY);
    }
    window.dispatchEvent(new Event(HELPER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function HelperProvider({ children }: { children: React.ReactNode }) {
  const helper = useSyncExternalStore(
    subscribe,
    getClientHelperSnapshot,
    getServerHelperSnapshot,
  );

  // Initialize seed registry if empty on first load
  React.useEffect(() => {
    getRegisteredHelpers();
  }, []);

  const isExpired = !!helper?.accessKeyExpiresAt && isAccessKeyExpired(helper.accessKeyExpiresAt);
  const isLoggedIn = !!helper && helper.isVerified && !isExpired;
  const hasContract = !!helper?.contract && !!helper.contract.name;
  const remainingDays = helper?.accessKeyExpiresAt ? getRemainingDays(helper.accessKeyExpiresAt) : 0;

  // 3-Month Security Access Key issuance (replaces high-frequency SMS)
  const requestAccessKey = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const key = generateAccessKey("LH");
    const expiresAt = calculateAccessKeyExpiry(90); // 90 days validity
    const notice = formatAccessKeyNotice({
      phone,
      accessKey: key,
      expiresAt,
      portalName: "헬퍼(Helper)",
    });

    try {
      localStorage.setItem(
        `life_help_pending_helper_key_${cleanPhone}`,
        JSON.stringify({ phone: cleanPhone, accessKey: key, expiresAt })
      );
    } catch {
      // ignore
    }

    return {
      success: true,
      accessKey: key,
      expiresAt,
      notice,
    };
  }, []);

  // Verify access key and persist 90-day active session
  const verifyAccessKey = useCallback(async (keyOrPhone: string, maybeKey?: string) => {
    const isSingleKeyCall = maybeKey === undefined;
    const cleanKey = (isSingleKeyCall ? keyOrPhone : maybeKey).trim().toUpperCase();
    let phone = isSingleKeyCall ? "" : keyOrPhone.trim();
    let cleanPhone = phone.replace(/[^0-9]/g, "");

    if (!cleanKey || cleanKey.length < 6) {
      return { success: false, error: "유효한 보안 접속 코드를 입력해 주세요." };
    }

    let expiresAt = calculateAccessKeyExpiry(90);

    // Look in key map
    let savedHelperData: Partial<HelperProfile> | null = null;
    try {
      const keyMapRaw = localStorage.getItem("life_help_helper_key_map");
      if (keyMapRaw) {
        const keyMap = JSON.parse(keyMapRaw);
        if (keyMap[cleanKey]) {
          savedHelperData = keyMap[cleanKey];
          if (savedHelperData?.accessKeyExpiresAt) expiresAt = savedHelperData.accessKeyExpiresAt;
          if (savedHelperData?.phone) {
            phone = savedHelperData.phone;
            cleanPhone = phone.replace(/[^0-9]/g, "");
          }
        }
      }
      if (cleanPhone) {
        const pendingStr = localStorage.getItem(`life_help_pending_helper_key_${cleanPhone}`);
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          if (pending.expiresAt) expiresAt = pending.expiresAt;
        }
      }
    } catch {
      // ignore
    }

    // Also look in SEED_HELPERS
    const seedMatch = SEED_HELPERS.find(
      (s) => s.accessKey?.toUpperCase() === cleanKey || (cleanPhone && s.phone.replace(/[^0-9]/g, "") === cleanPhone)
    );
    if (seedMatch) {
      savedHelperData = seedMatch;
      phone = seedMatch.phone;
      cleanPhone = phone.replace(/[^0-9]/g, "");
      if (seedMatch.accessKeyExpiresAt) expiresAt = seedMatch.accessKeyExpiresAt;
    }

    const existing = getClientHelperSnapshot();
    if (!phone && existing?.phone) {
      phone = existing.phone;
      cleanPhone = phone.replace(/[^0-9]/g, "");
    }
    if (!phone) {
      phone = `010-H${cleanKey.slice(-4)}`;
      cleanPhone = phone.replace(/[^0-9]/g, "");
    }

    const nowIso = new Date().toISOString();

    const defaultContract: HelperContract = {
      name: savedHelperData?.contract?.name || existing?.contract?.name || `헬퍼 (${cleanKey.slice(-4)})`,
      residentNumber: "AUTH-VERIFIED",
      phone: phone.trim(),
      services: savedHelperData?.contract?.services || existing?.contract?.services || [
        "toilet-clog",
        "sink-drain",
        "floor-drain",
      ],
      regions: savedHelperData?.contract?.regions || existing?.contract?.regions || [
        { sido: "전북특별자치도", gungu: "익산시" },
      ],
      availableDays: savedHelperData?.contract?.availableDays || existing?.contract?.availableDays || ["월", "화", "수", "목", "금", "토"],
      availableHours: savedHelperData?.contract?.availableHours || existing?.contract?.availableHours || "24시간 즉시 출동 가능",
      dayHours: savedHelperData?.contract?.dayHours || existing?.contract?.dayHours || {
        월: "24시간 즉시 출동 가능",
        화: "24시간 즉시 출동 가능",
        수: "24시간 즉시 출동 가능",
        목: "24시간 즉시 출동 가능",
        금: "24시간 즉시 출동 가능",
        토: "주간 (09:00 ~ 18:00)",
      },
      excludedDates: savedHelperData?.contract?.excludedDates || existing?.contract?.excludedDates || [],
      extraWorkDates: savedHelperData?.contract?.extraWorkDates || existing?.contract?.extraWorkDates || [],
      signedAt: nowIso,
      agreedToTerms: true,
    };

    const newProfile: HelperProfile = {
      phone: phone.trim(),
      isVerified: true,
      isActive: true,
      contract: (existing && existing.phone.replace(/[^0-9]/g, "") === cleanPhone ? existing.contract : null) || defaultContract,
      accessKey: cleanKey,
      accessKeyIssuedAt: nowIso,
      accessKeyExpiresAt: expiresAt,
      lastStatusUpdatedAt: nowIso,
    };

    persistHelper(newProfile);

    try {
      if (cleanPhone) {
        localStorage.removeItem(`life_help_pending_helper_key_${cleanPhone}`);
      }
      const keyMapRaw = localStorage.getItem("life_help_helper_key_map") || "{}";
      const keyMap = JSON.parse(keyMapRaw);
      keyMap[cleanKey] = newProfile;
      localStorage.setItem("life_help_helper_key_map", JSON.stringify(keyMap));
    } catch {
      // ignore
    }

    return { success: true };
  }, []);

  const registerHelper = useCallback(
    (data: {
      name: string;
      phone: string;
      regions?: HelperRegionItem[];
      services?: string[];
      accessKey?: string;
      accessKeyExpiresAt?: string;
    }) => {
      const cleanPhone = data.phone.replace(/[^0-9]/g, "");
      const nowIso = new Date().toISOString();
      const expiresAt = data.accessKeyExpiresAt || calculateAccessKeyExpiry(90);
      const accessKey = data.accessKey || generateAccessKey("LH");

      const newContract: HelperContract = {
        name: data.name.trim() || `헬퍼 (${cleanPhone.slice(-4)})`,
        residentNumber: "",
        phone: data.phone.trim(),
        services:
          data.services && data.services.length > 0
            ? data.services
            : ["toilet-clog", "sink-drain", "floor-drain"],
        regions:
          data.regions && data.regions.length > 0
            ? data.regions
            : [{ sido: "전북특별자치도", gungu: "익산시" }],
        availableDays: ["월", "화", "수", "목", "금", "토"],
        availableHours: "24시간 즉시 출동 가능",
        dayHours: {
          월: "24시간 즉시 출동 가능",
          화: "24시간 즉시 출동 가능",
          수: "24시간 즉시 출동 가능",
          목: "24시간 즉시 출동 가능",
          금: "24시간 즉시 출동 가능",
          토: "주간 (09:00 ~ 18:00)",
        },
        excludedDates: [],
        extraWorkDates: [],
        signedAt: nowIso,
        agreedToTerms: true,
      };

      const profile: HelperProfile = {
        phone: data.phone.trim(),
        isVerified: true,
        isActive: true,
        contract: newContract,
        accessKey,
        accessKeyIssuedAt: nowIso,
        accessKeyExpiresAt: expiresAt,
        lastStatusUpdatedAt: nowIso,
      };

      persistHelper(profile);

      try {
        const keyMapRaw = localStorage.getItem("life_help_helper_key_map") || "{}";
        const keyMap = JSON.parse(keyMapRaw);
        keyMap[accessKey] = profile;
        localStorage.setItem("life_help_helper_key_map", JSON.stringify(keyMap));
      } catch {
        // ignore
      }
    },
    [],
  );

  // Backward-compatible wrappers for phone verification
  const loginPhone = useCallback(async (phone: string): Promise<boolean> => {
    const res = await requestAccessKey(phone);
    return res.success;
  }, [requestAccessKey]);

  const verifyPhoneCode = useCallback(
    async (phone: string, code: string): Promise<boolean> => {
      const res = await verifyAccessKey(phone, code);
      return res.success;
    },
    [verifyAccessKey],
  );

  const saveContract = useCallback(
    (contractData: Omit<HelperContract, "phone" | "signedAt">) => {
      const current = getClientHelperSnapshot();
      if (!current) return;

      const fullContract: HelperContract = {
        ...contractData,
        phone: current.phone,
        signedAt: new Date().toISOString(),
      };

      persistHelper({
        ...current,
        contract: fullContract,
        isActive: true,
        lastStatusUpdatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const toggleActiveStatus = useCallback(() => {
    const current = getClientHelperSnapshot();
    if (!current) return;

    persistHelper({
      ...current,
      isActive: !current.isActive,
      lastStatusUpdatedAt: new Date().toISOString(),
    });
  }, []);

  const updateServices = useCallback((newServices: string[]) => {
    const current = getClientHelperSnapshot();
    if (!current || !current.contract) return;

    persistHelper({
      ...current,
      contract: {
        ...current.contract,
        services: newServices,
      },
      lastStatusUpdatedAt: new Date().toISOString(),
    });
  }, []);

  const updateRegions = useCallback((newRegions: HelperRegionItem[]) => {
    const current = getClientHelperSnapshot();
    if (!current || !current.contract) return;

    persistHelper({
      ...current,
      contract: {
        ...current.contract,
        regions: newRegions,
      },
      lastStatusUpdatedAt: new Date().toISOString(),
    });
  }, []);

  const updateSchedule = useCallback(
    (
      days: string[],
      hours: string,
      dayHours?: Record<string, string>,
      excludedDates?: string[],
      extraWorkDates?: string[],
    ) => {
      const current = getClientHelperSnapshot();
      if (!current || !current.contract) return;

      const updatedContract: HelperContract = {
        ...current.contract,
        availableDays: days,
        availableHours: hours,
        dayHours: dayHours !== undefined ? dayHours : current.contract.dayHours,
        excludedDates: excludedDates !== undefined ? excludedDates : current.contract.excludedDates || [],
        extraWorkDates: extraWorkDates !== undefined ? extraWorkDates : current.contract.extraWorkDates || [],
      };

      persistHelper({
        ...current,
        contract: updatedContract,
        lastStatusUpdatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const logout = useCallback(() => {
    persistHelper(null);
  }, []);

  return (
    <HelperContext.Provider
      value={{
        helper,
        isLoggedIn,
        hasContract,
        remainingDays,
        loginPhone,
        verifyPhoneCode,
        requestAccessKey,
        verifyAccessKey,
        registerHelper,
        saveContract,
        toggleActiveStatus,
        updateServices,
        updateRegions,
        updateSchedule,
        logout,
      }}
    >
      {children}
    </HelperContext.Provider>
  );
}

export function useHelper(): HelperContextType {
  const ctx = useContext(HelperContext);
  if (!ctx) {
    throw new Error("useHelper must be used within a HelperProvider");
  }
  return ctx;
}
