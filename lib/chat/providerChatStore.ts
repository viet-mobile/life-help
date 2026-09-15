"use client";

import { type Locale } from "@/messages";

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  avatarIcon: string;
  serviceCategories: string[]; // e.g. ["clog-clearing", "leak-plumbing", "boiler", "bank-help"]
  country: string;
  sido: string;
  gungu?: string;
  primaryLocale: Locale; // Provider's native spoken language (e.g. "ko")
  spokenLocales: Locale[];
  onDuty: boolean; // Currently active/working
  dutyHours: string;
  rating: number;
  completedJobs: number;
}

export interface ProviderChatMessage {
  id: string;
  sessionId: string;
  sender: "customer" | "provider" | "system";
  senderName: string;
  senderLocale: Locale;
  text: string; // Original text in sender's language
  translatedText?: string; // Translated into recipient's language
  recipientLocale: Locale;
  timestamp: number;
}

export interface ProviderChatSession {
  id: string;
  serviceSlug: string;
  serviceName: string;
  country: string;
  sido: string;
  gungu: string;
  customerName: string;
  customerPhone?: string;
  customerLocale: Locale;
  provider: ServiceProvider;
  status: "active" | "waiting" | "closed";
  createdAt: number;
  messages: ProviderChatMessage[];
  problemDescription?: string;
  selectedOptions?: string[];
}

const STORAGE_PROVIDERS_KEY = "life_help_service_providers_v2";
const STORAGE_SESSIONS_KEY = "life_help_provider_chat_sessions_v2";
const CHAT_EVENT = "life_help_provider_chat_update";

// Seed On-Duty Service Providers ready to connect immediately
export const SEED_SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    id: "prov-1",
    name: "박준혁 마스터 헬퍼 (배관/설비 전문)",
    phone: "010-4829-1122",
    avatarIcon: "🔧",
    serviceCategories: ["clog-clearing", "leak-plumbing", "boiler", "toilet-clog", "sink-clog", "drain-clog"],
    country: "KR",
    sido: "전북특별자치도",
    gungu: "익산시",
    primaryLocale: "ko",
    spokenLocales: ["ko"],
    onDuty: true,
    dutyHours: "08:00 ~ 22:00",
    rating: 4.95,
    completedJobs: 412,
  },
  {
    id: "prov-2",
    name: "김민재 긴급설비 마스터 (서울/수도권)",
    phone: "010-8274-9912",
    avatarIcon: "🚰",
    serviceCategories: ["clog-clearing", "leak-plumbing", "boiler", "toilet-clog", "sink-clog", "drain-clog"],
    country: "KR",
    sido: "서울특별시",
    gungu: "영등포구",
    primaryLocale: "ko",
    spokenLocales: ["ko", "en"],
    onDuty: true,
    dutyHours: "24시간 긴급 출동",
    rating: 5.0,
    completedJobs: 628,
  },
  {
    id: "prov-3",
    name: "최영훈 원룸/주거케어 전문 헬퍼",
    phone: "010-5541-7788",
    avatarIcon: "🏠",
    serviceCategories: ["housing", "cleaning"],
    country: "KR",
    sido: "전북특별자치도",
    gungu: "전주시 덕진구",
    primaryLocale: "ko",
    spokenLocales: ["ko"],
    onDuty: true,
    dutyHours: "09:00 ~ 20:00",
    rating: 4.88,
    completedJobs: 215,
  },
  {
    id: "prov-4",
    name: "Nguyen Van Nam (응우옌 반 남 - 생활지원 파트너)",
    phone: "010-9988-4433",
    avatarIcon: "🤝",
    serviceCategories: ["bank-help", "insurance-help", "hospital-help", "mobile-help", "job-help"],
    country: "KR",
    sido: "전북특별자치도",
    gungu: "익산시",
    primaryLocale: "vi",
    spokenLocales: ["vi", "ko"],
    onDuty: true,
    dutyHours: "09:00 ~ 21:00",
    rating: 4.96,
    completedJobs: 330,
  },
  {
    id: "prov-5",
    name: "Global Master Plumber (David Wilson)",
    phone: "+1-213-555-0199",
    avatarIcon: "🛠️",
    serviceCategories: ["clog-clearing", "leak-plumbing", "boiler"],
    country: "US",
    sido: "California",
    gungu: "Los Angeles",
    primaryLocale: "en",
    spokenLocales: ["en"],
    onDuty: true,
    dutyHours: "07:00 ~ 20:00",
    rating: 4.92,
    completedJobs: 520,
  },
];

export function getStoredProviders(): ServiceProvider[] {
  if (typeof window === "undefined") return SEED_SERVICE_PROVIDERS;
  try {
    const raw = localStorage.getItem(STORAGE_PROVIDERS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_PROVIDERS_KEY, JSON.stringify(SEED_SERVICE_PROVIDERS));
    return SEED_SERVICE_PROVIDERS;
  } catch {
    return SEED_SERVICE_PROVIDERS;
  }
}

export function getStoredChatSessions(): ProviderChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHAT_EVENT));
  }
}

/**
 * Finds an active, on-duty service provider matching the requested service & region.
 * Falls back to nationwide or default on-duty provider for that service category.
 */
export function findMatchingOnDutyProvider(
  serviceSlug: string,
  country: string,
  sido?: string,
  gungu?: string
): ServiceProvider | null {
  const providers = getStoredProviders();
  const onDutyList = providers.filter((p) => p.onDuty);

  // 1. Strict match: Country + Sido + Gungu + Service
  if (gungu) {
    const matchedStrict = onDutyList.find(
      (p) =>
        p.country === country &&
        p.sido === sido &&
        p.gungu === gungu &&
        p.serviceCategories.includes(serviceSlug)
    );
    if (matchedStrict) return matchedStrict;
  }

  // 2. Regional match: Country + Sido + Service
  if (sido) {
    const matchedRegion = onDutyList.find(
      (p) =>
        p.country === country &&
        p.sido === sido &&
        p.serviceCategories.includes(serviceSlug)
    );
    if (matchedRegion) return matchedRegion;
  }

  // 3. Country match: Country + Service
  const matchedCountry = onDutyList.find(
    (p) => p.country === country && p.serviceCategories.includes(serviceSlug)
  );
  if (matchedCountry) return matchedCountry;

  // 4. Any on-duty provider qualified for this service
  const matchedService = onDutyList.find((p) =>
    p.serviceCategories.includes(serviceSlug)
  );
  if (matchedService) return matchedService;

  // 5. Default on-duty provider fallback
  return onDutyList[0] || null;
}

/**
 * Translates text via /api/translate
 */
export async function translateBilingual(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || !text.trim() || sourceLang === targetLang) {
    return text;
  }

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.translatedText || text;
    }
  } catch {
    // ignore
  }

  return text;
}

/**
 * Creates a real-time bilingual chat session between a Customer and an On-Duty Service Provider
 */
export async function createProviderChatSession(params: {
  serviceSlug: string;
  serviceName: string;
  country: string;
  sido: string;
  gungu: string;
  customerName: string;
  customerPhone?: string;
  customerLocale: Locale;
  initialMessage?: string;
  selectedOptions?: string[];
}): Promise<ProviderChatSession> {
  const provider =
    findMatchingOnDutyProvider(
      params.serviceSlug,
      params.country,
      params.sido,
      params.gungu
    ) || SEED_SERVICE_PROVIDERS[0];

  const sessionId = `pcs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // System greeting message
  const initialMessages: ProviderChatMessage[] = [
    {
      id: `pmsg_sys_${Date.now()}`,
      sessionId,
      sender: "system",
      senderName: "LIFE.HELP 시스템",
      senderLocale: "ko",
      text: `선택하신 지역 [${params.sido} ${params.gungu}]의 근무 중인 전담 헬퍼 [${provider.name}] 님과 실시간 1:1 대화방이 연결되었습니다. 실시간 자동 번역으로 언어 장벽 없이 대화하실 수 있습니다.`,
      translatedText:
        params.customerLocale !== "ko"
          ? `Connected in real-time with on-duty specialist [${provider.name}] for [${params.sido} ${params.gungu}]. Messages are automatically translated in real-time.`
          : undefined,
      recipientLocale: params.customerLocale,
      timestamp: Date.now(),
    },
  ];

  // If customer included an initial problem description or options:
  if (params.initialMessage && params.initialMessage.trim()) {
    const rawText = params.initialMessage.trim();
    let translatedForProvider = rawText;

    if (params.customerLocale !== provider.primaryLocale) {
      translatedForProvider = await translateBilingual(
        rawText,
        params.customerLocale,
        provider.primaryLocale
      );
    }

    initialMessages.push({
      id: `pmsg_cust_${Date.now() + 1}`,
      sessionId,
      sender: "customer",
      senderName: params.customerName || "고객",
      senderLocale: params.customerLocale,
      text: rawText,
      translatedText: translatedForProvider,
      recipientLocale: provider.primaryLocale,
      timestamp: Date.now() + 1,
    });
  }

  const newSession: ProviderChatSession = {
    id: sessionId,
    serviceSlug: params.serviceSlug,
    serviceName: params.serviceName,
    country: params.country,
    sido: params.sido,
    gungu: params.gungu,
    customerName: params.customerName || "고객",
    customerPhone: params.customerPhone,
    customerLocale: params.customerLocale,
    provider,
    status: "active",
    createdAt: Date.now(),
    messages: initialMessages,
    problemDescription: params.initialMessage,
    selectedOptions: params.selectedOptions,
  };

  const currentSessions = getStoredChatSessions();
  const updated = [newSession, ...currentSessions];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    notifyUpdate();
  }

  return newSession;
}

/**
 * Sends a message in the chat session with automatic real-time bidirectional translation
 */
export async function sendProviderChatMessage(
  sessionId: string,
  sender: "customer" | "provider",
  senderName: string,
  senderLocale: Locale,
  text: string
): Promise<ProviderChatMessage | null> {
  if (!text || !text.trim()) return null;

  const currentSessions = getStoredChatSessions();
  const session = currentSessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const recipientLocale: Locale =
    sender === "customer"
      ? session.provider.primaryLocale
      : session.customerLocale;

  let translatedText: string | undefined = undefined;

  if (senderLocale !== recipientLocale) {
    translatedText = await translateBilingual(
      text.trim(),
      senderLocale,
      recipientLocale
    );
  }

  const newMsg: ProviderChatMessage = {
    id: `pmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sessionId,
    sender,
    senderName,
    senderLocale,
    text: text.trim(),
    translatedText,
    recipientLocale,
    timestamp: Date.now(),
  };

  const updatedSessions = currentSessions.map((s) => {
    if (s.id !== sessionId) return s;
    return {
      ...s,
      messages: [...s.messages, newMsg],
    };
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
    notifyUpdate();
  }

  return newMsg;
}

