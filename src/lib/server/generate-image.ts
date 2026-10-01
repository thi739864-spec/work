import { ASPECT_RATIOS, getModel, UPSTREAM_TIMEOUT_MS } from "../config";
import { GenerationError, type ErrorBody } from "../errors";
import { buildPrompt, randomSeed } from "../prompt";
import { resolveProvider } from "../providers";
import type { ProviderEnv } from "../providers/types";
import { validateImageRequest } from "../validation";

export function errorResponse(error: GenerationError): Response {
  const body: ErrorBody = { error: { code: error.code, message: error.message, retryAfter: error.retryAfter } };
  const headers: HeadersInit = error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {};
  return Response.json(body, { status: error.status, headers });
}

/**
 * Validates a generation request, calls the selected provider and streams the
 * image bytes back from our own origin (which keeps canvases untainted so the
 * browser can record video from them).
 */
export async function handleGenerateImage(
  request: Request,
  env: ProviderEnv,
  timeoutMs: number = UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(new GenerationError("invalid_request", "Request body must be valid JSON."));
  }

  const validation = validateImageRequest(payload);
  if (!validation.ok) {
    return errorResponse(new GenerationError("invalid_request", validation.message));
  }

  const input = validation.data;
  const model = getModel(input.model);
  const { width, height } = ASPECT_RATIOS[input.aspect];
  const seed = input.seed ?? randomSeed();

  try {
    const provider = resolveProvider(model, env);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]);
    const image = await provider.generate(
      { prompt: buildPrompt(input.prompt, input.style), width, height, seed, enhance: input.enhance, model },
      signal,
    );
    return new Response(image.bytes, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "no-store",
        "X-Seed": String(seed),
        "X-Model": model.id,
        "X-Width": String(width),
        "X-Height": String(height),
      },
    });
  } catch (error) {
    if (error instanceof GenerationError) {
      if (error.status >= 500) console.error(`[generate-image] ${model.id}: ${error.code}`, error.cause ?? error.message);
      return errorResponse(error);
    }
    console.error("[generate-image] unexpected failure", error);
    return errorResponse(new GenerationError("unknown", "Something went wrong while generating the image."));
  }
}
