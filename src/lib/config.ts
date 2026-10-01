/**
 * Shared, framework-agnostic constants used by both the API route and the UI.
 */

export const PROMPT_MAX_LENGTH = 1000;
export const SEED_MAX = 2_147_483_647;

export const ASPECT_RATIOS = {
  "1:1": { width: 1024, height: 1024, label: "Square" },
  "16:9": { width: 1280, height: 720, label: "Widescreen" },
  "9:16": { width: 720, height: 1280, label: "Vertical" },
  "4:5": { width: 896, height: 1120, label: "Portrait" },
  "3:2": { width: 1152, height: 768, label: "Photo" },
  "21:9": { width: 1344, height: 576, label: "Cinema" },
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;
export const ASPECT_RATIO_IDS = Object.keys(ASPECT_RATIOS) as [AspectRatio, ...AspectRatio[]];

/** The supported aspect ratio closest to `width × height` (compared in log space). */
export function nearestAspectRatio(width: number, height: number): AspectRatio {
  if (width <= 0 || height <= 0) return "1:1";
  const target = Math.log(width / height);
  return ASPECT_RATIO_IDS.reduce((best, id) => {
    const a = ASPECT_RATIOS[id];
    const b = ASPECT_RATIOS[best];
    return Math.abs(Math.log(a.width / a.height) - target) < Math.abs(Math.log(b.width / b.height) - target) ? id : best;
  });
}

export type ProviderId = "pollinations" | "huggingface";

export interface ModelDefinition {
  id: string;
  label: string;
  description: string;
  provider: ProviderId;
  /** Model identifier understood by the upstream provider. */
  upstreamModel: string;
  /** Environment variable that must be set for this model to work, if any. */
  requiresEnv?: string;
}

export const MODELS = [
  {
    id: "flux",
    label: "Flux (free)",
    description: "High quality, no key required. Free tier is rate limited.",
    provider: "pollinations",
    upstreamModel: "flux",
  },
  {
    id: "turbo",
    label: "Turbo (free)",
    description: "Fastest drafts, no key required.",
    provider: "pollinations",
    upstreamModel: "turbo",
  },
  {
    id: "hf-flux-schnell",
    label: "FLUX.1 schnell (Hugging Face)",
    description: "Needs a free Hugging Face token in HF_TOKEN.",
    provider: "huggingface",
    upstreamModel: "black-forest-labs/FLUX.1-schnell",
    requiresEnv: "HF_TOKEN",
  },
] as const satisfies readonly ModelDefinition[];

export type ModelId = (typeof MODELS)[number]["id"];
export const MODEL_IDS = MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];

export function getModel(id: ModelId): ModelDefinition {
  const model = MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  return model;
}

export const STYLE_PRESETS = [
  { id: "none", label: "No style", suffix: "" },
  { id: "cinematic", label: "Cinematic", suffix: "cinematic film still, anamorphic lens, dramatic lighting, shallow depth of field, color graded" },
  { id: "photoreal", label: "Photoreal", suffix: "ultra realistic photograph, 85mm, natural light, highly detailed skin and textures" },
  { id: "anime", label: "Anime", suffix: "anime key visual, clean line art, vibrant cel shading, detailed background" },
  { id: "cyberpunk", label: "Cyberpunk", suffix: "cyberpunk, neon rim lighting, rain-soaked streets, holograms, moody atmosphere" },
  { id: "fantasy", label: "Epic Fantasy", suffix: "epic fantasy concept art, volumetric god rays, painterly, grand scale" },
  { id: "noir", label: "Noir", suffix: "black and white film noir, hard shadows, venetian blind light, high contrast" },
  { id: "watercolor", label: "Watercolor", suffix: "loose watercolor painting, soft bleeding edges, textured paper" },
  { id: "3d", label: "3D Render", suffix: "octane render, subsurface scattering, studio lighting, stylized 3D" },
  { id: "claymation", label: "Claymation", suffix: "claymation stop-motion style, handcrafted clay textures, miniature set" },
  { id: "vaporwave", label: "Vaporwave", suffix: "vaporwave aesthetic, pastel gradients, retro 80s, chrome and palm trees" },
  { id: "comic", label: "Comic Book", suffix: "comic book panel, bold ink outlines, halftone shading, dynamic composition" },
] as const;

export type StyleId = (typeof STYLE_PRESETS)[number]["id"];
export const STYLE_IDS = STYLE_PRESETS.map((s) => s.id) as [StyleId, ...StyleId[]];

/** Upstream requests that take longer than this are aborted (ms). */
export const UPSTREAM_TIMEOUT_MS = 55_000;
/** Refuse upstream payloads larger than this (bytes). */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
