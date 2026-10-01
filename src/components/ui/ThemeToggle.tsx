"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => true);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage may be blocked (private mode); the toggle still works for this session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-10 place-items-center rounded-xl border border-zinc-300 text-lg transition hover:bg-zinc-200/70 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
