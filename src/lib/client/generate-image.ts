import type { ModelId } from "../config";
import { GenerationError, isAbortError, type ErrorBody, type GenerationErrorCode } from "../errors";
import type { ImageRequestInput } from "../validation";

export interface GeneratedImageResult {
  blob: Blob;
  seed: number;
  model: ModelId;
  width: number;
  height: number;
}

export interface ModelOption {
  id: ModelId;
  label: string;
  description: string;
  available: boolean;
}

const ENDPOINT = "/api/generate/image";

async function readError(response: Response): Promise<GenerationError> {
  try {
    const body = (await response.json()) as ErrorBody;
    return new GenerationError(body.error.code as GenerationErrorCode, body.error.message, { retryAfter: body.error.retryAfter });
  } catch {
    return new GenerationError(response.status === 429 ? "rate_limited" : "unknown", `Request failed (${response.status}).`);
  }
}

/** Calls the generation API once. Throws `GenerationError` on any failure. */
export async function requestImage(input: ImageRequestInput, signal?: AbortSignal): Promise<GeneratedImageResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw new GenerationError("aborted", "Generation was cancelled.", { cause: error });
    throw new GenerationError("network_error", "Could not reach the studio server. Is it running?", { cause: error });
  }
  if (!response.ok) throw await readError(response);
  return {
    blob: await response.blob(),
    seed: Number(response.headers.get("x-seed")),
    model: (response.headers.get("x-model") ?? input.model ?? "flux") as ModelId,
    width: Number(response.headers.get("x-width")),
    height: Number(response.headers.get("x-height")),
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new GenerationError("aborted", "Generation was cancelled."));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new GenerationError("aborted", "Generation was cancelled."));
      },
      { once: true },
    );
  });
}

export interface RetryOptions {
  signal?: AbortSignal;
  maxRetries?: number;
  /** Called with the number of seconds we are waiting for a free-tier cooldown. */
  onWait?: (seconds: number) => void;
}

/** Like `requestImage` but transparently waits out free-tier rate limits. */
export async function requestImageWithRetry(input: ImageRequestInput, options: RetryOptions = {}): Promise<GeneratedImageResult> {
  const { signal, maxRetries = 3, onWait } = options;
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestImage(input, signal);
    } catch (error) {
      const retryable = error instanceof GenerationError && (error.code === "rate_limited" || error.code === "upstream_error");
      if (!retryable || attempt >= maxRetries) throw error;
      const waitSeconds = error.retryAfter ?? 5 * (attempt + 1);
      onWait?.(waitSeconds);
      await sleep(waitSeconds * 1000, signal);
    }
  }
}

export async function fetchModels(signal?: AbortSignal): Promise<ModelOption[]> {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) throw await readError(response);
  const body = (await response.json()) as { models: ModelOption[] };
  return body.models;
}
