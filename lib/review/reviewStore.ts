"use client";

export interface CustomerReview {
  id: string;
  rating: number; // 1 to 5
  serviceCategory?: string;
  content: string;
  createdAt: string;
  deliveredTo: string; // "contact@life.help"
  locale: string;
  status: "delivered";
}

export const REVIEWS_STORAGE_KEY = "life_help_customer_reviews";
export const REVIEW_EVENT = "life_help_review_submitted";

const SEED_REVIEWS: CustomerReview[] = [
  {
    id: "rev-seed-1",
    rating: 5,
    serviceCategory: "toilet",
    content: "야간에 갑자기 변기가 심하게 막혀서 막막했는데, 친절한 외국어 상담 후 20분 만에 베테랑 헬퍼님이 오셔서 완벽하게 뚫어주셨습니다. 정말 감사합니다!",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    deliveredTo: "contact@life.help",
    locale: "ko",
    status: "delivered",
  },
  {
    id: "rev-seed-2",
    rating: 5,
    serviceCategory: "boiler",
    content: "Dịch vụ rất tuyệt vời! Tôi là người Việt Nam sống tại Hàn Quốc, khi gặp sự cố bình nóng lạnh đã được tư vấn bằng tiếng Việt rất nhiệt tình. Thợ đến sửa rất nhanh và giá cả rõ ràng.",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    deliveredTo: "contact@life.help",
    locale: "vi",
    status: "delivered",
  },
  {
    id: "rev-seed-3",
    rating: 5,
    serviceCategory: "sink",
    content: "개인정보 입력 없이 솔직하게 쓸 수 있어서 좋네요. 싱크대 역류 배관 작업 깔끔하게 해주셨고 주변 청소까지 완벽했습니다.",
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    deliveredTo: "contact@life.help",
    locale: "ko",
    status: "delivered",
  },
];

export function getStoredReviews(): CustomerReview[] {
  if (typeof window === "undefined") return SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return SEED_REVIEWS;
}

export function saveReview(data: {
  rating: number;
  serviceCategory?: string;
  content: string;
  locale?: string;
}): CustomerReview {
  const current = getStoredReviews();
  const newReview: CustomerReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    rating: data.rating,
    serviceCategory: data.serviceCategory || "일반",
    content: data.content.trim(),
    createdAt: new Date().toISOString(),
    deliveredTo: "contact@life.help",
    locale: data.locale || "ko",
    status: "delivered",
  };

  const updated = [newReview, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(REVIEW_EVENT, { detail: newReview }));
    } catch {
      // ignore
    }
  }
  return newReview;
}

