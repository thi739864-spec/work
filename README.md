# GENJUTSU ∞ Infinite Era

A free, open AI studio for images and video. No subscriptions, no credits, no API keys required.

| Tool | What it does | Runs on |
| --- | --- | --- |
| ✨ **Create** | Text to image with 12 style presets, 6 aspect ratios, batch of up to 4, seed lock for repeatable results, and an AI prompt boost | Free open models (Pollinations.ai, optional Hugging Face) |
| 🎥 **Animate** | Image to video with 17 cinematic camera moves (dolly, crash zoom, pan, tilt, crane, orbit, spiral, dutch roll, Ken Burns, handheld, earthquake, heartbeat), adjustable intensity and length, live preview, MP4/WebM export | Your browser |
| 🎬 **Story** | Multi-scene films: write a prompt per scene, auto-generate keyframes, give each scene its own camera move, join them with crossfades and export one video | Your browser + free models |
| 🪄 **Replace** | One-click background removal, then swap in an AI-generated scene, a photo, a gradient or a color, with blur and drop shadow | Your browser (photos never leave your device) |
| 🗂️ **Gallery** | Everything you make is saved locally (IndexedDB), ready to download, remix, animate or edit | Your browser |

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

That's it. The default models need no account.

### Optional upgrades (still free)

Copy `.env.example` to `.env.local` and add any of these:

- `POLLINATIONS_TOKEN`: a free token from auth.pollinations.ai that lifts the anonymous rate limit of about 1 image per 15 seconds.
- `HF_TOKEN`: a free Hugging Face token that unlocks the FLUX.1 schnell model (free monthly credits apply).

### Deploy for free

Push the repo to GitHub and import it on Vercel's Hobby plan. Add the optional env vars there if you use them.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit and component tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## Honest limits

- Free image models are slower and lower-fidelity than paid ones, and the anonymous tier is rate limited. The app waits out cooldowns automatically.
- Videos are cinematic camera moves and multi-scene edits built from your images. It does not do generative video, where the subject itself moves. That still needs paid GPU services.
- Video renders in real time, so keep the tab visible while rendering.
- Face swapping of real people is intentionally not included.
