/** Error codes raised by the database functions (and a few raised by the server) with the HTTP status each maps to. */
const STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  NOT_APPROVED: 403,
  NOT_ALLOWED: 403,
  NOT_FOUND: 404,
  NOT_AVAILABLE: 409,
  NOT_ELIGIBLE: 409,
  INVALID_STATE: 409,
  RATE_LIMITED: 429,
  BAD_ORIGIN: 403,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  UNAUTHENTICATED: 401,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class ServiceError extends Error {
  readonly status: number;
  constructor(readonly code: keyof typeof STATUS | string, message?: string) {
    super(message ?? code);
    this.status = STATUS[code] ?? 500;
  }
}

/** A database error -> ServiceError. Only the known codes pass through; anything else is an opaque INTERNAL (never leak SQL text). */
export function fromDbMessage(message: string | undefined | null): ServiceError {
  const code = (message ?? "").trim();
  return new ServiceError(code in STATUS && code !== "INTERNAL" ? code : "INTERNAL");
}
