@AGENTS.md

# Genjutsu: Infinite Era

Free AI image and video studio. Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4, Vitest.

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run build`: production build (must pass before committing)
- `npm run lint`: ESLint (`next lint` no longer exists in Next 16)
- `npm run typecheck`: `tsc --noEmit`
- `npm test`: Vitest (node env by default; component tests opt into jsdom with `// @vitest-environment jsdom`)

## Architecture

- `src/lib/`: framework-agnostic logic. Keep it pure and unit-tested.
  - `config.ts`: models, styles, aspect ratios and limits (single source of truth).
  - `validation.ts`: zod schema for generation requests.
  - `providers/`: one `ImageProvider` per upstream service (Pollinations is free and keyless; Hugging Face needs `HF_TOKEN`). Add new providers here and register them in `providers/index.ts` + `MODELS`.
  - `server/generate-image.ts`: the route logic. It maps every failure to a `GenerationError` with a stable code and HTTP status.
  - `motion/`: camera presets, coverage-safe transforms (`resolveDrawParams` guarantees no empty borders) and the storyboard timeline.
  - `render/`: canvas drawing and the MediaRecorder video encoder (MP4 preferred, WebM fallback).
  - `replace/`: in-browser background removal (transformers.js, lazy-loaded) and compositing.
  - `gallery/store.ts`: IndexedDB persistence with an in-memory fallback.
- `src/app/api/generate/image/route.ts`: thin wrapper (GET lists models, POST generates). Images are proxied through our origin on purpose: same-origin blobs keep canvases untainted so they can be recorded to video.
- `src/hooks/`: React state machines for each workflow.
- `src/components/`: UI, grouped by tool (`image`, `motion`, `story`, `replace`, `gallery`) plus `ui/` primitives.

## Conventions

- Components stay under ~150 lines; move logic into hooks or `lib/`.
- Every async path reports a human-readable error to the UI (`Alert` with `role="alert"`). No silent failures.
- Accessibility: real labels, `aria-pressed`/`role="radio"` for toggles, WAI-ARIA tabs, `aria-live` for progress.
- Styling: mobile-first Tailwind; always pair light classes with `dark:` variants (class-based dark mode, toggled in `ThemeToggle`).
- No paid APIs by default. Anything needing a key must be optional and degrade to a clear "needs setup" state.
- `@huggingface/transformers` pulls `onnxruntime-node`, whose postinstall downloads binaries. In sandboxes without network, use `npm install --ignore-scripts`; the browser build does not need them.
