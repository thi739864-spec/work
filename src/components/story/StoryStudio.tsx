"use client";

import { useMemo } from "react";
import { useGallery } from "@/components/gallery/GalleryProvider";
import { StylePicker } from "@/components/image/StylePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RangeField, SelectField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useLoadedImages } from "@/hooks/useLoadedImages";
import { useModels } from "@/hooks/useModels";
import { MAX_SCENES, useStoryboard } from "@/hooks/useStoryboard";
import { ASPECT_RATIO_IDS, type AspectRatio, type ModelId } from "@/lib/config";
import { SceneCard } from "./SceneCard";
import { StoryPreview, type StoryShot } from "./StoryPreview";

export function StoryStudio({ visible = true }: { visible?: boolean }) {
  const { items } = useGallery();
  const models = useModels();
  const story = useStoryboard();
  const { scenes, settings, setSettings, generating } = story;
  const images = useMemo(() => items.filter((i) => i.kind === "image"), [items]);

  const keyframeUrls = scenes.map((s) => images.find((i) => i.id === s.assetId)?.url).filter((u): u is string => Boolean(u));
  const loaded = useLoadedImages(keyframeUrls);

  const shots = useMemo<StoryShot[]>(
    () =>
      scenes.flatMap((scene) => {
        const url = images.find((i) => i.id === scene.assetId)?.url;
        const image = url ? loaded.get(url) : undefined;
        return image ? [{ image, presetId: scene.presetId, durationSec: scene.durationSec }] : [];
      }),
    [scenes, images, loaded],
  );

  const missing = scenes.filter((s) => !s.assetId);
  const title = scenes.find((s) => s.prompt.trim())?.prompt ?? "Story";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Panel title="Look & feel">
          <div className="flex flex-col gap-4">
            <StylePicker value={settings.style} onChange={(style) => setSettings((s) => ({ ...s, style }))} disabled={generating} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField label="Frame" value={settings.aspect} onChange={(e) => setSettings((s) => ({ ...s, aspect: e.target.value as AspectRatio }))} options={ASPECT_RATIO_IDS.map((id) => ({ value: id, label: id }))} />
              <SelectField label="Model" value={settings.model} onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value as ModelId }))} options={models.map((m) => ({ value: m.id, label: m.label, disabled: !m.available }))} />
              <div className="col-span-2 sm:col-span-1">
                <RangeField label="Crossfade" value={settings.transitionSec} min={0} max={1.5} step={0.1} format={(v) => `${v.toFixed(1)}s`} onChange={(v) => setSettings((s) => ({ ...s, transitionSec: v }))} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title={`Scenes (${scenes.length}/${MAX_SCENES})`}
          actions={
            <Button size="sm" onClick={story.addScene} disabled={generating || scenes.length >= MAX_SCENES}>
              + Scene
            </Button>
          }
        >
          <ol className="flex flex-col gap-3">
            {scenes.map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                total={scenes.length}
                images={images}
                busy={generating}
                onChange={(patch) => story.updateScene(scene.id, patch)}
                onGenerate={() => story.generate([scene])}
                onRemove={() => story.removeScene(scene.id)}
                onMove={(delta) => story.moveScene(scene.id, delta)}
              />
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => story.generate(missing)} disabled={generating || missing.every((s) => !s.prompt.trim())} loading={generating}>
              ✨ Generate missing keyframes
            </Button>
            {generating && <Button onClick={story.cancel}>Stop</Button>}
          </div>
        </Panel>
      </div>

      <Panel title="Screening room" className="xl:sticky xl:top-4 xl:self-start">
        {missing.length > 0 && shots.length > 0 && (
          <div className="mb-4">
            <Alert tone="warning">{missing.length} scene(s) without a keyframe will be skipped.</Alert>
          </div>
        )}
        <StoryPreview shots={shots} aspect={settings.aspect} transitionSec={settings.transitionSec} title={title} disabled={generating} visible={visible} />
      </Panel>
    </div>
  );
}
