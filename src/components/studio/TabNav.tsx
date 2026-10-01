"use client";

import { useRef, type KeyboardEvent } from "react";
import { panelId, STUDIO_TABS, tabId, type StudioTabId } from "./tabs";

interface TabNavProps {
  active: StudioTabId;
  onChange: (tab: StudioTabId) => void;
}

/** WAI-ARIA tabs with roving focus (arrow keys, Home, End). */
export function TabNav({ active, onChange }: TabNavProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = STUDIO_TABS.findIndex((t) => t.id === active);
    const last = STUDIO_TABS.length - 1;
    const next =
      event.key === "ArrowRight" ? (index + 1) % STUDIO_TABS.length
      : event.key === "ArrowLeft" ? (index - 1 + STUDIO_TABS.length) % STUDIO_TABS.length
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    onChange(STUDIO_TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Studio tools"
      onKeyDown={onKeyDown}
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]"
    >
      {STUDIO_TABS.map((tab, i) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={tabId(tab.id)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId(tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
              selected
                ? "bg-zinc-900 text-white shadow dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="hidden text-xs font-normal opacity-60 lg:inline">· {tab.description}</span>
          </button>
        );
      })}
    </div>
  );
}
