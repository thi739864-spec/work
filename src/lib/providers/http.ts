import { MAX_IMAGE_BYTES } from "../config";
import { GenerationError, isAbortError, parseRetryAfter } from "../errors";
import type { GeneratedImage } from "./types";

const RASTER_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

/** Performs an upstream fetch, translating transport failures into GenerationErrors. */
export async function upstreamFetch(url: string, init: RequestInit, signal: AbortSignal, provider: string): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    if (isAbortError(error)) {
      const timedOut = signal.reason instanceof DOMException && signal.reason.name === "TimeoutError";
      throw timedOut
        ? new GenerationError("upstream_timeout", `${provider} took too long to respond. Try again or pick a faster model.`, { cause: error })
        : new GenerationError("aborted", "Generation was cancelled.", { cause: error });
    }
    throw new GenerationError("network_error", `Could not reach ${provider}. Check your connection and try again.`, { cause: error });
  }
}

/** Validates an upstream image response and reads its bytes, enforcing type and size limits. */
export async function readImageResponse(response: Response, provider: string): Promise<GeneratedImage> {
  if (response.status === 429) {
    throw new GenerationError("rate_limited", `${provider} free tier is cooling down. Retrying shortly...`, {
      retryAfter: parseRetryAfter(response.headers.get("retry-after")),
    });
  }
  if (response.status >= 400 && response.status < 500) {
    const detail = await safeText(response);
    throw new GenerationError(
      "upstream_rejected",
      `${provider} rejected the request (${response.status}). ${detail || "Try rephrasing the prompt."}`.trim(),
    );
  }
  if (!response.ok) {
    throw new GenerationError("upstream_error", `${provider} is having trouble right now (${response.status}). Please retry.`);
  }

  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  // Only raster formats: SVG served from our origin could carry script.
  if (!RASTER_TYPES.has(contentType)) {
    throw new GenerationError("upstream_error", `${provider} returned an unexpected response instead of an image.`);
  }
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) {
    throw new GenerationError("upstream_error", `${provider} returned an image that is too large.`);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new GenerationError("upstream_error", `${provider} returned an empty or oversized image.`);
  }
  return { bytes, contentType };
}

async function safeText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  } catch {
    return "";
  }
}
