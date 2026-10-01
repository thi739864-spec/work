"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Repeatedly calls `draw(elapsedSeconds)` on animation frames, looping every
 * `durationSec`. Pauses while `active` is false (e.g. during a render).
 */
export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: ((ctx: CanvasRenderingContext2D, elapsedSec: number) => void) | null,
  durationSec: number,
  active: boolean,
): void {
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !active || durationSec <= 0) return;
    let handle = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const elapsed = ((now - start) / 1000) % durationSec;
      drawRef.current?.(ctx, elapsed);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [canvasRef, durationSec, active]);
}
