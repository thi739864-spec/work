import { afterEach, describe, expect, it, vi } from "vitest";
import { handleGenerateImage } from "./generate-image";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

function post(body: unknown, raw = false) {
  return new Request("http://localhost/api/generate/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function mockUpstream(response: Response | Error) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
}

afterEach(() => vi.restoreAllMocks());

describe("handleGenerateImage", () => {
  it("returns the generated image with seed and size metadata", async () => {
    const fetchSpy = mockUpstream(new Response(PNG_BYTES, { headers: { "content-type": "image/png" } }));

    const res = await handleGenerateImage(post({ prompt: "a red fox", style: "cinematic", aspect: "16:9", seed: 42 }), {});

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-seed")).toBe("42");
    expect(res.headers.get("x-width")).toBe("1280");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG_BYTES);
    const calledUrl = String(fetchSpy.mock.calls[0][0]);
    expect(calledUrl).toContain("image.pollinations.ai/prompt/a%20red%20fox%2C%20cinematic");
    expect(calledUrl).toContain("seed=42");
  });

  it("generates a random seed when none is supplied", async () => {
    mockUpstream(new Response(PNG_BYTES, { headers: { "content-type": "image/jpeg" } }));
    const res = await handleGenerateImage(post({ prompt: "castle" }), {});
    expect(Number(res.headers.get("x-seed"))).toBeGreaterThanOrEqual(0);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await handleGenerateImage(post("{not json", true), {});
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_request");
  });

  it("rejects an empty prompt with 400 without calling upstream", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await handleGenerateImage(post({ prompt: "   " }), {});
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe("Prompt is required.");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("propagates upstream rate limits as 429 with Retry-After", async () => {
    mockUpstream(new Response("slow down", { status: 429, headers: { "retry-after": "12" } }));
    const res = await handleGenerateImage(post({ prompt: "dragon" }), {});
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("12");
    expect((await res.json()).error.retryAfter).toBe(12);
  });

  it("maps upstream timeouts to 504", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );
    const res = await handleGenerateImage(post({ prompt: "slow" }), {}, 20);
    expect(res.status).toBe(504);
    expect((await res.json()).error.code).toBe("upstream_timeout");
  });

  it("maps network failures to 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpstream(new TypeError("fetch failed"));
    const res = await handleGenerateImage(post({ prompt: "offline" }), {});
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("network_error");
  });

  it("rejects non-image upstream payloads with 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpstream(new Response("<html>oops</html>", { headers: { "content-type": "text/html" } }));
    const res = await handleGenerateImage(post({ prompt: "html" }), {});
    expect(res.status).toBe(502);
  });

  it("rejects SVG payloads, which could carry script", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpstream(new Response("<svg onload=alert(1)>", { headers: { "content-type": "image/svg+xml" } }));
    const res = await handleGenerateImage(post({ prompt: "svg" }), {});
    expect(res.status).toBe(502);
  });

  it("returns 503 for Hugging Face models when HF_TOKEN is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleGenerateImage(post({ prompt: "x", model: "hf-flux-schnell" }), {});
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("provider_not_configured");
  });

  it("sends the Hugging Face token when configured", async () => {
    const fetchSpy = mockUpstream(new Response(PNG_BYTES, { headers: { "content-type": "image/png" } }));
    const res = await handleGenerateImage(post({ prompt: "x", model: "hf-flux-schnell" }), { HF_TOKEN: "hf_test" });
    expect(res.status).toBe(200);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer hf_test");
  });
});
