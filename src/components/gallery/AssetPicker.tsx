"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs cannot be optimised by next/image */
import { useId, useRef, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useGallery } from "./GalleryProvider";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

interface AssetPickerProps {
  label: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/** Choose an image from the gallery or upload one from the device. */
export function AssetPicker({ label, selectedId, onSelect, disabled }: AssetPickerProps) {
  const { items, addAsset } = useGallery();
  const inputRef = useRef<HTMLInputElement>(null);
  const groupId = useId();
  const [error, setError] = useState<string | null>(null);
  const images = items.filter((item) => item.kind === "image");

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (PNG, JPG, WebP…).");
    if (file.size > MAX_UPLOAD_BYTES) return setError("That image is larger than 25 MB. Please choose a smaller one.");
    setError(null);
    const item = await addAsset({ kind: "image", blob: file, title: file.name.replace(/\.[^.]+$/, "") || "Upload" });
    onSelect(item.id);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id={groupId} className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
          ⬆ Upload
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onUpload} tabIndex={-1} aria-hidden="true" />
      </div>
      {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}
      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No images yet. Upload one or create one in the Create tab.
        </p>
      ) : (
        <div role="radiogroup" aria-labelledby={groupId} className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto p-0.5 sm:grid-cols-5">
          {images.map((item) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={item.title}
                disabled={disabled}
                onClick={() => onSelect(item.id)}
                className={`aspect-square overflow-hidden rounded-lg ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-900 ${selected ? "ring-2 ring-violet-500" : "opacity-80 hover:opacity-100"}`}
              >
                <img src={item.url} alt="" className="size-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
