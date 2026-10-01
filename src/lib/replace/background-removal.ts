/**
 * In-browser background removal. The model (~25 MB) is downloaded from the
 * Hugging Face hub on first use and cached by the browser, so it is free and
 * the user's photos never leave their device.
 */

type Segmenter = (input: Blob | string) => Promise<{ toBlob(type?: string): Promise<Blob> } | Array<{ toBlob(type?: string): Promise<Blob> }>>;

export type RemovalStatus = { stage: "loading-model"; progress: number } | { stage: "processing" };

let segmenterPromise: Promise<Segmenter> | null = null;

async function loadSegmenter(onStatus?: (status: RemovalStatus) => void): Promise<Segmenter> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  const device = typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "wasm";
  const segmenter = await pipeline("background-removal", "Xenova/modnet", {
    device,
    dtype: "fp32",
    progress_callback: (info: { status: string; progress?: number }) => {
      if (info.status === "progress" && typeof info.progress === "number") {
        onStatus?.({ stage: "loading-model", progress: info.progress / 100 });
      }
    },
  });
  return segmenter as unknown as Segmenter;
}

/** Returns a transparent PNG of the main subject in `image`. */
export async function removeBackground(image: Blob, onStatus?: (status: RemovalStatus) => void): Promise<Blob> {
  segmenterPromise ??= loadSegmenter(onStatus);
  let segmenter: Segmenter;
  try {
    segmenter = await segmenterPromise;
  } catch (error) {
    segmenterPromise = null; // allow a clean retry after network failures
    throw new Error("Could not download the background-removal model. Check your connection and try again.", { cause: error });
  }

  onStatus?.({ stage: "processing" });
  try {
    const output = await segmenter(image);
    const result = Array.isArray(output) ? output[0] : output;
    if (!result) throw new Error("empty result");
    return await result.toBlob("image/png");
  } catch (error) {
    throw new Error("Background removal failed for this image. Try a clearer photo with a distinct subject.", { cause: error });
  }
}
