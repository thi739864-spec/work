"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { GalleryItem } from "@/components/gallery/GalleryProvider";
import { downloadBlob, slugify } from "@/lib/client/download";
import { fileExtensionFor } from "@/lib/render/recorder";

interface RenderStatusProps {
  progress: number | null;
  error: string | null;
  result: GalleryItem | null;
  onCancel: () => void;
  onDismissError: () => void;
}

/** Shared progress / error / download UI for video renders. */
export function RenderStatus({ progress, error, result, onCancel, onDismissError }: RenderStatusProps) {
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {progress !== null && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <ProgressBar value={progress} label="Rendering video. Keep this tab visible." />
          </div>
          <Button size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
      {error && (
        <Alert tone="error" onDismiss={onDismissError}>
          {error}
        </Alert>
      )}
      {result && progress === null && (
        <Alert tone="info">
          <span className="flex flex-wrap items-center gap-2">
            Video saved to your gallery.
            <Button size="sm" variant="primary" onClick={() => downloadBlob(result.blob, `${slugify(result.title)}.${fileExtensionFor(result.blob.type)}`)}>
              ⬇ Download {fileExtensionFor(result.blob.type).toUpperCase()}
            </Button>
          </span>
        </Alert>
      )}
    </div>
  );
}
