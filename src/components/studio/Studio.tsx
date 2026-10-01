"use client";

import { useMemo, useState, type ReactNode } from "react";
import { GalleryProvider, useGallery } from "@/components/gallery/GalleryProvider";
import { GalleryStudio } from "@/components/gallery/GalleryStudio";
import { ImageStudio } from "@/components/image/ImageStudio";
import { MotionStudio } from "@/components/motion/MotionStudio";
import { ReplaceStudio } from "@/components/replace/ReplaceStudio";
import { StoryStudio } from "@/components/story/StoryStudio";
import { Alert } from "@/components/ui/Alert";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { GenerationParams } from "@/lib/gallery/store";
import { StudioActionsContext, type StudioActions } from "./StudioActions";
import { TabNav } from "./TabNav";
import { panelId, STUDIO_TABS, tabId, type StudioTabId } from "./tabs";

interface Handoff {
  motionAssetId?: string;
  replaceAssetId?: string;
  remix?: GenerationParams;
  /** Bumped on every remix so the Create tool remounts with the new settings. */
  remixVersion: number;
}

export function Studio() {
  return (
    <GalleryProvider>
      <StudioShell />
    </GalleryProvider>
  );
}

function StudioShell() {
  const { error, clearError, persistent, ready } = useGallery();
  const [tab, setTab] = useState<StudioTabId>("image");
  const [handoff, setHandoff] = useState<Handoff>({ remixVersion: 0 });

  const actions = useMemo<StudioActions>(
    () => ({
      animate: (id) => {
        setHandoff((h) => ({ ...h, motionAssetId: id }));
        setTab("motion");
      },
      replace: (id) => {
        setHandoff((h) => ({ ...h, replaceAssetId: id }));
        setTab("replace");
      },
      remix: (params) => {
        setHandoff((h) => ({ ...h, remix: params, remixVersion: h.remixVersion + 1 }));
        setTab("image");
      },
    }),
    [],
  );

  const panels: Record<StudioTabId, ReactNode> = {
    image: <ImageStudio key={`image-${handoff.remixVersion}`} remix={handoff.remix} />,
    motion: <MotionStudio key={`motion-${handoff.motionAssetId}`} initialAssetId={handoff.motionAssetId} visible={tab === "motion"} />,
    story: <StoryStudio visible={tab === "story"} />,
    replace: <ReplaceStudio key={`replace-${handoff.replaceAssetId}`} initialAssetId={handoff.replaceAssetId} />,
    gallery: <GalleryStudio />,
  };

  return (
    <StudioActionsContext.Provider value={actions}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:py-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              GENJUTSU <span className="font-light">∞ Infinite Era</span>
            </h1>
            <p className="text-xs text-zinc-500 sm:text-sm">Free AI image &amp; video studio. No subscriptions, no credits.</p>
          </div>
          <ThemeToggle />
        </header>

        <TabNav active={tab} onChange={setTab} />

        {error && (
          <Alert tone="error" onDismiss={clearError}>
            {error}
          </Alert>
        )}
        {ready && !persistent && (
          <Alert tone="warning">Browser storage is unavailable (private mode?), so creations will disappear when you close this tab. Download anything you want to keep.</Alert>
        )}

        <main>
          {STUDIO_TABS.map(({ id }) => (
            <section key={id} id={panelId(id)} role="tabpanel" aria-labelledby={tabId(id)} hidden={tab !== id} tabIndex={0} className="focus:outline-none">
              {panels[id]}
            </section>
          ))}
        </main>

        <footer className="py-6 text-center text-xs text-zinc-500">
          Images by free open models via Pollinations.ai / Hugging Face. Video rendering and background removal run on your device.
        </footer>
      </div>
    </StudioActionsContext.Provider>
  );
}
