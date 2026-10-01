import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {children}
      </label>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
}

export function SelectField({ label, options, className = "", ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={inputClass} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RangeField({ label, value, min, max, step, format = String, onChange, disabled }: RangeFieldProps) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={format(value)}>
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-600"
      />
    </div>
  );
}
