"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type Locale } from "@/messages";
import {
  generateAccessKey,
  calculateAccessKeyExpiry,
  isAccessKeyExpired,
  getRemainingDays,
  formatAccessKeyNotice,
} from "@/lib/auth/accessKey";

export interface Counselor {
  phone: string;
  name: string;
  languages: Locale[];
  status: "duty" | "break" | "offline";
  lastActive: number;
  region?: string;
  specialty?: string;
  isRegistered?: boolean;
  registeredAt?: number;
  // 3-Month (90-Day) Security Access Key
  accessKey?: string;
  accessKeyIssuedAt?: string;
  accessKeyExpiresAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "counselor" | "system";
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  customerLocale: Locale;
  customerName: string;
  customerPhone?: string;
  status: "waiting" | "active" | "closed";
  counselorPhone?: string;
  counselorName?: string;
  createdAt: number;
  messages: ChatMessage[];
}

interface ChatContextType {
  counselors: Counselor[];
  currentCounselor: Counselor | null;
  sessions: ChatSession[];
  activeDutyCounselors: Counselor[];
  remainingDays: number;
  getDutyCounselorsByLocale: (locale: Locale) => Counselor[];
  loginCounselor: (phone: string, name: string, languages: Locale[]) => void;
  requestCounselorAccessKey: (phone: string) => Promise<{
    success: boolean;
    accessKey: string;
    expiresAt: string;
    notice: ReturnType<typeof formatAccessKeyNotice>;
  }>;
  verifyCounselorAccessKey: (
    phoneOrKey: string,
    maybeKey?: string,
  ) => Promise<{ success: boolean; counselor?: Counselor; error?: string }>;
  registerCounselor: (data: {
    phone: string;
    name: string;
    languages: Locale[];
    region?: string;
    specialty?: string;
    accessKey?: string;
    accessKeyExpiresAt?: string;
  }) => void;
  logoutCounselor: () => void;
  updateCounselorStatus: (status: "duty" | "break") => void;
  updateCounselorLanguages: (languages: Locale[]) => void;
  createChatSession: (
    locale: Locale,
    customerName: string,
    initialMessage?: string,
  ) => string;
  sendMessage: (
    sessionId: string,
    sender: "customer" | "counselor",
    senderName: string,
    text: string,
  ) => void;
  acceptSession: (sessionId: string, counselor: Counselor) => void;
  closeSession: (sessionId: string) => void;
  getSession: (sessionId: string) => ChatSession | undefined;
}

const ChatContext = createContext<ChatContextType | null>(null);

const STORAGE_KEY_COUNSELORS = "life_help_chat_counselors";
const STORAGE_KEY_SESSIONS = "life_help_chat_sessions";
const STORAGE_KEY_CURRENT_COUNSELOR = "life_help_chat_current_counselor";
const CHAT_UPDATE_EVENT = "life_help_chat_state_update";

// Initial seed counselors so the platform has active multilingual counselors out-of-the-box
export const SEED_COUNSELORS: Counselor[] = [
  {
    phone: "010-3321-7788",
    name: "Nguyen Thi Huong (응우옌 티 흐엉)",
    languages: ["vi", "ko", "en"],
    status: "duty",
    lastActive: Date.now() - 300000,
    region: "전북 익산시 / 전주시",
    specialty: "베트남어 다문화 통역 및 설비 상담",
    accessKey: "LH-6621-NTH3-8812-2026",
    accessKeyIssuedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 80 * 86400000).toISOString(),
  },
  {
    phone: "010-8876-1122",
    name: "Wang Wei (왕웨이)",
    languages: ["zh-Hans", "zh-Hant", "ko", "en"],
    status: "duty",
    lastActive: Date.now() - 900000,
    region: "서울 영등포구 / 구로구",
    specialty: "중국어 긴급 접수 및 주거 분쟁 상담",
    accessKey: "LH-3341-WW92-5510-2026",
    accessKeyIssuedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 65 * 86400000).toISOString(),
  },
  {
    phone: "010-5544-9988",
    name: "Elena Ivanova (엘레나)",
    languages: ["ru", "uz", "ko", "en"],
    status: "duty",
    lastActive: Date.now() - 1200000,
    region: "경기 안산시 / 화성시",
    specialty: "러시아·우즈베크어 현장 통역 및 보일러 상담",
    accessKey: "LH-7782-ELI4-1193-2026",
    accessKeyIssuedAt: new Date(Date.now() - 82 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 8 * 86400000).toISOString(),
  },
  {
    phone: "010-7765-4321",
    name: "John Miller (존 밀러)",
    languages: ["en", "ko"],
    status: "break",
    lastActive: Date.now() - 3600000 * 3,
    region: "서울 용산구 / 평택시",
    specialty: "영어권 외국인 임대차 및 누수 배관 상담",
    accessKey: "LH-4412-JM88-3329-2026",
    accessKeyIssuedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 45 * 86400000).toISOString(),
  },
  {
    phone: "010-9988-3344",
    name: "김민수 (한국어 수석 상담원)",
    languages: ["ko", "en"],
    status: "duty",
    lastActive: Date.now() - 60000,
    region: "전국 총괄 / 본사 지원센터",
    specialty: "긴급 배관 동파 및 헬퍼 출동 관제 총괄",
    accessKey: "LH-1100-KMS9-4455-2026",
    accessKeyIssuedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    accessKeyExpiresAt: new Date(Date.now() + 85 * 86400000).toISOString(),
  },
];

function notifyChatUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHAT_UPDATE_EVENT));
  }
}

export function getStoredCounselors(): Counselor[] {
  if (typeof window === "undefined") return SEED_COUNSELORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUNSELORS);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_KEY_COUNSELORS, JSON.stringify(SEED_COUNSELORS));
    return SEED_COUNSELORS;
  } catch {
    return SEED_COUNSELORS;
  }
}

function getInitialCounselors(): Counselor[] {
  return getStoredCounselors();
}

function getInitialSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

function getInitialCurrentCounselor(): Counselor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_COUNSELOR);
    if (raw) {
      const parsed: Counselor = JSON.parse(raw);
      // Invalidate if 90-day access key has expired
      if (parsed.accessKeyExpiresAt && isAccessKeyExpired(parsed.accessKeyExpiresAt)) {
        localStorage.removeItem(STORAGE_KEY_CURRENT_COUNSELOR);
        return null;
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [counselors, setCounselors] = useState<Counselor[]>(getInitialCounselors);
  const [currentCounselor, setCurrentCounselor] = useState<Counselor | null>(getInitialCurrentCounselor);
  const [sessions, setSessions] = useState<ChatSession[]>(getInitialSessions);

  const remainingDays = currentCounselor?.accessKeyExpiresAt
    ? getRemainingDays(currentCounselor.accessKeyExpiresAt)
    : 0;

  useEffect(() => {
    const handleUpdate = () => {
      setCounselors(getInitialCounselors());
      setSessions(getInitialSessions());
      setCurrentCounselor(getInitialCurrentCounselor());
    };
    window.addEventListener(CHAT_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(CHAT_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const persistCounselors = useCallback((updated: Counselor[]) => {
    setCounselors(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_COUNSELORS, JSON.stringify(updated));
      notifyChatUpdate();
    }
  }, []);

  const persistSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
      notifyChatUpdate();
    }
  }, []);

  const getDutyCounselorsByLocale = useCallback(
    (locale: Locale) => {
      return counselors.filter(
        (c) => c.status === "duty" && c.languages.includes(locale),
      );
    },
    [counselors],
  );

  const activeDutyCounselors = counselors.filter((c) => c.status === "duty");

  // 3-Month Security Access Key request for Counselors
  const requestCounselorAccessKey = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const key = generateAccessKey("LH");
    const expiresAt = calculateAccessKeyExpiry(90); // 90 days validity
    const notice = formatAccessKeyNotice({
      phone,
      accessKey: key,
      expiresAt,
      portalName: "상담원(Counselor)",
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `life_help_pending_counselor_key_${cleanPhone}`,
          JSON.stringify({ phone: cleanPhone, accessKey: key, expiresAt })
        );
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      accessKey: key,
      expiresAt,
      notice,
    };
  }, []);

  // Verify access key and log in counselor with 90-day persistence
  const verifyCounselorAccessKey = useCallback(
    async (phoneOrKey: string, maybeKey?: string) => {
      const isSingleKeyCall = maybeKey === undefined;
      const cleanKey = (isSingleKeyCall ? phoneOrKey : maybeKey).trim().toUpperCase();
      let phone = isSingleKeyCall ? "" : phoneOrKey.trim();
      let cleanPhone = phone.replace(/[^0-9]/g, "");

      if (!cleanKey || cleanKey.length < 6) {
        return { success: false, error: "유효한 3개월 보안 접속 코드를 입력해 주세요." };
      }

      let expiresAt = calculateAccessKeyExpiry(90);

      // 1. Try finding counselor by accessKey in counselors list
      let existing = counselors.find(
        (c) => c.accessKey && c.accessKey.trim().toUpperCase() === cleanKey,
      );

      // 2. If phone was also provided, check by phone
      if (!existing && cleanPhone) {
        existing = counselors.find((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone);
      }

      // 3. Check key registry map or pending keys in localStorage
      if (typeof window !== "undefined") {
        try {
          const keyMapRaw = localStorage.getItem("life_help_counselor_key_map");
          if (keyMapRaw) {
            const keyMap = JSON.parse(keyMapRaw);
            const mapped = keyMap[cleanKey];
            if (mapped) {
              if (!existing && mapped.phone) {
                existing =
                  counselors.find(
                    (c) => c.phone.replace(/[^0-9]/g, "") === mapped.phone.replace(/[^0-9]/g, ""),
                  ) || mapped;
              }
              if (mapped.expiresAt) expiresAt = mapped.expiresAt;
            }
          }

          if (cleanPhone) {
            const raw = localStorage.getItem(`life_help_pending_counselor_key_${cleanPhone}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.expiresAt) expiresAt = parsed.expiresAt;
            }
          }
        } catch {
          // ignore
        }
      }

      if (existing) {
        phone = existing.phone;
        cleanPhone = phone.replace(/[^0-9]/g, "");
      } else {
        if (!phone) {
          phone = `010-C${cleanKey.slice(-4)}`;
          cleanPhone = phone.replace(/[^0-9]/g, "");
        }
      }

      const nowIso = new Date().toISOString();
      const counselor: Counselor = existing
        ? {
            ...existing,
            status: "duty",
            lastActive: Date.now(),
            accessKey: cleanKey,
            accessKeyIssuedAt: nowIso,
            accessKeyExpiresAt: expiresAt,
          }
        : {
            phone,
            name: `상담원 (${cleanKey.slice(-4)})`,
            languages: ["ko", "vi", "en"],
            status: "duty",
            lastActive: Date.now(),
            accessKey: cleanKey,
            accessKeyIssuedAt: nowIso,
            accessKeyExpiresAt: expiresAt,
          };

      const updated = counselors.some((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone)
        ? counselors.map((c) => (c.phone.replace(/[^0-9]/g, "") === cleanPhone ? counselor : c))
        : [...counselors, counselor];

      persistCounselors(updated);
      setCurrentCounselor(counselor);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CURRENT_COUNSELOR, JSON.stringify(counselor));
        try {
          if (cleanPhone) {
            localStorage.removeItem(`life_help_pending_counselor_key_${cleanPhone}`);
          }
          const keyMapRaw = localStorage.getItem("life_help_counselor_key_map") || "{}";
          const keyMap = JSON.parse(keyMapRaw);
          keyMap[cleanKey] = counselor;
          localStorage.setItem("life_help_counselor_key_map", JSON.stringify(keyMap));
        } catch {
          // ignore
        }
        notifyChatUpdate();
      }

      return { success: true, counselor };
    },
    [counselors, persistCounselors],
  );

  const loginCounselor = useCallback(
    (phone: string, name: string, languages: Locale[]) => {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const existing = counselors.find((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone);
      const nowIso = new Date().toISOString();
      const expiresAt = calculateAccessKeyExpiry(90);

      const counselor: Counselor = existing
        ? {
            ...existing,
            name: name || existing.name,
            languages: languages.length > 0 ? languages : existing.languages,
            status: "duty",
            lastActive: Date.now(),
            accessKeyIssuedAt: existing.accessKeyIssuedAt || nowIso,
            accessKeyExpiresAt: existing.accessKeyExpiresAt || expiresAt,
          }
        : {
            phone,
            name: name || `상담원 (${phone.slice(-4)})`,
            languages: languages.length > 0 ? languages : ["ko", "vi", "en"],
            status: "duty",
            lastActive: Date.now(),
            accessKey: generateAccessKey("LH"),
            accessKeyIssuedAt: nowIso,
            accessKeyExpiresAt: expiresAt,
          };

      const updated = counselors.some((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone)
        ? counselors.map((c) => (c.phone.replace(/[^0-9]/g, "") === cleanPhone ? counselor : c))
        : [...counselors, counselor];

      persistCounselors(updated);
      setCurrentCounselor(counselor);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CURRENT_COUNSELOR, JSON.stringify(counselor));
        notifyChatUpdate();
      }
    },
    [counselors, persistCounselors],
  );

  const registerCounselor = useCallback(
    (data: {
      phone: string;
      name: string;
      languages: Locale[];
      region?: string;
      specialty?: string;
      accessKey?: string;
      accessKeyExpiresAt?: string;
    }) => {
      const cleanPhone = data.phone.replace(/[^0-9]/g, "");
      const existing = counselors.find((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone);
      const nowIso = new Date().toISOString();
      const expiresAt = data.accessKeyExpiresAt || calculateAccessKeyExpiry(90);
      const accessKey = data.accessKey || generateAccessKey("LH");

      const counselor: Counselor = {
        phone: data.phone,
        name: data.name || (existing ? existing.name : `상담원 (${data.phone.slice(-4)})`),
        languages: data.languages.length > 0 ? data.languages : (existing ? existing.languages : ["ko", "vi"]),
        status: "duty",
        lastActive: Date.now(),
        region: data.region || existing?.region,
        specialty: data.specialty || existing?.specialty,
        isRegistered: true,
        registeredAt: existing?.registeredAt || Date.now(),
        accessKey,
        accessKeyIssuedAt: nowIso,
        accessKeyExpiresAt: expiresAt,
      };

      const updated = counselors.some((c) => c.phone.replace(/[^0-9]/g, "") === cleanPhone)
        ? counselors.map((c) => (c.phone.replace(/[^0-9]/g, "") === cleanPhone ? counselor : c))
        : [...counselors, counselor];

      persistCounselors(updated);
      setCurrentCounselor(counselor);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_CURRENT_COUNSELOR, JSON.stringify(counselor));
        try {
          const keyMapRaw = localStorage.getItem("life_help_counselor_key_map") || "{}";
          const keyMap = JSON.parse(keyMapRaw);
          keyMap[accessKey] = counselor;
          localStorage.setItem("life_help_counselor_key_map", JSON.stringify(keyMap));
        } catch {
          // ignore
        }
        notifyChatUpdate();
      }
    },
    [counselors, persistCounselors],
  );

  const logoutCounselor = useCallback(() => {
    if (!currentCounselor) return;
    const updated = counselors.map((c) =>
      c.phone === currentCounselor.phone ? { ...c, status: "offline" as const } : c,
    );
    persistCounselors(updated);
    setCurrentCounselor(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_CURRENT_COUNSELOR);
      notifyChatUpdate();
    }
  }, [counselors, currentCounselor, persistCounselors]);

  const updateCounselorStatus = useCallback(
    (status: "duty" | "break") => {
      if (!currentCounselor) return;
      const updatedCounselor: Counselor = {
        ...currentCounselor,
        status,
        lastActive: Date.now(),
      };
      const updated = counselors.map((c) =>
        c.phone === currentCounselor.phone ? updatedCounselor : c,
      );
      persistCounselors(updated);
      setCurrentCounselor(updatedCounselor);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_COUNSELOR,
          JSON.stringify(updatedCounselor),
        );
        notifyChatUpdate();
      }
    },
    [counselors, currentCounselor, persistCounselors],
  );

  const updateCounselorLanguages = useCallback(
    (languages: Locale[]) => {
      if (!currentCounselor) return;
      const updatedCounselor: Counselor = {
        ...currentCounselor,
        languages,
        lastActive: Date.now(),
      };
      const updated = counselors.map((c) =>
        c.phone === currentCounselor.phone ? updatedCounselor : c,
      );
      persistCounselors(updated);
      setCurrentCounselor(updatedCounselor);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY_CURRENT_COUNSELOR,
          JSON.stringify(updatedCounselor),
        );
        notifyChatUpdate();
      }
    },
    [counselors, currentCounselor, persistCounselors],
  );

  const createChatSession = useCallback(
    (locale: Locale, customerName: string, initialMessage?: string) => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const dutyCounselors = counselors.filter(
        (c) => c.status === "duty" && c.languages.includes(locale),
      );

      const assignedCounselor = dutyCounselors.length > 0 ? dutyCounselors[0] : null;

      const initialMessages: ChatMessage[] = [
        {
          id: `msg_sys_${Date.now()}`,
          sender: "system",
          senderName: "LIFE.HELP 시스템",
          text: assignedCounselor
            ? `담당 상담원 [${assignedCounselor.name}] 님이 배정되었습니다. 편안하게 모국어로 문의해 주세요.`
            : "현재 연결 가능한 전문 상담원을 확인 중입니다. 잠시만 기다려 주시면 곧 친절히 안내해 드리겠습니다.",
          timestamp: Date.now(),
        },
      ];

      if (initialMessage && initialMessage.trim()) {
        initialMessages.push({
          id: `msg_cust_${Date.now() + 1}`,
          sender: "customer",
          senderName: customerName || "고객",
          text: initialMessage.trim(),
          timestamp: Date.now() + 1,
        });
      }

      const newSession: ChatSession = {
        id: sessionId,
        customerLocale: locale,
        customerName: customerName || "고객",
        status: assignedCounselor ? "active" : "waiting",
        counselorPhone: assignedCounselor ? assignedCounselor.phone : undefined,
        counselorName: assignedCounselor ? assignedCounselor.name : undefined,
        createdAt: Date.now(),
        messages: initialMessages,
      };

      const updated = [newSession, ...sessions];
      persistSessions(updated);
      return sessionId;
    },
    [counselors, persistSessions, sessions],
  );

  const sendMessage = useCallback(
    (
      sessionId: string,
      sender: "customer" | "counselor",
      senderName: string,
      text: string,
    ) => {
      if (!text.trim()) return;

      const updated = sessions.map((s) => {
        if (s.id !== sessionId) return s;

        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sender,
          senderName,
          text: text.trim(),
          timestamp: Date.now(),
        };

        return {
          ...s,
          messages: [...s.messages, newMsg],
        };
      });

      persistSessions(updated);
    },
    [persistSessions, sessions],
  );

  const acceptSession = useCallback(
    (sessionId: string, counselor: Counselor) => {
      const updated = sessions.map((s) => {
        if (s.id !== sessionId) return s;

        const sysMsg: ChatMessage = {
          id: `msg_sys_${Date.now()}`,
          sender: "system",
          senderName: "LIFE.HELP 시스템",
          text: `상담원 [${counselor.name}] 님이 배정되어 상담이 시작되었습니다.`,
          timestamp: Date.now(),
        };

        return {
          ...s,
          status: "active" as const,
          counselorPhone: counselor.phone,
          counselorName: counselor.name,
          messages: [...s.messages, sysMsg],
        };
      });

      persistSessions(updated);
    },
    [persistSessions, sessions],
  );

  const closeSession = useCallback(
    (sessionId: string) => {
      const updated = sessions.map((s) => {
        if (s.id !== sessionId) return s;

        const sysMsg: ChatMessage = {
          id: `msg_sys_${Date.now()}`,
          sender: "system",
          senderName: "LIFE.HELP 시스템",
          text: "상담이 종료되었습니다. 이용해 주셔서 대단히 감사합니다.",
          timestamp: Date.now(),
        };

        return {
          ...s,
          status: "closed" as const,
          messages: [...s.messages, sysMsg],
        };
      });

      persistSessions(updated);
    },
    [persistSessions, sessions],
  );

  const getSession = useCallback(
    (sessionId: string) => {
      return sessions.find((s) => s.id === sessionId);
    },
    [sessions],
  );

  return (
    <ChatContext.Provider
      value={{
        counselors,
        currentCounselor,
        sessions,
        activeDutyCounselors,
        remainingDays,
        getDutyCounselorsByLocale,
        loginCounselor,
        requestCounselorAccessKey,
        verifyCounselorAccessKey,
        registerCounselor,
        logoutCounselor,
        updateCounselorStatus,
        updateCounselorLanguages,
        createChatSession,
        sendMessage,
        acceptSession,
        closeSession,
        getSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
