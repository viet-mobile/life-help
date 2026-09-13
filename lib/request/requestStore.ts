"use client";

export interface ServiceRequest {
  id: string;
  serviceSlug: string;
  serviceName: string;
  serviceIcon: string;
  description: string;
  sido: string;
  gungu: string;
  address: string;
  phone: string;
  fileNames: string[];
  status: "pending" | "dispatched" | "completed" | "cancelled";
  assignedHelper?: {
    name: string;
    phone: string;
    dispatchedAt: string;
  };
  createdAt: string;
}

export const REQUEST_STORAGE_KEY = "life_help_service_requests";
export const REQUEST_EVENT = "life_help_request_update";

// Initial seed requests across multiple regions for admin demonstration
const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: "req-seed-101",
    serviceSlug: "toilet-clog",
    serviceName: "변기 막힘 해결",
    serviceIcon: "🚽",
    description: "변기 물이 역류하고 전혀 내려가지 않습니다. 외국인 기숙사 2층 화장실이라 빠른 방문 부탁드립니다.",
    sido: "전북특별자치도",
    gungu: "익산시",
    address: "전북특별자치도 익산시 신동 대학로 123",
    phone: "010-9876-5432",
    fileNames: ["toilet_clog_photo.jpg"],
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "req-seed-102",
    serviceSlug: "boiler-repair",
    serviceName: "보일러 수리 및 점검",
    serviceIcon: "🔥",
    description: "보일러에서 삐- 소리와 함께 점화 에러(02번)가 뜨면서 온수가 전혀 나오지 않아요. 베트남어 가능한 기사님 부탁드립니다.",
    sido: "전북특별자치도",
    gungu: "전주시 덕진구",
    address: "전북특별자치도 전주시 덕진구 송천동 45-12",
    phone: "010-8765-4321",
    fileNames: ["boiler_error_panel.png"],
    status: "dispatched",
    assignedHelper: {
      name: "김철수",
      phone: "010-3456-7890",
      dispatchedAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "req-seed-103",
    serviceSlug: "sink-drain",
    serviceName: "싱크대 배수구 역류",
    serviceIcon: "🚰",
    description: "주방 싱크대 바닥 배관에서 기름 찌꺼기와 함께 물이 넘쳐 흐릅니다. 고압세척 필요할 것 같습니다.",
    sido: "서울특별시",
    gungu: "강남구",
    address: "서울특별시 강남구 역삼동 789",
    phone: "010-7654-3210",
    fileNames: [],
    status: "completed",
    assignedHelper: {
      name: "박영희",
      phone: "010-2345-6789",
      dispatchedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export function getStoredRequests(): ServiceRequest[] {
  if (typeof window === "undefined") return SEED_REQUESTS;
  try {
    const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(SEED_REQUESTS));
      return SEED_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return SEED_REQUESTS;
}

export function saveServiceRequest(data: {
  serviceSlug: string;
  serviceName: string;
  serviceIcon: string;
  description: string;
  sido: string;
  gungu: string;
  address: string;
  phone: string;
  fileNames?: string[];
}): ServiceRequest {
  const current = getStoredRequests();
  const newReq: ServiceRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    serviceSlug: data.serviceSlug,
    serviceName: data.serviceName,
    serviceIcon: data.serviceIcon,
    description: data.description.trim(),
    sido: data.sido,
    gungu: data.gungu,
    address: data.address.trim(),
    phone: data.phone.trim(),
    fileNames: data.fileNames || [],
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const updated = [newReq, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: newReq }));
    } catch {
      // ignore
    }
  }
  return newReq;
}

export function updateRequestStatus(
  id: string,
  status: ServiceRequest["status"],
  assignedHelper?: { name: string; phone: string },
): void {
  const current = getStoredRequests();
  const updated = current.map((req) => {
    if (req.id === id) {
      return {
        ...req,
        status,
        ...(assignedHelper
          ? {
              assignedHelper: {
                ...assignedHelper,
                dispatchedAt: new Date().toISOString(),
              },
            }
          : {}),
      };
    }
    return req;
  });

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { id, status } }));
    } catch {
      // ignore
    }
  }
}

export function deleteServiceRequest(id: string): void {
  const current = getStoredRequests();
  const updated = current.filter((r) => r.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { id, deleted: true } }));
    } catch {
      // ignore
    }
  }
}

