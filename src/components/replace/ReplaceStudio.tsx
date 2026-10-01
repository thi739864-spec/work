"use client";

import { useState } from "react";
import { AssetPicker } from "@/components/gallery/AssetPicker";
import { useGallery, type GalleryItem } from "@/components/gallery/GalleryProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState, Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { useBackgroundReplace } from "@/hooks/useBackgroundReplace";
import { useLoadedImage } from "@/hooks/useLoadedImage";
import { nearestAspectRatio } from "@/lib/config";
import type { BackgroundSpec } from "@/lib/replace/composite";
import { BackgroundPanel, type BackgroundChoice } from "./BackgroundPanel";
import { BLUR_REFERENCE_WIDTH, ReplacePreview } from "./ReplacePreview";

export function ReplaceStudio({ initialAssetId }: { initialAssetId?: string }) {
  const { items } = useGallery();
  const [sourceId, setSourceId] = useState<string | null>(initialAssetId ?? null);
  const source = items.find((i) => i.id === sourceId && i.kind === "image");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <Panel title="Subject">
        <AssetPicker label="Photo to edit" selectedId={sourceId} onSelect={setSourceId} />
      </Panel>
      {source ? (
        <ReplaceWorkspace key={source.id} source={source} />
      ) : (
        <Panel>
          <EmptyState icon="🪄" title="Swap any background in one click">
            Pick or upload a photo. The cut-out runs privately in your browser, so your photo never leaves your device.
          </EmptyState>
        </Panel>
      )}
    </div>
  );
}

function ReplaceWorkspace({ source }: { source: GalleryItem }) {
  const { items } = useGallery();
  const { cutout, status, saving, error, result, cutOut, save, clearError } = useBackgroundReplace(source);
  const [background, setBackground] = useState<BackgroundChoice>({ type: "gradient", from: "#c026d3", to: "#06b6d4", angle: 135 });
  const [shadow, setShadow] = useState(true);
  const backgroundUrl = background.type === "image" ? items.find((i) => i.id === background.assetId)?.url : undefined;
  const { image: backgroundImage } = useLoadedImage(backgroundUrl);
  const { image: sourceImage } = useLoadedImage(source.url);
  const ratio = sourceImage ? sourceImage.naturalWidth / sourceImage.naturalHeight : 1;

  const toSpec = (): BackgroundSpec | null => {
    if (background.type !== "image") return background;
    if (!backgroundImage || !cutout) return null;
    return { type: "image", image: backgroundImage, blur: (background.blur * cutout.image.naturalWidth) / BLUR_REFERENCE_WIDTH };
  };
  const spec = toSpec();

  return (
    <div className="flex flex-col gap-4">
      <Panel title={cutout ? "New background" : "Step 1 · Cut out the subject"}>
        <div className="flex flex-col gap-4" aria-live="polite">
          {!cutout && (
            <Button variant="primary" size="lg" onClick={cutOut} loading={status !== null}>
              🪄 Remove background
            </Button>
          )}
          {status?.stage === "loading-model" && <ProgressBar value={status.progress} label="Downloading the free AI model (first time only)" />}
          {status?.stage === "processing" && (
            <p className="flex items-center gap-2 text-sm">
              <Spinner /> Finding the subject…
            </p>
          )}
          {error && <Alert tone="error" onDismiss={clearError}>{error}</Alert>}
          {cutout && (
            <>
              <BackgroundPanel value={background} onChange={setBackground} aspect={nearestAspectRatio(cutout.image.naturalWidth, cutout.image.naturalHeight)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="size-4 accent-violet-600" />
                Soft drop shadow
              </label>
              <Button variant="primary" size="lg" onClick={() => spec && save(spec, shadow && background.type !== "transparent")} disabled={!spec} loading={saving}>
                💾 Save to gallery
              </Button>
              {result && <Alert tone="info">Saved! Find it in your gallery, or hit Animate on it to turn it into a video.</Alert>}
            </>
          )}
        </div>
      </Panel>
      <Panel title="Preview">
        <ReplacePreview
          subjectUrl={cutout?.url ?? source.url}
          subjectAlt={source.title}
          aspectRatio={ratio}
          background={cutout ? background : null}
          backgroundUrl={backgroundUrl}
          shadow={shadow && background.type !== "transparent"}
        />
      </Panel>
    </div>
  );
}
