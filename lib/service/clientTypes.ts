/** Shapes returned by /api/svc (see 202610090040_service_core.sql). */
export type RequestStatus = "WAITING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type HelperStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "DISABLED";

export interface SvcHelperPublic { id: string; displayName: string; primaryLocale: string; spokenLocales: string[] }
export interface SvcRequest {
  id: string;
  serviceSlug: string;
  country: string;
  sido: string;
  gungu: string;
  /** null for an eligible helper who has not accepted yet */
  address: string | null;
  description: string;
  sourceLocale: string;
  selectedOptions: string[];
  status: RequestStatus;
  unmatched: boolean;
  helper: SvcHelperPublic | null;
  createdAt: string;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  descriptionTranslation?: { locale: string; text: string | null; status: "OK" | "FAILED" } | null;
}
export interface SvcRegion { country: string; sido: string | null; gungu: string | null }
export interface SvcHelper {
  id: string;
  displayName: string;
  status: HelperStatus;
  isAvailable: boolean;
  capabilities: string[];
  primaryLocale: string;
  spokenLocales: string[];
  credentialExpiresAt: string;
  createdAt: string;
  regions: SvcRegion[];
  contactEmail?: string | null;
}
export interface SvcMessage {
  id: string;
  seq: number;
  requestId: string;
  senderKind: "CUSTOMER" | "HELPER" | "ADMIN" | "SYSTEM";
  body: string;
  sourceLocale: string;
  createdAt: string;
  own: boolean;
  translation: { locale: string; text: string } | null;
  translationStatus: "NONE" | "OK" | "FAILED" | "SAME_LANGUAGE";
}
export interface SvcNotification { id: number; event: string; requestId: string; payload: Record<string, unknown>; createdAt: string; readAt?: string | null }
export interface SvcEvent { actorKind: string; from: string | null; to: string; at: string }
