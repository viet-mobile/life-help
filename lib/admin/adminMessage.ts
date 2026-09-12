"use client";

export interface AdminMessage {
  id: string;
  targetType: "helper" | "counselor";
  targetId: string; // phone or accessKey
  targetName: string;
  sender: "admin" | "partner"; // 'admin' is sys.life.help, 'partner' is the helper or counselor
  senderName: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  category?: "notice" | "emergency" | "inquiry" | "general";
}

export const ADMIN_MESSAGE_STORAGE_KEY = "life_help_admin_messages";
export const ADMIN_MESSAGE_EVENT = "life_help_admin_message_update";

// Initial seed messages for demonstration and testing
const SEED_MESSAGES: AdminMessage[] = [
  {
    id: "msg-seed-1",
    targetType: "helper",
    targetId: "010-3456-7890",
    targetName: "김철수 헬퍼",
    sender: "admin",
    senderName: "sys.life.help 본사 관리자",
    text: "안녕하세요 김철수 헬퍼님, 이번 주말 전북 익산시 및 전주시 긴급 동파/배관 지원 출동 대기 상태 확인 부탁드립니다.",
    timestamp: Date.now() - 3600000 * 2,
    isRead: false,
    category: "emergency",
  },
  {
    id: "msg-seed-2",
    targetType: "counselor",
    targetId: "010-1234-5678",
    targetName: "김민준 상담원",
    sender: "admin",
    senderName: "sys.life.help 본사 관리자",
    text: "김민준 상담원님, 오늘 저녁 베트남어 및 한국어 야간 상담 인입량이 증가할 것으로 예상되어 근무 지원 부탁드립니다.",
    timestamp: Date.now() - 3600000 * 5,
    isRead: true,
    category: "notice",
  },
];

export function getStoredAdminMessages(): AdminMessage[] {
  if (typeof window === "undefined") return SEED_MESSAGES;
  try {
    const raw = localStorage.getItem(ADMIN_MESSAGE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_MESSAGE_STORAGE_KEY, JSON.stringify(SEED_MESSAGES));
      return SEED_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return SEED_MESSAGES;
}

export function saveAdminMessages(messages: AdminMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_MESSAGE_STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(ADMIN_MESSAGE_EVENT, { detail: messages }));
  } catch {
    // ignore
  }
}

export function getAdminMessages(filter?: {
  targetId?: string;
  targetType?: "helper" | "counselor";
}): AdminMessage[] {
  const all = getStoredAdminMessages();
  return all.filter((m) => {
    if (filter?.targetType && m.targetType !== filter.targetType) return false;
    if (filter?.targetId) {
      const cleanFilter = filter.targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
      const cleanTarget = m.targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
      if (!cleanTarget.includes(cleanFilter) && !cleanFilter.includes(cleanTarget)) {
        return false;
      }
    }
    return true;
  });
}

export function sendAdminMessage(data: {
  targetType: "helper" | "counselor";
  targetId: string;
  targetName: string;
  sender: "admin" | "partner";
  senderName: string;
  text: string;
  category?: "notice" | "emergency" | "inquiry" | "general";
}): AdminMessage {
  const all = getStoredAdminMessages();
  const newMessage: AdminMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    targetType: data.targetType,
    targetId: data.targetId.trim(),
    targetName: data.targetName.trim(),
    sender: data.sender,
    senderName: data.senderName.trim() || (data.sender === "admin" ? "sys.life.help 본사 관리자" : data.targetName),
    text: data.text.trim(),
    timestamp: Date.now(),
    isRead: false,
    category: data.category || "general",
  };

  const updated = [newMessage, ...all];
  saveAdminMessages(updated);
  return newMessage;
}

export function markAdminMessageAsRead(messageId: string): void {
  const all = getStoredAdminMessages();
  let changed = false;
  const updated = all.map((m) => {
    if (m.id === messageId && !m.isRead) {
      changed = true;
      return { ...m, isRead: true };
    }
    return m;
  });
  if (changed) {
    saveAdminMessages(updated);
  }
}

export function markAllAdminMessagesAsRead(targetId: string, forSender: "admin" | "partner"): void {
  const all = getStoredAdminMessages();
  const cleanTarget = targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  let changed = false;
  const updated = all.map((m) => {
    const currentClean = m.targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    // If partner is reading, mark admin's messages as read
    // If admin is reading, mark partner's messages as read
    const isTargetMatch = currentClean.includes(cleanTarget) || cleanTarget.includes(currentClean);
    const shouldMark = isTargetMatch && !m.isRead && m.sender !== forSender;
    if (shouldMark) {
      changed = true;
      return { ...m, isRead: true };
    }
    return m;
  });
  if (changed) {
    saveAdminMessages(updated);
  }
}

export function getUnreadAdminMessageCount(
  targetId: string,
  forSender: "admin" | "partner",
): number {
  const all = getStoredAdminMessages();
  const cleanTarget = targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  return all.filter((m) => {
    const currentClean = m.targetId.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    const isTargetMatch = !targetId || currentClean.includes(cleanTarget) || cleanTarget.includes(currentClean);
    return isTargetMatch && !m.isRead && m.sender !== forSender;
  }).length;
}

