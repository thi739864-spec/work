export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
