/**
 * Typed errors shared between the server route and the browser client so that
 * every failure surfaces a stable machine-readable code plus a human message.
 */

export type GenerationErrorCode =
  | "invalid_request"
  | "provider_not_configured"
  | "rate_limited"
  | "upstream_rejected"
  | "upstream_error"
  | "upstream_timeout"
  | "network_error"
  | "aborted"
  | "unknown";

const STATUS_BY_CODE: Record<GenerationErrorCode, number> = {
  invalid_request: 400,
  provider_not_configured: 503,
  rate_limited: 429,
  upstream_rejected: 422,
  upstream_error: 502,
  upstream_timeout: 504,
  network_error: 502,
  aborted: 499,
  unknown: 500,
};

export class GenerationError extends Error {
  readonly code: GenerationErrorCode;
  readonly status: number;
  /** Seconds the caller should wait before retrying (rate limits only). */
  readonly retryAfter?: number;

  constructor(code: GenerationErrorCode, message: string, options?: { retryAfter?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "GenerationError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.retryAfter = options?.retryAfter;
  }
}

export interface ErrorBody {
  error: { code: GenerationErrorCode; message: string; retryAfter?: number };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError");
}

/** Parses an HTTP `Retry-After` header (seconds form) into a bounded number. */
export function parseRetryAfter(value: string | null, fallback = 15): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallback;
  return Math.min(Math.ceil(seconds), 120);
}
