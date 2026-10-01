import { easings, smoothNoise, type Easing } from "./easing";

/**
 * A virtual camera pose relative to the image.
 * `lookX`/`lookY` are the image point at frame centre as a fraction of the
 * cover-fitted image size (0 = centre); `rotation` is in radians.
 */
export interface CameraPose {
  scale: number;
  lookX: number;
  lookY: number;
  rotation: number;
}

export type MotionCategory = "zoom" | "pan" | "orbit" | "shake" | "fx";

export interface MotionPreset {
  id: string;
  label: string;
  description: string;
  category: MotionCategory;
  easing: Easing;
  /** `p` is eased progress (0..1), `t` is elapsed seconds, `k` is intensity. */
  pose(p: number, t: number, k: number): CameraPose;
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const pose = (scale = 1, lookX = 0, lookY = 0, rotation = 0): CameraPose => ({ scale, lookX, lookY, rotation });
const PAN = 0.09;

export const MOTION_PRESETS = [
  { id: "static", label: "Static", description: "Locked-off tripod shot.", category: "fx", easing: easings.linear, pose: () => pose() },
  { id: "dolly-in", label: "Dolly In", description: "Smooth push toward the subject.", category: "zoom", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(lerp(1, 1 + 0.3 * k, p)) },
  { id: "dolly-out", label: "Dolly Out", description: "Pull back to reveal the scene.", category: "zoom", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(lerp(1 + 0.3 * k, 1, p)) },
  { id: "crash-zoom-in", label: "Crash Zoom In", description: "Explosive accelerating zoom.", category: "zoom", easing: easings.easeInExpo, pose: (p, _t, k) => pose(lerp(1, 1 + 1.1 * k, p)) },
  { id: "crash-zoom-out", label: "Crash Zoom Out", description: "Snap back from extreme close-up.", category: "zoom", easing: easings.easeOutExpo, pose: (p, _t, k) => pose(lerp(1 + 1.1 * k, 1, p)) },
  { id: "pan-left", label: "Pan Left", description: "Camera sweeps to the left.", category: "pan", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1, lerp(PAN * k, -PAN * k, p)) },
  { id: "pan-right", label: "Pan Right", description: "Camera sweeps to the right.", category: "pan", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1, lerp(-PAN * k, PAN * k, p)) },
  { id: "tilt-up", label: "Tilt Up", description: "Camera tilts up to the sky.", category: "pan", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1, 0, lerp(PAN * k, -PAN * k, p)) },
  { id: "tilt-down", label: "Tilt Down", description: "Camera tilts down to the ground.", category: "pan", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1, 0, lerp(-PAN * k, PAN * k, p)) },
  { id: "crane-up", label: "Crane Up", description: "Rising crane with a gentle push.", category: "pan", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(lerp(1, 1 + 0.12 * k, p), 0, lerp(PAN * k, -PAN * k, p)) },
  { id: "orbit-left", label: "Orbit Left", description: "Arc around the subject to the left.", category: "orbit", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1.15, lerp(PAN * k, -PAN * k, p), 0, lerp(-0.05 * k, 0.05 * k, p)) },
  { id: "orbit-right", label: "Orbit Right", description: "Arc around the subject to the right.", category: "orbit", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1.15, lerp(-PAN * k, PAN * k, p), 0, lerp(0.05 * k, -0.05 * k, p)) },
  { id: "spiral-in", label: "Spiral In", description: "Rotating push into the frame.", category: "orbit", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(lerp(1, 1 + 0.4 * k, p), 0, 0, lerp(0, 0.3 * k, p)) },
  { id: "dutch-roll", label: "Dutch Roll", description: "Uneasy roll into a canted angle.", category: "orbit", easing: easings.easeInOutCubic, pose: (p, _t, k) => pose(1.05, 0, 0, lerp(0, 0.14 * k, p)) },
  { id: "ken-burns", label: "Ken Burns", description: "Documentary zoom with a slow drift.", category: "zoom", easing: easings.linear, pose: (p, _t, k) => pose(lerp(1, 1 + 0.22 * k, p), lerp(0, 0.05 * k, p), lerp(0, -0.03 * k, p)) },
  { id: "handheld", label: "Handheld", description: "Organic documentary camera sway.", category: "shake", easing: easings.linear, pose: (p, t, k) => pose(lerp(1.06, 1.1, p), 0.008 * k * smoothNoise(t, 1), 0.008 * k * smoothNoise(t, 2), 0.006 * k * smoothNoise(t, 3)) },
  { id: "earthquake", label: "Earthquake", description: "Violent high-frequency shake.", category: "shake", easing: easings.linear, pose: (_p, t, k) => pose(1.12, 0.02 * k * smoothNoise(t * 9, 4), 0.02 * k * smoothNoise(t * 11, 5), 0.015 * k * smoothNoise(t * 7, 6)) },
  { id: "heartbeat", label: "Heartbeat", description: "Pulsing zoom on every beat.", category: "fx", easing: easings.linear, pose: (_p, t, k) => pose(1 + 0.07 * k * Math.abs(Math.sin(t * Math.PI * 1.2)) ** 8) },
] as const satisfies readonly MotionPreset[];

export type MotionPresetId = (typeof MOTION_PRESETS)[number]["id"];

export function getMotionPreset(id: string): MotionPreset {
  const preset = MOTION_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown motion preset: ${id}`);
  return preset;
}

/** Evaluates a preset at `elapsed` seconds into a shot lasting `duration` seconds. */
export function evaluatePreset(preset: MotionPreset, elapsed: number, duration: number, intensity = 1): CameraPose {
  const progress = duration > 0 ? elapsed / duration : 1;
  return preset.pose(preset.easing(progress), elapsed, intensity);
}
