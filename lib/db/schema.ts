// LIFE.HELP Supabase Core Database Schema Types
// Hardened: 10 Core Services Type, AppNotificationRow, and Nullable Escalation Reference

export type CoreServiceSlug =
  | "clog-clearing"
  | "leak-plumbing"
  | "boiler"
  | "cleaning"
  | "housing"
  | "bank-help"
  | "insurance-help"
  | "job-help"
  | "hospital-help"
  | "mobile-help";

export type ServiceRequestStatus =
  | "CREATED"
  | "SEARCHING"
  | "MATCHED"
  | "HELPER_NOTIFIED"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAYMENT_PENDING"
  | "SETTLED"
  | "CLOSED"
  | "CANCELLED"
  | "EXPIRED"
  | "NO_HELPER_AVAILABLE";

export type AssignmentStatus =
  | "PENDING"
  | "NOTIFIED"
  | "ACCEPTED"
  | "DECLINED"
  | "TIMEOUT"
  | "CANCELLED";

export type ConversationType =
  | "CUSTOMER_HELPER"
  | "CUSTOMER_ADMIN"
  | "HELPER_ADMIN";

export type ConversationStatus =
  | "ACTIVE"
  | "CLOSED"
  | "DELETION_SCHEDULED"
  | "DELETED";

export type MessageSenderRole =
  | "CUSTOMER"
  | "HELPER"
  | "ADMIN"
  | "SYSTEM";

export type EscalationReason =
  | "NO_HELPER_AVAILABLE"
  | "HELPER_DECLINED_ALL"
  | "MATCHING_TIMEOUT"
  | "DISPUTE"
  | "USER_REQUEST";

export type EscalationStatus =
  | "PENDING"
  | "ASSIGNED"
  | "RESOLVED"
  | "CANCELLED";

export type NotificationRecipientType =
  | "CUSTOMER"
  | "HELPER"
  | "ADMIN";

export interface ServiceRequestRow {
  id: string;
  customer_id: string;
  customer_display_name: string;
  customer_locale: string;
  service_slug: CoreServiceSlug;
  country: string;
  sido: string;
  gungu: string;
  dong: string;
  address: string;
  description: string;
  selected_options: string[];
  status: ServiceRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface HelperRow {
  id: string;
  helper_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_icon: string;
  primary_locale: string;
  spoken_locales: string[];
  country: string;
  sido: string;
  gungu: string | null;
  is_verified: boolean;
  is_active: boolean;
  on_duty: boolean;
  duty_hours: string;
  rating: number;
  completed_jobs: number;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelperServiceRow {
  id: string;
  helper_id: string;
  service_slug: CoreServiceSlug;
  created_at: string;
}

export interface HelperRegionRow {
  id: string;
  helper_id: string;
  country: string;
  sido: string;
  gungu: string;
  created_at: string;
}

export interface RequestAssignmentRow {
  id: string;
  request_id: string;
  helper_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  responded_at: string | null;
  completed_at: string | null;
}

export interface ConversationRow {
  id: string;
  request_id: string | null;
  conversation_type: ConversationType;
  customer_id: string;
  helper_id: string | null;
  status: ConversationStatus;
  customer_locale: string;
  helper_locale: string;
  created_at: string;
  closed_at: string | null;
  deletion_scheduled_at: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_role: MessageSenderRole;
  sender_id: string;
  original_language: string;
  original_text: string;
  translated_language: string | null;
  translated_text: string | null;
  translation_status: string;
  created_at: string;
}

export interface AdminEscalationRow {
  id: string;
  request_id: string | null;
  reason: EscalationReason;
  status: EscalationStatus;
  escalated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  admin_notes: string | null;
}

export interface AppNotificationRow {
  id: string;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// Backward-compatible alias
export type NotificationRow = AppNotificationRow;

export interface MatchHelperResult {
  success: boolean;
  status: "MATCHED" | "NO_HELPER_AVAILABLE" | "ERROR";
  sub_reason?: "NO_ELIGIBLE_HELPER" | "ALL_ELIGIBLE_HELPERS_BUSY";
  error?: string;
  helper_id?: string;
  helper_name?: string;
  conversation_id?: string;
  escalation_id?: string;
}

export interface ReleaseAssignmentResult {
  success: boolean;
  assignment_id?: string;
  request_id?: string;
  new_assignment_status?: AssignmentStatus;
  request_reopened?: boolean;
  request_status?: ServiceRequestStatus;
  error?: string;
  code?: string;
  current_status?: AssignmentStatus;
  assignment_status?: AssignmentStatus;
}

