export const VIDEO_MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.640028",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

/** Picks the best supported recording format, preferring MP4 for easy sharing. */
export function pickVideoMimeType(isSupported: (type: string) => boolean): string | null {
  return VIDEO_MIME_CANDIDATES.find((type) => isSupported(type)) ?? null;
}

export function fileExtensionFor(mimeType: string): "mp4" | "webm" {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}

export interface RecordOptions {
  canvas: HTMLCanvasElement;
  durationMs: number;
  fps?: number;
  /** Must draw the frame for the given elapsed time in milliseconds. */
  renderFrame: (elapsedMs: number) => void;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export interface RecordedVideo {
  blob: Blob;
  mimeType: string;
}

/** Records a canvas animation in real time using MediaRecorder. */
export function recordCanvas({ canvas, durationMs, fps = 30, renderFrame, onProgress, signal }: RecordOptions): Promise<RecordedVideo> {
  if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
    return Promise.reject(new Error("Video recording is not supported in this browser. Try the latest Chrome, Edge, Firefox or Safari."));
  }
  const mimeType = pickVideoMimeType((t) => MediaRecorder.isTypeSupported(t));
  if (!mimeType) return Promise.reject(new Error("This browser cannot encode MP4 or WebM video."));
  if (signal?.aborted) return Promise.reject(new DOMException("Render cancelled", "AbortError"));

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 });
  const chunks: Blob[] = [];
  let frameHandle = 0;
  let aborted = false;

  return new Promise<RecordedVideo>((resolve, reject) => {
    const cleanup = () => {
      cancelAnimationFrame(frameHandle);
      stream.getTracks().forEach((track) => track.stop());
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      aborted = true;
      if (recorder.state !== "inactive") recorder.stop();
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      cleanup();
      reject(new Error("The browser stopped recording unexpectedly. Please try again."));
    };
    recorder.onstop = () => {
      cleanup();
      if (aborted) return reject(new DOMException("Render cancelled", "AbortError"));
      if (chunks.length === 0) return reject(new Error("No video frames were captured. Keep this tab visible while rendering."));
      resolve({ blob: new Blob(chunks, { type: mimeType.split(";")[0] }), mimeType });
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = Math.min(now - start, durationMs);
      renderFrame(elapsed);
      onProgress?.(elapsed / durationMs);
      if (elapsed >= durationMs) {
        // Give the encoder one more frame interval to flush the final frame.
        setTimeout(() => recorder.state !== "inactive" && recorder.stop(), 1000 / fps);
        return;
      }
      frameHandle = requestAnimationFrame(tick);
    };

    renderFrame(0);
    recorder.start(250);
    frameHandle = requestAnimationFrame(tick);
  });
}
