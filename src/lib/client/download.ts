/** Triggers a browser download for a blob without leaking the object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(text: string, fallback = "genjutsu"): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

export function extensionForBlob(blob: Blob): string {
  const subtype = blob.type.split("/")[1]?.split(";")[0];
  if (subtype === "jpeg") return "jpg";
  return subtype || "bin";
}
