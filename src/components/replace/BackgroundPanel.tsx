"use client";

import { useId, useState } from "react";
import { AssetPicker } from "@/components/gallery/AssetPicker";
import { useGallery } from "@/components/gallery/GalleryProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { inputClass, RangeField } from "@/components/ui/Field";
import { requestImageWithRetry } from "@/lib/client/generate-image";
import type { AspectRatio } from "@/lib/config";

export type BackgroundChoice =
  | { type: "transparent" }
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "image"; assetId: string | null; blur: number };

const MODES = [
  { type: "image", label: "🌄 Scene" },
  { type: "gradient", label: "🌈 Gradient" },
  { type: "color", label: "🎨 Color" },
  { type: "transparent", label: "▦ None" },
] as const;

const DEFAULTS: Record<BackgroundChoice["type"], BackgroundChoice> = {
  image: { type: "image", assetId: null, blur: 0 },
  gradient: { type: "gradient", from: "#c026d3", to: "#06b6d4", angle: 135 },
  color: { type: "color", color: "#18181b" },
  transparent: { type: "transparent" },
};

interface BackgroundPanelProps {
  value: BackgroundChoice;
  onChange: (choice: BackgroundChoice) => void;
  aspect: AspectRatio;
}

export function BackgroundPanel({ value, onChange, aspect }: BackgroundPanelProps) {
  const { addAsset } = useGallery();
  const promptId = useId();
  const [scenePrompt, setScenePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScene = async () => {
    setGenerating(true);
    setError(null);
    try {
      const image = await requestImageWithRetry({ prompt: scenePrompt, aspect, style: "photoreal" });
      const item = await addAsset({ kind: "image", blob: image.blob, title: `Background: ${scenePrompt}`, width: image.width, height: image.height });
      onChange({ type: "image", assetId: item.id, blur: value.type === "image" ? value.blur : 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the background.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Background type" className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-800">
        {MODES.map((mode) => (
          <button
            key={mode.type}
            type="button"
            role="radio"
            aria-checked={value.type === mode.type}
            onClick={() => onChange(DEFAULTS[mode.type])}
            className={`rounded-lg px-1 py-1.5 text-xs font-semibold transition ${value.type === mode.type ? "bg-white shadow dark:bg-zinc-950" : "opacity-70 hover:opacity-100"}`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {value.type === "image" && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400" htmlFor={promptId}>
              Generate a new scene with AI
            </label>
            <div className="flex gap-2">
              <input id={promptId} value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} placeholder="e.g. tropical beach at golden hour" className={inputClass} />
              <Button variant="primary" onClick={generateScene} disabled={!scenePrompt.trim()} loading={generating}>
                ✨
              </Button>
            </div>
            {error && <Alert tone="error" onDismiss={() => setError(null)}>{error}</Alert>}
          </div>
          <AssetPicker label="Or pick a background" selectedId={value.assetId} onSelect={(assetId) => onChange({ ...value, assetId })} />
          <RangeField label="Background blur" value={value.blur} min={0} max={24} step={2} format={(v) => `${v}px`} onChange={(blur) => onChange({ ...value, blur })} />
        </>
      )}

      {value.type === "gradient" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="color" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="h-9 w-12 rounded" /> From
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="color" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="h-9 w-12 rounded" /> To
          </label>
          <div className="col-span-2">
            <RangeField label="Angle" value={value.angle} min={0} max={360} step={15} format={(v) => `${v}°`} onChange={(angle) => onChange({ ...value, angle })} />
          </div>
        </div>
      )}

      {value.type === "color" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="color" value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} className="h-9 w-12 rounded" /> Background color
        </label>
      )}
    </div>
  );
}
