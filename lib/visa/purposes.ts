// The seven visa purposes of the finder (operator list, 2026-10-21), in display order.
export const VISA_PURPOSES = ["marriage", "work", "travel", "study", "business", "visit", "other"] as const;
export type VisaPurpose = (typeof VISA_PURPOSES)[number];
export const PURPOSE_ICON: Record<VisaPurpose, string> = { marriage: "💍", work: "🛠️", travel: "🧳", study: "🎓", business: "💼", visit: "🏠", other: "📄" };
