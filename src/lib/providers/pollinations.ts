import { readImageResponse, upstreamFetch } from "./http";
import type { ImageProvider, ResolvedImageRequest } from "./types";

const BASE_URL = "https://image.pollinations.ai/prompt/";

export function buildPollinationsUrl(request: ResolvedImageRequest): string {
  const params = new URLSearchParams({
    width: String(request.width),
    height: String(request.height),
    seed: String(request.seed),
    model: request.model.upstreamModel,
    nologo: "true",
    private: "true",
    safe: "true",
    enhance: String(request.enhance),
  });
  return `${BASE_URL}${encodeURIComponent(request.prompt)}?${params.toString()}`;
}

/** Free, keyless text-to-image provider. An optional token lifts the anonymous rate limit. */
export function createPollinationsProvider(token?: string): ImageProvider {
  return {
    async generate(request, signal) {
      const headers: HeadersInit = { Accept: "image/*" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await upstreamFetch(buildPollinationsUrl(request), { headers }, signal, "Pollinations");
      return readImageResponse(response, "Pollinations");
    },
  };
}
