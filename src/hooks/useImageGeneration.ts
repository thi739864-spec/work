"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGallery, type GalleryItem } from "@/components/gallery/GalleryProvider";
import { requestImageWithRetry } from "@/lib/client/generate-image";
import type { AspectRatio, ModelId, StyleId } from "@/lib/config";
import { GenerationError } from "@/lib/errors";
import { randomSeed } from "@/lib/prompt";

export interface GenerationSettings {
  prompt: string;
  style: StyleId;
  aspect: AspectRatio;
  model: ModelId;
  count: number;
  /** `null` means a fresh random seed per image. */
  seed: number | null;
  enhance: boolean;
}

export interface GenerationProgress {
  done: number;
  total: number;
  waitingSeconds: number | null;
}

export function useImageGeneration() {
  const { addAsset } = useGallery();
  const controllerRef = useRef<AbortController | null>(null);
  const [results, setResults] = useState<GalleryItem[]>([]);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const generate = useCallback(
    async (settings: GenerationSettings) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setError(null);
      setResults([]);
      setProgress({ done: 0, total: settings.count, waitingSeconds: null });

      for (let i = 0; i < settings.count; i++) {
        const seed = settings.seed === null ? randomSeed() : settings.seed + i;
        try {
          const image = await requestImageWithRetry(
            { prompt: settings.prompt, style: settings.style, aspect: settings.aspect, model: settings.model, enhance: settings.enhance, seed },
            { signal: controller.signal, onWait: (s) => setProgress((p) => (p ? { ...p, waitingSeconds: s } : p)) },
          );
          const item = await addAsset({
            kind: "image",
            blob: image.blob,
            title: settings.prompt,
            width: image.width,
            height: image.height,
            params: { prompt: settings.prompt, style: settings.style, aspect: settings.aspect, model: image.model, seed: image.seed },
          });
          setResults((prev) => [...prev, item]);
          setProgress({ done: i + 1, total: settings.count, waitingSeconds: null });
        } catch (err) {
          if (err instanceof GenerationError && err.code === "aborted") break;
          setError(err instanceof Error ? err.message : "Image generation failed.");
          break;
        }
      }

      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setProgress(null);
      }
    },
    [addAsset],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setProgress(null);
  }, []);

  return { generate, cancel, results, progress, error, clearError: () => setError(null), busy: progress !== null };
}
