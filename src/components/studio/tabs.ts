export const STUDIO_TABS = [
  { id: "image", label: "Create", icon: "✨", description: "Text to image" },
  { id: "motion", label: "Animate", icon: "🎥", description: "Image to video" },
  { id: "story", label: "Story", icon: "🎬", description: "Multi-scene video" },
  { id: "replace", label: "Replace", icon: "🪄", description: "Swap backgrounds" },
  { id: "gallery", label: "Gallery", icon: "🗂️", description: "Your creations" },
] as const;

export type StudioTabId = (typeof STUDIO_TABS)[number]["id"];

export const tabId = (id: StudioTabId) => `tab-${id}`;
export const panelId = (id: StudioTabId) => `panel-${id}`;
