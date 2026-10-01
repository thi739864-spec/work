"use client";

import { createContext, useContext } from "react";
import type { GenerationParams } from "@/lib/gallery/store";

/** Cross-tool hand-offs, e.g. "animate this image" from the gallery. */
export interface StudioActions {
  animate: (assetId: string) => void;
  replace: (assetId: string) => void;
  remix: (params: GenerationParams) => void;
}

export const StudioActionsContext = createContext<StudioActions | null>(null);

export function useStudioActions(): StudioActions {
  const actions = useContext(StudioActionsContext);
  if (!actions) throw new Error("useStudioActions must be used inside <Studio>.");
  return actions;
}
