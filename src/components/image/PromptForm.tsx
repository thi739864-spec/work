"use client";

import { useId, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass, Label, SelectField } from "@/components/ui/Field";
import type { GenerationSettings } from "@/hooks/useImageGeneration";
import type { ModelOption } from "@/lib/client/generate-image";
import { ASPECT_RATIOS, PROMPT_MAX_LENGTH, type AspectRatio, type ModelId } from "@/lib/config";
import { StylePicker } from "./StylePicker";

const SURPRISE_PROMPTS = [
  "a lone samurai on a neon-lit rooftop in the rain, looking over a futuristic Tokyo",
  "an ancient library inside a hollow giant tree, glowing fireflies, morning mist",
  "a chrome astronaut surfing a wave of liquid gold on an alien ocean",
  "a cozy ramen stall at midnight with steam rising, warm lanterns, snowfall",
  "a colossal whale flying through clouds above a medieval city at sunset",
];

interface PromptFormProps {
  settings: GenerationSettings;
  models: ModelOption[];
  busy: boolean;
  onChange: (patch: Partial<GenerationSettings>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PromptForm({ settings, models, busy, onChange, onSubmit, onCancel }: PromptFormProps) {
  const promptId = useId();
  const seedId = useId();
  const canSubmit = settings.prompt.trim().length > 0 && !busy;

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (canSubmit) onSubmit();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
  };
  const surprise = () => onChange({ prompt: SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)] });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-label="Image generation settings">
      <div>
        <Label htmlFor={promptId} hint={`${settings.prompt.length}/${PROMPT_MAX_LENGTH}`}>
          Prompt
        </Label>
        <textarea
          id={promptId}
          rows={5}
          maxLength={PROMPT_MAX_LENGTH}
          value={settings.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          onKeyDown={onKeyDown}
          placeholder="Describe a scene, character or world…"
          className={`${inputClass} resize-y`}
        />
        <button type="button" onClick={surprise} className="mt-1.5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400">
          🎲 Surprise me
        </button>
      </div>

      <StylePicker value={settings.style} onChange={(style) => onChange({ style })} disabled={busy} />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Aspect"
          value={settings.aspect}
          onChange={(e) => onChange({ aspect: e.target.value as AspectRatio })}
          options={Object.entries(ASPECT_RATIOS).map(([id, a]) => ({ value: id, label: `${id} · ${a.label}` }))}
        />
        <SelectField
          label="Images"
          value={String(settings.count)}
          onChange={(e) => onChange({ count: Number(e.target.value) })}
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n} image${n > 1 ? "s" : ""}` }))}
        />
        <SelectField
          className="col-span-2"
          label="Model"
          value={settings.model}
          onChange={(e) => onChange({ model: e.target.value as ModelId })}
          options={models.map((m) => ({ value: m.id, label: m.available ? m.label : `${m.label} (needs setup)`, disabled: !m.available }))}
        />
        <div>
          <Label htmlFor={seedId} hint="blank = random">
            Seed
          </Label>
          <input
            id={seedId}
            type="number"
            inputMode="numeric"
            min={0}
            value={settings.seed ?? ""}
            onChange={(e) => onChange({ seed: e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))) })}
            className={inputClass}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={settings.enhance} onChange={(e) => onChange({ enhance: e.target.checked })} className="size-4 accent-violet-600" />
          AI prompt boost
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={!canSubmit} loading={busy}>
          {busy ? "Generating…" : "Generate"}
        </Button>
        {busy && (
          <Button size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-zinc-500">Tip: Ctrl/⌘ + Enter to generate</p>
    </form>
  );
}
