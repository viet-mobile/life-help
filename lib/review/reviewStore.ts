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

export function getStoredReviews(): CustomerReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
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

