"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs cannot be optimised by next/image */
import { useId } from "react";
import type { GalleryItem } from "@/components/gallery/GalleryProvider";
import { Button } from "@/components/ui/Button";
import { inputClass, Label, SelectField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import type { Scene } from "@/hooks/useStoryboard";
import { MOTION_PRESETS } from "@/lib/motion/presets";

interface SceneCardProps {
  scene: Scene;
  index: number;
  total: number;
  images: GalleryItem[];
  busy: boolean;
  onChange: (patch: Partial<Scene>) => void;
  onGenerate: () => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
}

const STATUS_TEXT: Partial<Record<Scene["status"], string>> = {
  queued: "Queued",
  generating: "Painting keyframe…",
  waiting: "Free tier cooldown…",
};

export function SceneCard({ scene, index, total, images, busy, onChange, onGenerate, onRemove, onMove }: SceneCardProps) {
  const promptId = useId();
  const keyframe = images.find((i) => i.id === scene.assetId);
  const statusText = STATUS_TEXT[scene.status];

  return (
    <li className="grid gap-3 rounded-2xl border border-zinc-200 p-3 sm:grid-cols-[160px_1fr] dark:border-zinc-800">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
        {keyframe ? (
          <img src={keyframe.url} alt={`Keyframe for scene ${index + 1}`} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-xs text-zinc-500">No keyframe yet</span>
        )}
        {statusText && (
          <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-semibold text-white" role="status">
            <span className="flex items-center gap-2">
              <Spinner /> {statusText}
            </span>
          </span>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 text-xs font-bold text-white">#{index + 1}</span>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <Label htmlFor={promptId}>Scene {index + 1} prompt</Label>
          <textarea id={promptId} rows={2} value={scene.prompt} onChange={(e) => onChange({ prompt: e.target.value })} placeholder="What happens in this shot?" className={`${inputClass} resize-y`} disabled={busy} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <SelectField label="Camera" value={scene.presetId} onChange={(e) => onChange({ presetId: e.target.value })} options={MOTION_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
          <SelectField label="Length" value={String(scene.durationSec)} onChange={(e) => onChange({ durationSec: Number(e.target.value) })} options={[2, 3, 4, 5, 6, 8, 10].map((s) => ({ value: String(s), label: `${s}s` }))} />
          <SelectField
            className="col-span-2 sm:col-span-1"
            label="Keyframe"
            value={scene.assetId ?? ""}
            onChange={(e) => onChange({ assetId: e.target.value || null })}
            options={[{ value: "", label: "None" }, ...images.map((i) => ({ value: i.id, label: i.title.slice(0, 40) }))]}
          />
        </div>
        {scene.status === "error" && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{scene.error}</p>}
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={onGenerate} disabled={busy || !scene.prompt.trim()}>
            {scene.assetId ? "↻ Regenerate" : "✨ Generate"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={busy || index === 0} aria-label={`Move scene ${index + 1} up`}>↑</Button>
          <Button size="sm" variant="ghost" onClick={() => onMove(1)} disabled={busy || index === total - 1} aria-label={`Move scene ${index + 1} down`}>↓</Button>
          <Button size="sm" variant="ghost" onClick={onRemove} disabled={busy || total <= 1} aria-label={`Remove scene ${index + 1}`}>🗑</Button>
        </div>
      </div>
    </li>
  );
}
