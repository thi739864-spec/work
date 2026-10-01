"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs cannot be optimised by next/image */
import { useStudioActions } from "@/components/studio/StudioActions";
import { downloadBlob, extensionForBlob, slugify } from "@/lib/client/download";
import type { GalleryItem } from "./GalleryProvider";

interface AssetCardProps {
  item: GalleryItem;
  onDelete?: (id: string) => void;
}

const actionClass =
  "rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white";

export function AssetCard({ item, onDelete }: AssetCardProps) {
  const actions = useStudioActions();
  const download = () => downloadBlob(item.blob, `${slugify(item.title)}.${extensionForBlob(item.blob)}`);

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      {item.kind === "video" ? (
        <video src={item.url} className="aspect-video w-full object-cover" controls playsInline loop muted aria-label={item.title} />
      ) : (
        <img src={item.url} alt={item.title} loading="lazy" className="w-full object-cover" />
      )}
      <figcaption className="line-clamp-2 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400" title={item.title}>
        {item.kind === "video" ? "🎬 " : ""}
        {item.title}
        {item.params && <span className="ml-1 font-mono opacity-60">· seed {item.params.seed}</span>}
      </figcaption>
      <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button type="button" className={actionClass} onClick={download} aria-label={`Download ${item.title}`}>
          ⬇ Save
        </button>
        {item.kind === "image" && (
          <>
            <button type="button" className={actionClass} onClick={() => actions.animate(item.id)}>
              🎥 Animate
            </button>
            <button type="button" className={actionClass} onClick={() => actions.replace(item.id)}>
              🪄 Replace
            </button>
          </>
        )}
        {item.params && (
          <button type="button" className={actionClass} onClick={() => actions.remix(item.params!)}>
            🔁 Remix
          </button>
        )}
        {onDelete && (
          <button type="button" className={`${actionClass} hover:bg-red-600`} onClick={() => onDelete(item.id)} aria-label={`Delete ${item.title}`}>
            🗑
          </button>
        )}
      </div>
    </figure>
  );
}
