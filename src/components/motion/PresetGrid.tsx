"use client";

import { MOTION_PRESETS, type MotionCategory } from "@/lib/motion/presets";

const CATEGORY_ICON: Record<MotionCategory, string> = { zoom: "🔍", pan: "↔️", orbit: "🌀", shake: "📳", fx: "⚡" };

interface PresetGridProps {
  value: string;
  onChange: (presetId: string) => void;
  disabled?: boolean;
}

export function PresetGrid({ value, onChange, disabled }: PresetGridProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Camera motion</legend>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {MOTION_PRESETS.map((preset) => {
          const selected = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={selected}
              title={preset.description}
              onClick={() => onChange(preset.id)}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${
                selected
                  ? "border-violet-500 bg-violet-600 text-white shadow"
                  : "border-zinc-300 hover:border-violet-400 dark:border-zinc-700 dark:hover:border-violet-500"
              }`}
            >
              <span aria-hidden="true">{CATEGORY_ICON[preset.category]}</span>
              {preset.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
