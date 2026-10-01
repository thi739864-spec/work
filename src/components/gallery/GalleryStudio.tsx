"use client";

import { useState } from "react";
import { EmptyState, Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { AssetCard } from "./AssetCard";
import { useGallery } from "./GalleryProvider";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

export function GalleryStudio() {
  const { items, ready, removeAsset } = useGallery();
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);

  const onDelete = (id: string) => {
    if (window.confirm("Delete this item from your gallery? This cannot be undone.")) void removeAsset(id);
  };

  return (
    <Panel
      title={`Gallery (${items.length})`}
      actions={
        <div role="group" aria-label="Filter gallery" className="flex gap-1 rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-800">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${filter === f.id ? "bg-white shadow dark:bg-zinc-950" : "opacity-70 hover:opacity-100"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >
      {!ready ? (
        <p className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500" role="status">
          <Spinner /> Loading your gallery…
        </p>
      ) : visible.length === 0 ? (
        <EmptyState icon="🗂️" title={filter === "all" ? "Nothing here yet" : `No ${filter}s yet`}>
          Everything you create is saved here automatically, on this device only.
        </EmptyState>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {visible.map((item) => (
            <AssetCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      )}
    </Panel>
  );
}
