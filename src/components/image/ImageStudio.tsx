"use client";

import { useState } from "react";
import { AssetCard } from "@/components/gallery/AssetCard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useImageGeneration, type GenerationSettings } from "@/hooks/useImageGeneration";
import { useModels } from "@/hooks/useModels";
import type { GenerationParams } from "@/lib/gallery/store";
import { PromptForm } from "./PromptForm";

const DEFAULTS: GenerationSettings = {
  prompt: "",
  style: "cinematic",
  aspect: "16:9",
  model: "flux",
  count: 1,
  seed: null,
  enhance: false,
};

export function ImageStudio({ remix }: { remix?: GenerationParams }) {
  const [settings, setSettings] = useState<GenerationSettings>(() => (remix ? { ...DEFAULTS, ...remix, count: 1 } : DEFAULTS));
  const models = useModels();
  const { generate, cancel, results, progress, error, clearError, busy } = useImageGeneration();
  const update = (patch: Partial<GenerationSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <Panel title="Imagine">
        {remix && (
          <p className="mb-4 rounded-lg bg-violet-100 px-3 py-2 text-xs text-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
            Remixing with seed {remix.seed}. Tweak the prompt to keep the composition and change the details.
          </p>
        )}
        <PromptForm settings={settings} models={models} busy={busy} onChange={update} onSubmit={() => generate(settings)} onCancel={cancel} />
      </Panel>

      <Panel title="Results">
        <div className="flex flex-col gap-4" aria-live="polite">
          {progress && (
            <div className="flex flex-col gap-2">
              <ProgressBar value={progress.done / progress.total} label={`Generated ${progress.done} of ${progress.total}`} />
              {progress.waitingSeconds !== null && (
                <Alert tone="info">Free tier cooldown: retrying in ~{progress.waitingSeconds}s. Hang tight, this is what makes it free.</Alert>
              )}
            </div>
          )}
          {error && (
            <Alert tone="error" onDismiss={clearError}>
              {error}
            </Alert>
          )}
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((item) => (
                <AssetCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            !progress && (
              <EmptyState icon="✨" title="Your next masterpiece appears here">
                Write a prompt, choose a style and hit Generate. Every image is saved to your gallery automatically.
              </EmptyState>
            )
          )}
          {progress && results.length === 0 && (
            <div className="aspect-video w-full animate-pulse rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-400/20" aria-hidden="true" />
          )}
        </div>
      </Panel>
    </div>
  );
}
