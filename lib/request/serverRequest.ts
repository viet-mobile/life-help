import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidLocale } from "@/messages";
import { CUSTOMER_ID_PATTERN, formatCustomerDisplayName } from "@/lib/id/customerDisplayName";
import type { CoreServiceSlug } from "@/lib/db/schema";
import { IDEMPOTENCY_HEADER, IDEMPOTENCY_KEY_PATTERN } from "@/lib/request/idempotencyKey";
import { checkOrphanEligibility, runMatchingOnce } from "@/lib/request/requestRecovery";

/** The exact 10 core services accepted by service_requests.service_slug. */
export const CORE_SERVICE_SLUGS: readonly CoreServiceSlug[] = [
  "clog-clearing",
  "leak-plumbing",
  "boiler",
  "cleaning",
  "housing",
  "bank-help",
  "insurance-help",
  "job-help",
  "hospital-help",
  "mobile-help",
];

const ACTIVE_ASSIGNMENT_STATUSES = ["PENDING", "NOTIFIED", "ACCEPTED"] as const;

export const MAX_REQUEST_BODY_BYTES = 32 * 1024;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_REGION_FIELD_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 300;
const MAX_SELECTED_OPTIONS = 30;
const MAX_SELECTED_OPTION_LENGTH = 300;

export interface CreateServiceRequestInput {
  service_slug: CoreServiceSlug;
  customer_id: string;
  customer_locale: string;
  country: string;
  sido: string;
  gungu: string;
  dong: string;
  address: string;
  /** Customer's original text, stored exactly as submitted. */
  description: string;
  selected_options: string[];
}

export type CreateRequestApiResponse =
  | {
      success: true;
      requestId: string;
      status: "MATCHED";
      assignmentId: string;
      conversationId: string;
    }
  | {
      success: true;
      requestId: string;
      status: "NO_HELPER_AVAILABLE";
      /** null only on an idempotent replay whose escalation notification can no longer be read. */
      subReason: "NO_ELIGIBLE_HELPER" | "ALL_ELIGIBLE_HELPERS_BUSY" | null;
    }
  | {
      success: false;
      code: string;
      message: string;
      field?: string;
      /** Present only when the request row exists but has no final matching result yet. */
      requestId?: string;
    };

export interface ApiResult {
  httpStatus: number;
  body: CreateRequestApiResponse;
  /** True when the response describes a request created by an earlier call with the same key. */
  replayed?: boolean;
  /**
   * True only when this call's own match_and_assign_helper invocation created the assignment
   * (first submission, or in-band orphan recovery on a replay). The helper push keys off this.
   */
  matchedByThisCall?: boolean;
}

type ValidationResult =
  | { ok: true; value: CreateServiceRequestInput }
  | { ok: false; error: ApiResult };

function validationError(field: string, message: string): { ok: false; error: ApiResult } {
  return {
    ok: false,
    error: {
      httpStatus: 400,
      body: { success: false, code: "VALIDATION_ERROR", message, field },
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Postgres text columns reject NUL bytes; reject them up front instead of failing the INSERT.
function hasNul(value: string): boolean {
  return value.includes("\u0000");
}

function readText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number,
  required: boolean
): { ok: true; value: string } | { ok: false; error: ApiResult } {
  const raw = body[field];
  if (raw === undefined || raw === null) {
    if (required) return validationError(field, `${field} is required`);
    return { ok: true, value: "" };
  }
  if (typeof raw !== "string") return validationError(field, `${field} must be a string`);
  const value = raw.trim();
  if (required && !value) return validationError(field, `${field} must not be empty`);
  if (value.length > maxLength) return validationError(field, `${field} is too long`);
  if (hasNul(value)) return validationError(field, `${field} contains invalid characters`);
  return { ok: true, value };
}

/**
 * Server-side validation of a customer service request. Client-side checks are never trusted.
 */
export function validateCreateServiceRequest(body: unknown): ValidationResult {
  if (!isPlainObject(body)) return validationError("body", "Request body must be a JSON object");

  const slug = body.service_slug;
  if (typeof slug !== "string" || !(CORE_SERVICE_SLUGS as readonly string[]).includes(slug)) {
    return validationError("service_slug", "Unsupported service_slug");
  }

  const customerId = body.customer_id;
  if (typeof customerId !== "string" || !CUSTOMER_ID_PATTERN.test(customerId)) {
    return validationError("customer_id", "Invalid customer_id");
  }

  const locale = body.customer_locale;
  if (!isValidLocale(locale)) {
    return validationError("customer_locale", "Unsupported customer_locale");
  }

  const country = body.country;
  if (typeof country !== "string" || !/^[A-Z]{2}$/.test(country)) {
    return validationError("country", "country must be an ISO 3166-1 alpha-2 code");
  }

  const sido = readText(body, "sido", MAX_REGION_FIELD_LENGTH, true);
  if (!sido.ok) return sido;
  const gungu = readText(body, "gungu", MAX_REGION_FIELD_LENGTH, true);
  if (!gungu.ok) return gungu;
  const dong = readText(body, "dong", MAX_REGION_FIELD_LENGTH, false);
  if (!dong.ok) return dong;
  const address = readText(body, "address", MAX_ADDRESS_LENGTH, true);
  if (!address.ok) return address;

  // Description: validated on its trimmed form, but stored exactly as the customer wrote it.
  const description = body.description;
  if (typeof description !== "string") {
    return validationError("description", "description must be a string");
  }
  if (!description.trim()) return validationError("description", "description must not be empty");
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return validationError("description", "description is too long");
  }
  if (hasNul(description)) return validationError("description", "description contains invalid characters");

  const rawOptions = body.selected_options ?? [];
  if (!Array.isArray(rawOptions)) {
    return validationError("selected_options", "selected_options must be an array");
  }
  if (rawOptions.length > MAX_SELECTED_OPTIONS) {
    return validationError("selected_options", "Too many selected_options");
  }
  const selectedOptions: string[] = [];
  for (const option of rawOptions) {
    if (typeof option !== "string" || !option.trim()) {
      return validationError("selected_options", "selected_options must contain non-empty strings");
    }
    if (option.length > MAX_SELECTED_OPTION_LENGTH || hasNul(option)) {
      return validationError("selected_options", "Invalid selected_options entry");
    }
    selectedOptions.push(option.trim());
  }

  return {
    ok: true,
    value: {
      service_slug: slug as CoreServiceSlug,
      customer_id: customerId,
      customer_locale: locale,
      country,
      sido: sido.value,
      gungu: gungu.value,
      dong: dong.value,
      address: address.value,
      description,
      selected_options: selectedOptions,
    },
  };
}

function serverError(httpStatus: number, code: string, message: string, requestId?: string): ApiResult {
  return {
    httpStatus,
    body: { success: false, code, message, ...(requestId ? { requestId } : {}) },
  };
}

/**
 * Validates the Idempotency-Key header. The key must be a canonical v4 UUID (crypto.randomUUID()).
 * The key is never logged or echoed back.
 */
export function validateIdempotencyKey(
  raw: string | null | undefined
): { ok: true; value: string } | { ok: false; error: ApiResult } {
  if (typeof raw !== "string" || !IDEMPOTENCY_KEY_PATTERN.test(raw)) {
    return validationError(IDEMPOTENCY_HEADER, `${IDEMPOTENCY_HEADER} header must be a lowercase v4 UUID`);
  }
  return { ok: true, value: raw };
}

// Versioned domain separator. Changing it would break replay of in-flight keys; bump only with care.
const REQUEST_ID_DERIVATION_DOMAIN = "life.help/service-request/idempotency/v1:";

/**
 * Derives the service_requests.id for an idempotency key: SHA-256(domain || key), first 128 bits,
 * stamped as an RFC 9562 version-8 UUID.
 *
 * The primary key therefore acts as the DB-level uniqueness guard for the key across every Worker
 * instance, with no extra column. It is one-way (the requestId does not reveal the key), and since
 * DB-default ids are version-4, derived ids can never collide with them.
 */
export async function deriveRequestIdFromIdempotencyKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(REQUEST_ID_DERIVATION_DOMAIN + key)
  );
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const REQUEST_FINGERPRINT_COLUMNS =
  "id, customer_id, customer_locale, service_slug, country, sido, gungu, dong, address, description, selected_options";

/**
 * A replay must carry the same logical request. A key reused with a different customer or payload is
 * rejected without revealing anything about the stored request.
 */
export function isSameLogicalRequest(row: Record<string, unknown>, input: CreateServiceRequestInput): boolean {
  const storedOptions = Array.isArray(row.selected_options) ? row.selected_options : [];
  return (
    row.customer_id === input.customer_id &&
    row.customer_locale === input.customer_locale &&
    row.service_slug === input.service_slug &&
    row.country === input.country &&
    row.sido === input.sido &&
    row.gungu === input.gungu &&
    row.dong === input.dong &&
    row.address === input.address &&
    row.description === input.description &&
    storedOptions.length === input.selected_options.length &&
    storedOptions.every((option, i) => option === input.selected_options[i])
  );
}

const SUB_REASONS = ["NO_ELIGIBLE_HELPER", "ALL_ELIGIBLE_HELPERS_BUSY"] as const;

/**
 * Maps the request's current DB state to the API contract. The DB, not the RPC return value, is the
 * source of truth, so every caller for the same request converges on the same answer.
 */
export async function readRequestResult(
  client: SupabaseClient,
  requestId: string,
  successStatus: number
): Promise<ApiResult> {
  const { data: row, error } = await client
    .from("service_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !row) {
    console.error("[api/requests] request state lookup failed", { requestId, code: error?.code });
    return serverError(500, "REQUEST_LOOKUP_FAILED", "The request status could not be read.", requestId);
  }

  if (row.status === "MATCHED") {
    const { data: assignment, error: assignmentError } = await client
      .from("request_assignments")
      .select("id, helper_id")
      .eq("request_id", requestId)
      .in("status", [...ACTIVE_ASSIGNMENT_STATUSES])
      .maybeSingle();
    const { data: conversation, error: conversationError } = assignment
      ? await client
          .from("conversations")
          .select("id")
          .eq("request_id", requestId)
          .eq("helper_id", assignment.helper_id)
          .eq("conversation_type", "CUSTOMER_HELPER")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null, error: null };

    if (assignmentError || conversationError || !assignment || !conversation) {
      console.error("[api/requests] matched request lookup incomplete", {
        requestId,
        code: assignmentError?.code ?? conversationError?.code,
      });
      return serverError(
        502,
        "MATCH_RESULT_UNAVAILABLE",
        "A helper was matched, but the assignment could not be confirmed.",
        requestId
      );
    }
    return {
      httpStatus: successStatus,
      body: {
        success: true,
        requestId,
        status: "MATCHED",
        assignmentId: assignment.id as string,
        conversationId: conversation.id as string,
      },
    };
  }

  if (row.status === "NO_HELPER_AVAILABLE") {
    // The RPC records sub_reason only in the admin notification payload.
    const { data: notification } = await client
      .from("app_notifications")
      .select("payload")
      .eq("recipient_type", "ADMIN")
      .eq("type", "NO_HELPER_AVAILABLE")
      .eq("payload->>request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const raw = (notification?.payload as { sub_reason?: unknown } | undefined)?.sub_reason;
    const subReason = (SUB_REASONS as readonly unknown[]).includes(raw)
      ? (raw as (typeof SUB_REASONS)[number])
      : null;
    return {
      httpStatus: successStatus,
      body: { success: true, requestId, status: "NO_HELPER_AVAILABLE", subReason },
    };
  }

  if (row.status === "SEARCHING" || row.status === "CREATED") {
    return serverError(
      202,
      "REQUEST_PROCESSING",
      "The request was received and is still being processed.",
      requestId
    );
  }

  // Later lifecycle states are outside this endpoint's immediate-result contract.
  return serverError(409, "REQUEST_STATE_CHANGED", "The request has already moved on.", requestId);
}

/**
 * Idempotent create-and-match for one logical submission.
 *
 * 1. requestId = derive(idempotencyKey); INSERT with that id. The primary key is the authoritative
 *    duplicate guard: of N concurrent calls with one key, exactly one INSERT succeeds and the rest get
 *    unique_violation (23505).
 * 2. Creator: calls match_and_assign_helper once.
 *    Replay: verifies it is the same logical request (else 409), then, only if the request is a strict
 *    SEARCHING orphan, calls match_and_assign_helper once (bounded in-band recovery).
 *    Concurrent calls are safe: the RPC locks the request row and refuses non-CREATED/SEARCHING rows.
 * 3. Responds from the DB state (see readRequestResult). If this call ran the RPC and it failed while
 *    the request is still SEARCHING, responds 502 MATCHING_FAILED with requestId; the same key may be
 *    retried later, and the admin recovery endpoint also picks the request up.
 *
 * INSERT failure (other than the duplicate key) never reaches the RPC.
 */
export async function submitServiceRequest(
  client: SupabaseClient,
  input: CreateServiceRequestInput,
  idempotencyKey: string
): Promise<ApiResult> {
  const requestId = await deriveRequestIdFromIdempotencyKey(idempotencyKey);

  const { error: insertError } = await client.from("service_requests").insert({
    id: requestId,
    customer_id: input.customer_id,
    customer_display_name: formatCustomerDisplayName(input.customer_id, input.customer_locale),
    customer_locale: input.customer_locale,
    service_slug: input.service_slug,
    country: input.country,
    sido: input.sido,
    gungu: input.gungu,
    dong: input.dong,
    address: input.address,
    description: input.description,
    selected_options: input.selected_options,
    status: "SEARCHING",
  });

  const isDuplicate = insertError?.code === "23505";
  if (insertError && !isDuplicate) {
    console.error("[api/requests] service_requests insert failed", {
      code: insertError.code,
      message: insertError.message,
    });
    return serverError(500, "REQUEST_CREATE_FAILED", "The service request could not be created.");
  }

  if (!isDuplicate) {
    const attempt = await runMatchingOnce(client, requestId);
    const result = await readRequestResult(client, requestId, 201);
    result.matchedByThisCall = attempt.outcome === "RAN" && attempt.status === "MATCHED";
    if (attempt.outcome === "FAILED" && result.body.success === false && result.body.code === "REQUEST_PROCESSING") {
      return serverError(
        502,
        "MATCHING_FAILED",
        "The request was received, but helper matching could not be completed.",
        requestId
      );
    }
    return result;
  }

  // Replay of an existing key.
  const { data: existing, error: existingError } = await client
    .from("service_requests")
    .select(REQUEST_FINGERPRINT_COLUMNS)
    .eq("id", requestId)
    .maybeSingle();
  if (existingError || !existing) {
    console.error("[api/requests] duplicate key lookup failed", { requestId, code: existingError?.code });
    return serverError(500, "REQUEST_LOOKUP_FAILED", "The request status could not be read.");
  }
  if (!isSameLogicalRequest(existing as Record<string, unknown>, input)) {
    return serverError(
      409,
      "IDEMPOTENCY_KEY_CONFLICT",
      "This submission key was already used for a different request."
    );
  }

  let ranAndFailed = false;
  let matchedByThisCall = false;
  const eligibility = await checkOrphanEligibility(client, requestId);
  if (eligibility.eligible) {
    const attempt = await runMatchingOnce(client, requestId);
    ranAndFailed = attempt.outcome === "FAILED";
    matchedByThisCall = attempt.outcome === "RAN" && attempt.status === "MATCHED";
  }

  const result = await readRequestResult(client, requestId, 200);
  result.replayed = true;
  result.matchedByThisCall = matchedByThisCall;
  if (ranAndFailed && result.body.success === false && result.body.code === "REQUEST_PROCESSING") {
    return {
      ...serverError(
        502,
        "MATCHING_FAILED",
        "The request was received, but helper matching could not be completed.",
        requestId
      ),
      replayed: true,
    };
  }
  return result;
}
