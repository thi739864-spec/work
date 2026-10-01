"use client";

import { useCallback, useMemo, useRef } from "react";
import { RenderStatus } from "@/components/motion/RenderStatus";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Panel";
import { useCanvasLoop } from "@/hooks/useCanvasLoop";
import { useVideoRender } from "@/hooks/useVideoRender";
import { layersAt, timelineDuration } from "@/lib/motion/timeline";
import { drawShotLayers, frameSizeForAspect } from "@/lib/render/canvas";

export interface StoryShot {
  image: HTMLImageElement;
  presetId: string;
  durationSec: number;
}

interface StoryPreviewProps {
  shots: StoryShot[];
  aspect: string;
  transitionSec: number;
  title: string;
  disabled?: boolean;
  /** Pauses the preview loop while the tab is hidden. */
  visible?: boolean;
}

/** Live storyboard playback plus "render to video". */
export function StoryPreview({ shots, aspect, transitionSec, title, disabled, visible = true }: StoryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useMemo(() => frameSizeForAspect(aspect), [aspect]);
  const total = timelineDuration(shots, transitionSec);
  const { render, cancel, progress, error, result, clearError, rendering } = useVideoRender();

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, t: number) => {
      const layers = layersAt(shots, transitionSec, t).map((layer) => {
        const shot = shots[layer.index];
        return { image: shot.image, presetId: shot.presetId, intensity: 1, durationSec: shot.durationSec, localTime: layer.localTime, alpha: layer.alpha };
      });
      drawShotLayers(ctx, frame, layers);
    },
    [shots, transitionSec, frame],
  );
  useCanvasLoop(canvasRef, shots.length ? draw : null, total, shots.length > 0 && visible && !rendering);

  const startRender = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    void render({ canvas, durationSec: total, title, renderFrame: (t) => draw(ctx, t) });
  };

  if (shots.length === 0) {
    return (
      <EmptyState icon="🎬" title="Your film plays here">
        Write a prompt for each scene and press Generate keyframes. Every scene gets its own camera move, joined with smooth crossfades.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={frame.width}
        height={frame.height}
        role="img"
        aria-label={`Storyboard preview with ${shots.length} scenes`}
        className="mx-auto max-h-[60vh] w-full rounded-2xl bg-black object-contain shadow-xl"
        style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          {shots.length} scene{shots.length > 1 ? "s" : ""} · {total.toFixed(1)}s
        </span>
        <Button variant="primary" onClick={startRender} loading={rendering} disabled={disabled}>
          {rendering ? "Rendering…" : "🎬 Render film"}
        </Button>
      </div>
      <RenderStatus progress={progress} error={error} result={result} onCancel={cancel} onDismissError={clearError} />
    </div>
  );
}
