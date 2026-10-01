"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGallery, type GalleryItem } from "@/components/gallery/GalleryProvider";
import { loadImage } from "@/lib/render/canvas";
import { removeBackground, type RemovalStatus } from "@/lib/replace/background-removal";
import { compositeImage, type BackgroundSpec } from "@/lib/replace/composite";

export interface Cutout {
  blob: Blob;
  url: string;
  image: HTMLImageElement;
}

/** Cut-out + recomposite workflow for one source image. */
export function useBackgroundReplace(source: GalleryItem | undefined) {
  const { addAsset } = useGallery();
  const [cutout, setCutout] = useState<Cutout | null>(null);
  const [status, setStatus] = useState<RemovalStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GalleryItem | null>(null);
  const cutoutUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (cutoutUrlRef.current) URL.revokeObjectURL(cutoutUrlRef.current);
    },
    [],
  );

  const cutOut = useCallback(async () => {
    if (!source) return;
    setError(null);
    setResult(null);
    setStatus({ stage: "loading-model", progress: 0 });
    try {
      const blob = await removeBackground(source.blob, setStatus);
      if (cutoutUrlRef.current) URL.revokeObjectURL(cutoutUrlRef.current);
      const url = URL.createObjectURL(blob);
      cutoutUrlRef.current = url;
      setCutout({ blob, url, image: await loadImage(url) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Background removal failed.");
    } finally {
      setStatus(null);
    }
  }, [source]);

  const save = useCallback(
    async (background: BackgroundSpec, shadow: boolean) => {
      if (!cutout || !source) return;
      setSaving(true);
      setError(null);
      try {
        const size = { width: cutout.image.naturalWidth, height: cutout.image.naturalHeight };
        const blob = await compositeImage({ subject: cutout.image, background, size, shadow });
        setResult(await addAsset({ kind: "image", blob, title: `${source.title} · replaced`, ...size }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the final image.");
      } finally {
        setSaving(false);
      }
    },
    [cutout, source, addAsset],
  );

  return { cutout, status, saving, error, result, cutOut, save, clearError: () => setError(null) };
}
