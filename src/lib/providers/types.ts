import type { ModelDefinition } from "../config";

export interface ResolvedImageRequest {
  /** Final prompt including any style descriptors. */
  prompt: string;
  width: number;
  height: number;
  seed: number;
  enhance: boolean;
  model: ModelDefinition;
}

export interface GeneratedImage {
  bytes: ArrayBuffer;
  contentType: string;
}

export interface ProviderEnv {
  HF_TOKEN?: string;
  POLLINATIONS_TOKEN?: string;
}

export interface ImageProvider {
  generate(request: ResolvedImageRequest, signal: AbortSignal): Promise<GeneratedImage>;
}
