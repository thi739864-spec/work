"use client";

import { STYLE_PRESETS, type StyleId } from "@/lib/config";

interface StylePickerProps {
  value: StyleId;
  onChange: (style: StyleId) => void;
  disabled?: boolean;
}

export function StylePicker({ value, onChange, disabled }: StylePickerProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Style</legend>
      <div className="flex flex-wrap gap-1.5">
        {STYLE_PRESETS.map((style) => {
          const selected = style.id === value;
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(style.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selected
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-zinc-300 hover:border-violet-400 dark:border-zinc-700 dark:hover:border-violet-500"
              }`}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
