import { STYLE_PRESETS, type StyleId } from "./config";

/** Combines the user's prompt with the descriptor suffix of the chosen style preset. */
export function buildPrompt(prompt: string, style: StyleId): string {
  const base = prompt.trim().replace(/\s+/g, " ");
  const preset = STYLE_PRESETS.find((s) => s.id === style);
  if (!preset || !preset.suffix) return base;
  return `${base}, ${preset.suffix}`;
}

/** Returns a cryptographically random seed within the provider-safe range. */
export function randomSeed(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] % 2_147_483_647;
}
