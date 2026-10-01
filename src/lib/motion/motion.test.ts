import { describe, expect, it } from "vitest";
import { evaluatePreset, getMotionPreset, MOTION_PRESETS } from "./presets";
import { coverSize, frameCornersInImage, resolveDrawParams } from "./transform";
import { layersAt, timelineDuration } from "./timeline";

const FRAMES = [
  { width: 1280, height: 720 },
  { width: 720, height: 1280 },
  { width: 1024, height: 1024 },
];
const IMAGES = [
  { width: 1024, height: 1024 },
  { width: 1344, height: 576 },
  { width: 720, height: 1280 },
];

describe("camera presets", () => {
  it("never reveal empty borders for any preset, frame, image or intensity", () => {
    for (const preset of MOTION_PRESETS) {
      for (const frame of FRAMES) {
        for (const image of IMAGES) {
          for (const intensity of [0.5, 1, 2]) {
            for (let t = 0; t <= 4; t += 0.25) {
              const params = resolveDrawParams(evaluatePreset(preset, t, 4, intensity), image, frame);
              for (const corner of frameCornersInImage(params, frame)) {
                expect(Math.abs(corner.x)).toBeLessThanOrEqual(params.cover.width / 2 + 1e-6);
                expect(Math.abs(corner.y)).toBeLessThanOrEqual(params.cover.height / 2 + 1e-6);
              }
            }
          }
        }
      }
    }
  });

  it("dolly in ends closer than it starts", () => {
    const preset = getMotionPreset("dolly-in");
    expect(evaluatePreset(preset, 4, 4).scale).toBeGreaterThan(evaluatePreset(preset, 0, 4).scale);
  });

  it("is deterministic for shake presets", () => {
    const preset = getMotionPreset("handheld");
    expect(evaluatePreset(preset, 1.3, 4)).toEqual(evaluatePreset(preset, 1.3, 4));
  });

  it("throws for unknown presets", () => {
    expect(() => getMotionPreset("teleport")).toThrow(/Unknown motion preset/);
  });

  it("cover-fits images and rejects empty sources", () => {
    expect(coverSize({ width: 100, height: 50 }, { width: 100, height: 100 })).toEqual({ width: 200, height: 100 });
    expect(() => coverSize({ width: 0, height: 10 }, { width: 10, height: 10 })).toThrow();
  });
});

describe("storyboard timeline", () => {
  const scenes = [{ durationSec: 3 }, { durationSec: 3 }, { durationSec: 3 }];

  it("subtracts crossfade overlaps from the total duration", () => {
    expect(timelineDuration(scenes, 0.5)).toBe(8);
    expect(timelineDuration([], 0.5)).toBe(0);
    expect(timelineDuration([{ durationSec: 2 }], 1)).toBe(2);
  });

  it("crossfades between adjacent scenes", () => {
    const layers = layersAt(scenes, 0.5, 2.75);
    expect(layers.map((l) => l.index)).toEqual([0, 1]);
    expect(layers[1].alpha).toBeCloseTo(0.5);
  });

  it("shows only one scene outside transitions and clamps out-of-range times", () => {
    expect(layersAt(scenes, 0.5, 1)).toEqual([{ index: 0, localTime: 1, alpha: 1 }]);
    expect(layersAt(scenes, 0.5, 99).map((l) => l.index)).toEqual([2]);
    expect(layersAt(scenes, 0.5, -5).map((l) => l.index)).toEqual([0]);
    expect(layersAt([], 0.5, 1)).toEqual([]);
  });

  it("caps transitions at half the shortest scene", () => {
    expect(timelineDuration([{ durationSec: 1 }, { durationSec: 4 }], 3)).toBe(4.5);
  });
});
