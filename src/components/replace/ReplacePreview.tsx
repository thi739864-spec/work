"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs cannot be optimised by next/image */
import type { CSSProperties } from "react";
import type { BackgroundChoice } from "./BackgroundPanel";

/** Blur is expressed relative to an 800px-wide image so preview and export match at any size. */
export const BLUR_REFERENCE_WIDTH = 800;

const CHECKERBOARD = "repeating-conic-gradient(#a1a1aa33 0 25%, transparent 0 50%) 0 0 / 20px 20px";

interface ReplacePreviewProps {
  subjectUrl: string;
  subjectAlt: string;
  aspectRatio: number;
  background: BackgroundChoice | null;
  backgroundUrl?: string;
  shadow: boolean;
}

function backgroundStyle(choice: BackgroundChoice | null): CSSProperties {
  if (!choice || choice.type === "transparent" || choice.type === "image") return { background: CHECKERBOARD };
  if (choice.type === "color") return { background: choice.color };
  return { background: `linear-gradient(${choice.angle}deg, ${choice.from}, ${choice.to})` };
}

export function ReplacePreview({ subjectUrl, subjectAlt, aspectRatio, background, backgroundUrl, shadow }: ReplacePreviewProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl shadow-xl [container-type:inline-size]"
      style={{ aspectRatio, ...backgroundStyle(background) }}
    >
      {background?.type === "image" && backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ filter: background.blur ? `blur(calc(${background.blur} * 100cqw / ${BLUR_REFERENCE_WIDTH}))` : undefined }}
        />
      )}
      <img
        src={subjectUrl}
        alt={subjectAlt}
        className="relative size-full object-contain"
        style={{ filter: shadow && background ? "drop-shadow(0 1.5cqw 3cqw rgba(0,0,0,0.45))" : undefined }}
      />
    </div>
  );
}
