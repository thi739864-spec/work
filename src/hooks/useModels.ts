"use client";

import { useEffect, useState } from "react";
import { fetchModels, type ModelOption } from "@/lib/client/generate-image";
import { MODELS } from "@/lib/config";

const FALLBACK: ModelOption[] = MODELS.map((m) => ({
  id: m.id,
  label: m.label,
  description: m.description,
  available: !("requiresEnv" in m),
}));

/** Loads which models the server can serve, assuming only free models if the check fails. */
export function useModels(): ModelOption[] {
  const [models, setModels] = useState<ModelOption[]>(FALLBACK);

  useEffect(() => {
    const controller = new AbortController();
    fetchModels(controller.signal)
      .then(setModels)
      .catch((err) => {
        if (!controller.signal.aborted) console.warn("[models] using defaults", err);
      });
    return () => controller.abort();
  }, []);

  return models;
}
