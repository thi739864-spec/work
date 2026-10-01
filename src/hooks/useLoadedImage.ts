"use client";

import { useEffect, useState } from "react";
import { loadImage } from "@/lib/render/canvas";

type LoadState = { url: string; image: HTMLImageElement | null; error: string | null };

/** Decodes the image at `url` (a blob: URL) for canvas drawing. */
export function useLoadedImage(url: string | undefined) {
  const [state, setState] = useState<LoadState | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    loadImage(url)
      .then((image) => !cancelled && setState({ url, image, error: null }))
      .catch((err: Error) => !cancelled && setState({ url, image: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  const current = state && state.url === url ? state : null;
  return { image: current?.image ?? null, error: current?.error ?? null, loading: Boolean(url) && !current };
}
