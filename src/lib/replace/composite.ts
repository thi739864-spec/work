import { coverSize, type Size } from "../motion/transform";

export type BackgroundSpec =
  | { type: "transparent" }
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "image"; image: HTMLImageElement | ImageBitmap; blur: number };

export interface GradientLine {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** CSS-style gradient line (0deg = bottom→top, 90deg = left→right) spanning the whole box. */
export function gradientLine(angleDeg: number, size: Size): GradientLine {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(size.width * dx) + Math.abs(size.height * dy)) / 2;
  const cx = size.width / 2;
  const cy = size.height / 2;
  return { x0: cx - dx * half, y0: cy - dy * half, x1: cx + dx * half, y1: cy + dy * half };
}

export interface CompositeOptions {
  subject: HTMLImageElement | ImageBitmap;
  background: BackgroundSpec;
  size: Size;
  shadow?: boolean;
}

function paintBackground(ctx: CanvasRenderingContext2D, background: BackgroundSpec, size: Size) {
  switch (background.type) {
    case "transparent":
      return;
    case "color":
      ctx.fillStyle = background.color;
      ctx.fillRect(0, 0, size.width, size.height);
      return;
    case "gradient": {
      const line = gradientLine(background.angle, size);
      const gradient = ctx.createLinearGradient(line.x0, line.y0, line.x1, line.y1);
      gradient.addColorStop(0, background.from);
      gradient.addColorStop(1, background.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.width, size.height);
      return;
    }
    case "image": {
      const cover = coverSize({ width: background.image.width, height: background.image.height }, size);
      ctx.save();
      if (background.blur > 0) ctx.filter = `blur(${background.blur}px)`;
      ctx.drawImage(background.image, (size.width - cover.width) / 2, (size.height - cover.height) / 2, cover.width, cover.height);
      ctx.restore();
    }
  }
}

/** Places a cut-out subject on a new background and returns a PNG. */
export async function compositeImage({ subject, background, size, shadow = false }: CompositeOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  paintBackground(ctx, background, size);
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = Math.round(size.width * 0.03);
    ctx.shadowOffsetY = Math.round(size.height * 0.015);
  }
  ctx.drawImage(subject, 0, 0, size.width, size.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export the image."))), "image/png"),
  );
}
