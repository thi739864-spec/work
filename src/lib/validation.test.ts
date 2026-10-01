import { describe, expect, it } from "vitest";
import { PROMPT_MAX_LENGTH } from "./config";
import { buildPrompt } from "./prompt";
import { validateImageRequest } from "./validation";

describe("validateImageRequest", () => {
  it("applies defaults and trims the prompt", () => {
    const result = validateImageRequest({ prompt: "  neon city  " });
    expect(result).toEqual({
      ok: true,
      data: { prompt: "neon city", style: "none", aspect: "1:1", model: "flux", enhance: false },
    });
  });

  it("rejects prompts over the length limit", () => {
    const result = validateImageRequest({ prompt: "a".repeat(PROMPT_MAX_LENGTH + 1) });
    expect(result.ok).toBe(false);
  });

  it("rejects unknown aspect ratios and names the field", () => {
    const result = validateImageRequest({ prompt: "x", aspect: "5:1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/^aspect:/);
  });

  it("rejects non-integer or negative seeds", () => {
    expect(validateImageRequest({ prompt: "x", seed: 1.5 }).ok).toBe(false);
    expect(validateImageRequest({ prompt: "x", seed: -1 }).ok).toBe(false);
  });

  it("rejects non-object payloads", () => {
    expect(validateImageRequest(null).ok).toBe(false);
  });
});

describe("buildPrompt", () => {
  it("appends the style suffix and collapses whitespace", () => {
    expect(buildPrompt("a   fox\n in snow", "noir")).toMatch(/^a fox in snow, black and white film noir/);
  });

  it("leaves the prompt untouched with no style", () => {
    expect(buildPrompt("a fox", "none")).toBe("a fox");
  });
});
