import { listAvailableModels } from "@/lib/providers";
import { handleGenerateImage } from "@/lib/server/generate-image";

export const maxDuration = 60;
// Model availability depends on runtime env vars, so never prerender GET at build time.
export const dynamic = "force-dynamic";

function providerEnv() {
  return { HF_TOKEN: process.env.HF_TOKEN, POLLINATIONS_TOKEN: process.env.POLLINATIONS_TOKEN };
}

/** Lists models and whether each one is usable with the current server configuration. */
export async function GET() {
  return Response.json({ models: listAvailableModels(providerEnv()) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  return handleGenerateImage(request, providerEnv());
}
