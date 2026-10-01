import { evaluatePreset, getMotionPreset } from "../motion/presets";
import { resolveDrawParams, type Size } from "../motion/transform";

export interface ShotLayer {
  image: HTMLImageElement | ImageBitmap;
  presetId: string;
  intensity: number;
  durationSec: number;
  localTime: number;
  alpha: number;
}

function imageSize(image: HTMLImageElement | ImageBitmap): Size {
  return "naturalWidth" in image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : { width: image.width, height: image.height };
}

/** Draws one or more camera-animated layers into a 2D context. */
export function drawShotLayers(ctx: CanvasRenderingContext2D, frame: Size, layers: readonly ShotLayer[]): void {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, frame.width, frame.height);
  for (const layer of layers) {
    const size = imageSize(layer.image);
    if (size.width === 0 || size.height === 0) continue;
    const pose = evaluatePreset(getMotionPreset(layer.presetId), layer.localTime, layer.durationSec, layer.intensity);
    const params = resolveDrawParams(pose, size, frame);
    ctx.save();
    ctx.globalAlpha = layer.alpha;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(frame.width / 2, frame.height / 2);
    ctx.rotate(params.rotation);
    ctx.scale(params.scale, params.scale);
    ctx.translate(params.translateX, params.translateY);
    ctx.drawImage(layer.image, -params.cover.width / 2, -params.cover.height / 2, params.cover.width, params.cover.height);
    ctx.restore();
  }
  ctx.restore();
}

/** Loads an image from a (same-origin or blob:) URL and waits for it to decode. */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  try {
    await image.decode();
  } catch (error) {
    throw new Error("This image could not be decoded. Try a different file.", { cause: error });
  }
  return image;
}

/** Output frame size for a given aspect ratio, capped to a sensible long edge. */
export function frameSizeForAspect(aspect: string, longEdge = 1280): Size {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) throw new Error(`Invalid aspect ratio: ${aspect}`);
  const even = (n: number) => Math.round(n / 2) * 2;
  return w >= h ? { width: longEdge, height: even((longEdge * h) / w) } : { width: even((longEdge * w) / h), height: longEdge };
}
