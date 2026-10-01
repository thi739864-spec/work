export type Easing = (p: number) => number;

const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

export const easings = {
  linear: (p) => clamp01(p),
  easeInOutCubic: (p) => {
    const x = clamp01(p);
    return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  },
  easeOutCubic: (p) => 1 - (1 - clamp01(p)) ** 3,
  easeInExpo: (p) => {
    const x = clamp01(p);
    return x === 0 ? 0 : 2 ** (10 * x - 10);
  },
  easeOutExpo: (p) => {
    const x = clamp01(p);
    return x === 1 ? 1 : 1 - 2 ** (-10 * x);
  },
} satisfies Record<string, Easing>;

/** Deterministic smooth pseudo-noise in [-1, 1] built from incommensurate sines. */
export function smoothNoise(t: number, seed = 0): number {
  const s = seed * 12.9898;
  return (
    0.5 * Math.sin(t * 1.7 + s) +
    0.3 * Math.sin(t * 3.1 + s * 1.3 + 1.1) +
    0.2 * Math.sin(t * 5.3 + s * 0.7 + 2.3)
  );
}
