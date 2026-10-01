import type { ReactNode } from "react";

export function Panel({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/60 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{children}</div>}
    </div>
  );
}
