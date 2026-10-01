"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGallery, type GalleryItem } from "@/components/gallery/GalleryProvider";
import { recordCanvas } from "@/lib/render/recorder";

interface RenderJob {
  canvas: HTMLCanvasElement;
  durationSec: number;
  title: string;
  renderFrame: (elapsedSec: number) => void;
}

/** Records a canvas animation to video, saving the result to the gallery. */
export function useVideoRender() {
  const { addAsset } = useGallery();
  const controllerRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GalleryItem | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const render = useCallback(
    async ({ canvas, durationSec, title, renderFrame }: RenderJob) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setError(null);
      setResult(null);
      setProgress(0);
      try {
        const video = await recordCanvas({
          canvas,
          durationMs: durationSec * 1000,
          renderFrame: (ms) => renderFrame(ms / 1000),
          onProgress: setProgress,
          signal: controller.signal,
        });
        const item = await addAsset({ kind: "video", blob: video.blob, title, width: canvas.width, height: canvas.height });
        setResult(item);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Rendering failed.");
        }
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
        setProgress(null);
      }
    },
    [addAsset],
  );

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return { render, cancel, progress, error, result, clearError: () => setError(null), rendering: progress !== null };
}
