import type { ReactNode } from "react";

const TONES = {
  error: "border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200",
  info: "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-100",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
} as const;

interface AlertProps {
  tone?: keyof typeof TONES;
  children: ReactNode;
  onDismiss?: () => void;
}

export function Alert({ tone = "info", children, onDismiss }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <div className="min-w-0">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 rounded px-1 opacity-70 hover:opacity-100" aria-label="Dismiss message">
          ✕
        </button>
      )}
    </div>
  );
}
