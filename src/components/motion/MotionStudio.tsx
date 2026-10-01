"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AssetPicker } from "@/components/gallery/AssetPicker";
import { useGallery } from "@/components/gallery/GalleryProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RangeField, SelectField } from "@/components/ui/Field";
import { EmptyState, Panel } from "@/components/ui/Panel";
import { useCanvasLoop } from "@/hooks/useCanvasLoop";
import { useLoadedImage } from "@/hooks/useLoadedImage";
import { useVideoRender } from "@/hooks/useVideoRender";
import { ASPECT_RATIO_IDS } from "@/lib/config";
import { getMotionPreset } from "@/lib/motion/presets";
import { drawShotLayers, frameSizeForAspect } from "@/lib/render/canvas";
import { PresetGrid } from "./PresetGrid";
import { RenderStatus } from "./RenderStatus";

export function MotionStudio({ initialAssetId, visible = true }: { initialAssetId?: string; visible?: boolean }) {
  const { items } = useGallery();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assetId, setAssetId] = useState<string | null>(initialAssetId ?? null);
  const [presetId, setPresetId] = useState("dolly-in");
  const [intensity, setIntensity] = useState(1);
  const [duration, setDuration] = useState(5);
  const [aspect, setAspect] = useState<string>("16:9");
  const { render, cancel, progress, error, result, clearError, rendering } = useVideoRender();

  const asset = items.find((item) => item.id === assetId && item.kind === "image");
  const { image, error: loadError } = useLoadedImage(asset?.url);
  const frame = useMemo(() => frameSizeForAspect(aspect), [aspect]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => {
      if (!image) return;
      drawShotLayers(ctx, frame, [{ image, presetId, intensity, durationSec: duration, localTime: t, alpha: 1 }]);
    },
    [image, frame, presetId, intensity, duration],
  );
  useCanvasLoop(canvasRef, image ? draw : null, duration, Boolean(image) && visible && !rendering);

  const startRender = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;
    void render({
      canvas,
      durationSec: duration,
      title: `${asset?.title ?? "Shot"} · ${getMotionPreset(presetId).label}`,
      renderFrame: (t) => draw(ctx, t),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <Panel title="Direct the shot">
        <div className="flex flex-col gap-5">
          <AssetPicker label="Source image" selectedId={assetId} onSelect={setAssetId} disabled={rendering} />
          <PresetGrid value={presetId} onChange={setPresetId} disabled={rendering} />
          <RangeField label="Intensity" value={intensity} min={0.25} max={2} step={0.25} format={(v) => `${v}×`} onChange={setIntensity} disabled={rendering} />
          <div className="grid grid-cols-2 gap-3">
            <RangeField label="Duration" value={duration} min={2} max={15} step={1} format={(v) => `${v}s`} onChange={setDuration} disabled={rendering} />
            <SelectField label="Frame" value={aspect} onChange={(e) => setAspect(e.target.value)} disabled={rendering} options={ASPECT_RATIO_IDS.map((id) => ({ value: id, label: id }))} />
          </div>
          <Button variant="primary" size="lg" onClick={startRender} disabled={!image} loading={rendering}>
            {rendering ? "Rendering…" : "🎥 Render video"}
          </Button>
        </div>
      </Panel>

      <Panel title="Preview">
        <div className="flex flex-col gap-4">
          {loadError && <Alert tone="error">{loadError}</Alert>}
          {asset ? (
            <canvas
              ref={canvasRef}
              width={frame.width}
              height={frame.height}
              role="img"
              aria-label={`Live preview: ${getMotionPreset(presetId).label} on ${asset.title}`}
              className="mx-auto max-h-[70vh] w-full rounded-2xl bg-black object-contain shadow-xl"
              style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
            />
          ) : (
            <EmptyState icon="🎥" title="Pick an image to bring it to life">
              Choose any image, then pick a camera move: dolly, crash zoom, orbit, earthquake and more.
            </EmptyState>
          )}
          <RenderStatus progress={progress} error={error} result={result} onCancel={cancel} onDismissError={clearError} />
        </div>
      </Panel>
    </div>
  );
}
