"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { newAssetId, openAssetStore, type AssetStore, type GalleryAsset } from "@/lib/gallery/store";

export interface GalleryItem extends GalleryAsset {
  url: string;
}

export type NewAsset = Omit<GalleryAsset, "id" | "createdAt">;

interface GalleryContextValue {
  items: GalleryItem[];
  ready: boolean;
  persistent: boolean;
  error: string | null;
  clearError: () => void;
  addAsset: (asset: NewAsset) => Promise<GalleryItem>;
  removeAsset: (id: string) => Promise<void>;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Promise<AssetStore> | null>(null);
  const urlsRef = useRef(new Map<string, string>());
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const withUrl = useCallback((asset: GalleryAsset): GalleryItem => {
    let url = urlsRef.current.get(asset.id);
    if (!url) {
      url = URL.createObjectURL(asset.blob);
      urlsRef.current.set(asset.id, url);
    }
    return { ...asset, url };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const urls = urlsRef.current;
    (async () => {
      try {
        const storePromise = openAssetStore();
        storeRef.current = storePromise;
        const store = await storePromise;
        const assets = await store.list();
        if (cancelled) return;
        setPersistent(store.persistent);
        setItems(assets.map(withUrl));
      } catch (err) {
        console.error("[gallery] failed to load", err);
        if (!cancelled) setError("Your saved gallery could not be loaded. New creations will still work.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, [withUrl]);

  const addAsset = useCallback(
    async (asset: NewAsset) => {
      const item = withUrl({ ...asset, id: newAssetId(), createdAt: Date.now() });
      setItems((prev) => [item, ...prev]);
      try {
        // Waits for the store to finish opening, so very early saves are still persisted.
        await (await storeRef.current)?.put(item);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save to the gallery.");
      }
      return item;
    },
    [withUrl],
  );

  const removeAsset = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const url = urlsRef.current.get(id);
    if (url) URL.revokeObjectURL(url);
    urlsRef.current.delete(id);
    try {
      await (await storeRef.current)?.remove(id);
    } catch (err) {
      console.error("[gallery] delete failed", err);
      setError("That item could not be deleted from storage.");
    }
  }, []);

  const value = useMemo<GalleryContextValue>(
    () => ({ items, ready, persistent, error, clearError: () => setError(null), addAsset, removeAsset }),
    [items, ready, persistent, error, addAsset, removeAsset],
  );

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
}

export function useGallery(): GalleryContextValue {
  const context = useContext(GalleryContext);
  if (!context) throw new Error("useGallery must be used inside <GalleryProvider>.");
  return context;
}
