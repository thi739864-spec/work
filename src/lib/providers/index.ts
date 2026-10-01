import { MODELS, type ModelDefinition } from "../config";
import { GenerationError } from "../errors";
import { createHuggingFaceProvider } from "./huggingface";
import { createPollinationsProvider } from "./pollinations";
import type { ImageProvider, ProviderEnv } from "./types";

export function isModelAvailable(model: ModelDefinition, env: ProviderEnv): boolean {
  if (!model.requiresEnv) return true;
  return Boolean(env[model.requiresEnv as keyof ProviderEnv]);
}

export function listAvailableModels(env: ProviderEnv) {
  return MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    available: isModelAvailable(m, env),
  }));
}

export function resolveProvider(model: ModelDefinition, env: ProviderEnv): ImageProvider {
  switch (model.provider) {
    case "pollinations":
      return createPollinationsProvider(env.POLLINATIONS_TOKEN);
    case "huggingface":
      if (!env.HF_TOKEN) {
        throw new GenerationError(
          "provider_not_configured",
          "This model needs a free Hugging Face token. Add HF_TOKEN to .env.local and restart, or pick a free model.",
        );
      }
      return createHuggingFaceProvider(env.HF_TOKEN);
  }
}
