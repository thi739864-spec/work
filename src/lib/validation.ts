import { z } from "zod";
import { ASPECT_RATIO_IDS, MODEL_IDS, PROMPT_MAX_LENGTH, SEED_MAX, STYLE_IDS } from "./config";

export const imageRequestSchema = z.object({
  prompt: z
    .string({ error: "Prompt is required." })
    .trim()
    .min(1, "Prompt is required.")
    .max(PROMPT_MAX_LENGTH, `Prompt must be ${PROMPT_MAX_LENGTH} characters or fewer.`),
  style: z.enum(STYLE_IDS).default("none"),
  aspect: z.enum(ASPECT_RATIO_IDS).default("1:1"),
  model: z.enum(MODEL_IDS).default("flux"),
  seed: z.number().int().min(0).max(SEED_MAX).optional(),
  enhance: z.boolean().default(false),
});

export type ImageRequestInput = z.input<typeof imageRequestSchema>;
export type ImageRequest = z.output<typeof imageRequestSchema>;

export type ValidationResult = { ok: true; data: ImageRequest } | { ok: false; message: string };

export function validateImageRequest(input: unknown): ValidationResult {
  const parsed = imageRequestSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const path = issue?.path.join(".");
  const message = issue ? (path && path !== "prompt" ? `${path}: ${issue.message}` : issue.message) : "Invalid request.";
  return { ok: false, message };
}
