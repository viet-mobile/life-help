import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidLocale } from "@/messages";
import { CUSTOMER_ID_PATTERN, formatCustomerDisplayName } from "@/lib/id/customerDisplayName";
import type { CoreServiceSlug, MatchHelperResult } from "@/lib/db/schema";

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
      subReason: "NO_ELIGIBLE_HELPER" | "ALL_ELIGIBLE_HELPERS_BUSY";
    }
  | {
      success: false;
      code: string;
      message: string;
      field?: string;
      /** Present only when the request row was created but matching did not complete. */
      requestId?: string;
    };

export interface ApiResult {
  httpStatus: number;
  body: CreateRequestApiResponse;
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
 * Inserts a validated request as SEARCHING and runs the authoritative atomic matching RPC.
 *
 * - INSERT failure: matching is never attempted.
 * - RPC failure after INSERT: the request remains SEARCHING and the error is surfaced with its requestId
 *   (no automatic retry yet).
 * - NO_HELPER_AVAILABLE: the RPC itself creates the admin escalation and admin notification.
 */
export async function createServiceRequestAndMatch(
  client: SupabaseClient,
  input: CreateServiceRequestInput
): Promise<ApiResult> {
  const { data: inserted, error: insertError } = await client
    .from("service_requests")
    .insert({
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
    })
    .select("id")
    .single();

  const requestId = (inserted as { id?: unknown } | null)?.id;
  if (insertError || typeof requestId !== "string") {
    console.error("[api/requests] service_requests insert failed", {
      code: insertError?.code,
      message: insertError?.message,
    });
    return serverError(500, "REQUEST_CREATE_FAILED", "The service request could not be created.");
  }

  const { data: rpcData, error: rpcError } = await client.rpc("match_and_assign_helper", {
    p_request_id: requestId,
  });

  const match = rpcData as MatchHelperResult | null;
  if (rpcError || !match || match.success !== true) {
    console.error("[api/requests] match_and_assign_helper failed", {
      requestId,
      code: rpcError?.code,
      message: rpcError?.message ?? match?.error,
    });
    return serverError(
      502,
      "MATCHING_FAILED",
      "The request was received, but helper matching could not be completed.",
      requestId
    );
  }

  if (match.status === "NO_HELPER_AVAILABLE") {
    const subReason = match.sub_reason;
    if (subReason !== "NO_ELIGIBLE_HELPER" && subReason !== "ALL_ELIGIBLE_HELPERS_BUSY") {
      console.error("[api/requests] unexpected NO_HELPER_AVAILABLE payload", { requestId });
      return serverError(502, "MATCHING_FAILED", "Unexpected matching result.", requestId);
    }
    return {
      httpStatus: 201,
      body: { success: true, requestId, status: "NO_HELPER_AVAILABLE", subReason },
    };
  }

  if (match.status === "MATCHED" && typeof match.conversation_id === "string") {
    // The RPC does not return the assignment id; read the DB-created active assignment for this request.
    const { data: assignment, error: assignmentError } = await client
      .from("request_assignments")
      .select("id")
      .eq("request_id", requestId)
      .in("status", [...ACTIVE_ASSIGNMENT_STATUSES])
      .maybeSingle();

    const assignmentId = (assignment as { id?: unknown } | null)?.id;
    if (assignmentError || typeof assignmentId !== "string") {
      console.error("[api/requests] active assignment lookup failed", {
        requestId,
        code: assignmentError?.code,
        message: assignmentError?.message,
      });
      return serverError(
        502,
        "MATCH_RESULT_UNAVAILABLE",
        "A helper was matched, but the assignment could not be confirmed.",
        requestId
      );
    }

    return {
      httpStatus: 201,
      body: {
        success: true,
        requestId,
        status: "MATCHED",
        assignmentId,
        conversationId: match.conversation_id,
      },
    };
  }

  console.error("[api/requests] unexpected match_and_assign_helper payload", { requestId });
  return serverError(502, "MATCHING_FAILED", "Unexpected matching result.", requestId);
}
