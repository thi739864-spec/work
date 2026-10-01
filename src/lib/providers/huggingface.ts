import { readImageResponse, upstreamFetch } from "./http";
import type { ImageProvider } from "./types";

const ROUTER_URL = "https://router.huggingface.co/hf-inference/models/";

/** Hugging Face Inference provider; works with a free account token (monthly credits apply). */
export function createHuggingFaceProvider(token: string): ImageProvider {
  return {
    async generate(request, signal) {
      const response = await upstreamFetch(
        `${ROUTER_URL}${request.model.upstreamModel}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "image/png",
          },
          body: JSON.stringify({
            inputs: request.prompt,
            parameters: { width: request.width, height: request.height, seed: request.seed },
          }),
        },
        signal,
        "Hugging Face",
      );
      return readImageResponse(response, "Hugging Face");
    },
  };
}
