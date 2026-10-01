import type { AspectRatio, ModelId, StyleId } from "../config";

export interface GenerationParams {
  prompt: string;
  style: StyleId;
  aspect: AspectRatio;
  model: ModelId;
  seed: number;
}

export interface GalleryAsset {
  id: string;
  kind: "image" | "video";
  blob: Blob;
  title: string;
  createdAt: number;
  width?: number;
  height?: number;
  /** Present for AI-generated images so they can be remixed. */
  params?: GenerationParams;
}

export interface AssetStore {
  /** False when falling back to memory (private mode, blocked storage). */
  readonly persistent: boolean;
  list(): Promise<GalleryAsset[]>;
  put(asset: GalleryAsset): Promise<void>;
  remove(id: string): Promise<void>;
}

const DB_NAME = "genjutsu";
const STORE = "assets";

export function createMemoryStore(): AssetStore {
  const assets = new Map<string, GalleryAsset>();
  return {
    persistent: false,
    async list() {
      return [...assets.values()].sort((a, b) => b.createdAt - a.createdAt);
    },
    async put(asset) {
      assets.set(asset.id, asset);
    },
    async remove(id) {
      assets.delete(id);
    },
  };
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function describeStorageError(error: unknown): Error {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "QuotaExceededError") return new Error("Browser storage is full. Delete a few items from your gallery and try again.");
  return new Error("Could not save to the gallery.", { cause: error });
}

function createIndexedDbStore(db: IDBDatabase): AssetStore {
  const tx = (mode: IDBTransactionMode) => db.transaction(STORE, mode).objectStore(STORE);
  return {
    persistent: true,
    async list() {
      const all = await promisify(tx("readonly").getAll() as IDBRequest<GalleryAsset[]>);
      return all.sort((a, b) => b.createdAt - a.createdAt);
    },
    async put(asset) {
      try {
        await promisify(tx("readwrite").put(asset));
      } catch (error) {
        throw describeStorageError(error);
      }
    },
    async remove(id) {
      await promisify(tx("readwrite").delete(id));
    },
  };
}

/** Opens the persistent gallery, falling back to an in-memory store when IndexedDB is unavailable. */
export async function openAssetStore(factory: IDBFactory | undefined = globalThis.indexedDB): Promise<AssetStore> {
  if (!factory) return createMemoryStore();
  try {
    const request = factory.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    return createIndexedDbStore(await promisify(request));
  } catch (error) {
    console.warn("[gallery] IndexedDB unavailable, using memory store", error);
    return createMemoryStore();
  }
}

export function newAssetId(): string {
  return globalThis.crypto.randomUUID();
}
