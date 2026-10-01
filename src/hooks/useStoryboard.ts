"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGallery } from "@/components/gallery/GalleryProvider";
import { requestImageWithRetry } from "@/lib/client/generate-image";
import type { AspectRatio, ModelId, StyleId } from "@/lib/config";
import { GenerationError } from "@/lib/errors";
import { randomSeed } from "@/lib/prompt";

export interface Scene {
  id: string;
  prompt: string;
  presetId: string;
  durationSec: number;
  assetId: string | null;
  status: "idle" | "queued" | "generating" | "waiting" | "error";
  error?: string;
}

export interface StorySettings {
  style: StyleId;
  aspect: AspectRatio;
  model: ModelId;
  transitionSec: number;
}

export const MAX_SCENES = 12;
const PRESET_CYCLE = ["dolly-in", "pan-right", "orbit-left", "crane-up", "ken-burns", "crash-zoom-in"];

const newScene = (index: number, prompt = ""): Scene => ({
  id: globalThis.crypto.randomUUID(),
  prompt,
  presetId: PRESET_CYCLE[index % PRESET_CYCLE.length],
  durationSec: 4,
  assetId: null,
  status: "idle",
});

export function useStoryboard() {
  const { addAsset } = useGallery();
  const controllerRef = useRef<AbortController | null>(null);
  const [scenes, setScenes] = useState<Scene[]>(() => [newScene(0), newScene(1)]);
  const [settings, setSettings] = useState<StorySettings>({ style: "cinematic", aspect: "16:9", model: "flux", transitionSec: 0.6 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const updateScene = useCallback((id: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addScene = () => setScenes((prev) => (prev.length >= MAX_SCENES ? prev : [...prev, newScene(prev.length)]));
  const removeScene = (id: string) => setScenes((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  const moveScene = (id: string, delta: -1 | 1) =>
    setScenes((prev) => {
      const from = prev.findIndex((s) => s.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  /** Generates keyframes for the given scenes one at a time (free tiers are rate limited). */
  const generate = useCallback(
    async (targets: Scene[]) => {
      const queue = targets.filter((s) => s.prompt.trim());
      if (queue.length === 0) return;
      const controller = new AbortController();
      controllerRef.current = controller;
      setGenerating(true);
      queue.forEach((s) => updateScene(s.id, { status: "queued", error: undefined }));

      for (const scene of queue) {
        if (controller.signal.aborted) break;
        updateScene(scene.id, { status: "generating" });
        try {
          const image = await requestImageWithRetry(
            { prompt: scene.prompt, style: settings.style, aspect: settings.aspect, model: settings.model, seed: randomSeed() },
            { signal: controller.signal, onWait: () => updateScene(scene.id, { status: "waiting" }) },
          );
          const item = await addAsset({
            kind: "image",
            blob: image.blob,
            title: scene.prompt,
            width: image.width,
            height: image.height,
            params: { prompt: scene.prompt, style: settings.style, aspect: settings.aspect, model: image.model, seed: image.seed },
          });
          updateScene(scene.id, { status: "idle", assetId: item.id });
        } catch (err) {
          const aborted = err instanceof GenerationError && err.code === "aborted";
          updateScene(scene.id, aborted ? { status: "idle" } : { status: "error", error: err instanceof Error ? err.message : "Failed" });
        }
      }
      setScenes((prev) => prev.map((s) => (s.status === "queued" ? { ...s, status: "idle" } : s)));
      if (controllerRef.current === controller) controllerRef.current = null;
      setGenerating(false);
    },
    [addAsset, settings, updateScene],
  );

  const cancel = () => controllerRef.current?.abort();

  return { scenes, settings, setSettings, updateScene, addScene, removeScene, moveScene, generate, cancel, generating };
}
