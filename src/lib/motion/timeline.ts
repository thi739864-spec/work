export interface TimelineScene {
  durationSec: number;
}

export interface TimelineLayer {
  index: number;
  /** Seconds elapsed inside this scene. */
  localTime: number;
  /** Opacity for this layer when drawn in ascending index order. */
  alpha: number;
}

/** Crossfades can never exceed half of the shortest scene. */
export function effectiveTransition(scenes: readonly TimelineScene[], transitionSec: number): number {
  if (scenes.length < 2) return 0;
  const shortest = Math.min(...scenes.map((s) => s.durationSec));
  return Math.max(0, Math.min(transitionSec, shortest / 2));
}

export function sceneStarts(scenes: readonly TimelineScene[], transitionSec: number): number[] {
  const overlap = effectiveTransition(scenes, transitionSec);
  const starts: number[] = [];
  let cursor = 0;
  for (const scene of scenes) {
    starts.push(cursor);
    cursor += scene.durationSec - overlap;
  }
  return starts;
}

export function timelineDuration(scenes: readonly TimelineScene[], transitionSec: number): number {
  if (scenes.length === 0) return 0;
  const overlap = effectiveTransition(scenes, transitionSec);
  return scenes.reduce((sum, s) => sum + s.durationSec, 0) - overlap * (scenes.length - 1);
}

/** Returns the scenes visible at time `t` with crossfade opacities. */
export function layersAt(scenes: readonly TimelineScene[], transitionSec: number, t: number): TimelineLayer[] {
  if (scenes.length === 0) return [];
  const overlap = effectiveTransition(scenes, transitionSec);
  const total = timelineDuration(scenes, transitionSec);
  const time = Math.min(Math.max(t, 0), total);
  const starts = sceneStarts(scenes, transitionSec);
  const layers: TimelineLayer[] = [];

  scenes.forEach((scene, index) => {
    const start = starts[index];
    const end = start + scene.durationSec;
    const isLast = index === scenes.length - 1;
    if (time < start || time > end || (!isLast && time === end)) return;
    const fade = index > 0 && overlap > 0 ? Math.min(1, (time - start) / overlap) : 1;
    layers.push({ index, localTime: time - start, alpha: fade });
  });

  return layers;
}
