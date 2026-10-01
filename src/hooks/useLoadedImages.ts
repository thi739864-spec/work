"use client";

import { useEffect, useState } from "react";
import { loadImage } from "@/lib/render/canvas";

/** Decodes many blob: URLs, returning a url → image map that fills in as they load. */
export function useLoadedImages(urls: readonly string[]): ReadonlyMap<string, HTMLImageElement> {
  const [loaded, setLoaded] = useState<ReadonlyMap<string, HTMLImageElement>>(new Map());
  const key = urls.join("|");

  useEffect(() => {
    let cancelled = false;
    const wanted = key ? key.split("|") : [];
    Promise.all(
      wanted.map((url) =>
        loadImage(url)
          .then((image) => [url, image] as const)
          .catch(() => null),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setLoaded(new Map(entries.filter((e): e is readonly [string, HTMLImageElement] => e !== null)));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return loaded;
}
