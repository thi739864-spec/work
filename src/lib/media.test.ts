import { afterEach, describe, expect, it, vi } from "vitest";
import { requestImageWithRetry } from "./client/generate-image";
import { nearestAspectRatio } from "./config";
import { GenerationError, parseRetryAfter } from "./errors";
import { createMemoryStore, openAssetStore, type GalleryAsset } from "./gallery/store";
import { frameSizeForAspect } from "./render/canvas";
import { fileExtensionFor, pickVideoMimeType } from "./render/recorder";
import { gradientLine } from "./replace/composite";

afterEach(() => vi.useRealTimers());

describe("video format selection", () => {
  it("prefers MP4 and falls back to WebM", () => {
    expect(pickVideoMimeType(() => true)).toMatch(/^video\/mp4/);
    expect(pickVideoMimeType((t) => t.startsWith("video/webm"))).toBe("video/webm;codecs=vp9");
    expect(pickVideoMimeType(() => false)).toBeNull();
    expect(fileExtensionFor("video/webm;codecs=vp9")).toBe("webm");
  });

  it("computes even-sized frames per aspect ratio", () => {
    expect(frameSizeForAspect("16:9")).toEqual({ width: 1280, height: 720 });
    expect(frameSizeForAspect("9:16")).toEqual({ width: 720, height: 1280 });
    expect(() => frameSizeForAspect("wide")).toThrow();
  });
});

describe("nearestAspectRatio", () => {
  it("matches common photo shapes and guards bad input", () => {
    expect(nearestAspectRatio(1920, 1080)).toBe("16:9");
    expect(nearestAspectRatio(1080, 1920)).toBe("9:16");
    expect(nearestAspectRatio(4000, 3000)).toBe("3:2");
    expect(nearestAspectRatio(0, 100)).toBe("1:1");
  });
});

describe("gradientLine", () => {
  it("runs left to right at 90 degrees", () => {
    const line = gradientLine(90, { width: 200, height: 100 });
    expect(line.x0).toBeCloseTo(0);
    expect(line.x1).toBeCloseTo(200);
    expect(line.y0).toBeCloseTo(50);
  });
});

describe("gallery store", () => {
  const asset = (id: string, createdAt: number): GalleryAsset => ({ id, kind: "image", blob: new Blob(["x"]), title: id, createdAt });

  it("falls back to memory when IndexedDB is unavailable", async () => {
    const store = await openAssetStore(undefined);
    expect(store.persistent).toBe(false);
  });

  it("lists newest first and supports removal", async () => {
    const store = createMemoryStore();
    await store.put(asset("old", 1));
    await store.put(asset("new", 2));
    expect((await store.list()).map((a) => a.id)).toEqual(["new", "old"]);
    await store.remove("new");
    expect((await store.list()).map((a) => a.id)).toEqual(["old"]);
  });
});

describe("requestImageWithRetry", () => {
  const ok = () => new Response(new Blob(["img"], { type: "image/png" }), { headers: { "x-seed": "7", "x-model": "flux" } });
  const limited = () => Response.json({ error: { code: "rate_limited", message: "wait", retryAfter: 1 } }, { status: 429 });

  it("waits out a rate limit then succeeds", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(limited()).mockResolvedValueOnce(ok());
    const onWait = vi.fn();
    const pending = requestImageWithRetry({ prompt: "x" }, { onWait });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await pending;
    expect(onWait).toHaveBeenCalledWith(1);
    expect(result.seed).toBe(7);
  });

  it("does not retry validation errors", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ error: { code: "invalid_request", message: "Prompt is required." } }, { status: 400 }));
    await expect(requestImageWithRetry({ prompt: "" })).rejects.toMatchObject({ code: "invalid_request" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("reports network failures as GenerationError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(requestImageWithRetry({ prompt: "x" }, { maxRetries: 0 })).rejects.toBeInstanceOf(GenerationError);
  });

  it("parses Retry-After safely", () => {
    expect(parseRetryAfter("abc")).toBe(15);
    expect(parseRetryAfter("9999")).toBe(120);
  });
});
