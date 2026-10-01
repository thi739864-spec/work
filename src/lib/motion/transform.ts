import type { CameraPose } from "./presets";

export interface Size {
  width: number;
  height: number;
}

export interface DrawParams {
  /** Image size after cover-fitting into the frame (before camera scale). */
  cover: Size;
  scale: number;
  rotation: number;
  /** Translation applied in cover-image pixels (negated look-at point). */
  translateX: number;
  translateY: number;
}

const MAX_LOOK = 0.3;

/** Size of `source` scaled so it fully covers `target` while keeping its aspect ratio. */
export function coverSize(source: Size, target: Size): Size {
  if (source.width <= 0 || source.height <= 0) throw new Error("Source size must be positive.");
  const k = Math.max(target.width / source.width, target.height / source.height);
  return { width: source.width * k, height: source.height * k };
}

/**
 * Smallest camera scale that keeps the (rotated, offset) frame entirely inside
 * the image, so no empty borders ever appear.
 */
export function minimumScale(pose: CameraPose, frame: Size, cover: Size): number {
  const cos = Math.abs(Math.cos(pose.rotation));
  const sin = Math.abs(Math.sin(pose.rotation));
  const spanX = frame.width * cos + frame.height * sin;
  const spanY = frame.width * sin + frame.height * cos;
  const sx = spanX / (cover.width * (1 - 2 * Math.abs(pose.lookX)));
  const sy = spanY / (cover.height * (1 - 2 * Math.abs(pose.lookY)));
  return Math.max(1, sx, sy);
}

export function resolveDrawParams(pose: CameraPose, image: Size, frame: Size): DrawParams {
  const cover = coverSize(image, frame);
  const safe: CameraPose = {
    ...pose,
    lookX: Math.max(-MAX_LOOK, Math.min(MAX_LOOK, pose.lookX)),
    lookY: Math.max(-MAX_LOOK, Math.min(MAX_LOOK, pose.lookY)),
  };
  return {
    cover,
    scale: Math.max(safe.scale, minimumScale(safe, frame, cover)),
    rotation: safe.rotation,
    translateX: -safe.lookX * cover.width,
    translateY: -safe.lookY * cover.height,
  };
}

/** Maps the frame's corners into centred cover-image coordinates (used to verify coverage). */
export function frameCornersInImage(params: DrawParams, frame: Size): Array<{ x: number; y: number }> {
  const cos = Math.cos(-params.rotation);
  const sin = Math.sin(-params.rotation);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const fx = (sx * frame.width) / 2;
    const fy = (sy * frame.height) / 2;
    return {
      x: (fx * cos - fy * sin) / params.scale - params.translateX,
      y: (fx * sin + fy * cos) / params.scale - params.translateY,
    };
  });
}
