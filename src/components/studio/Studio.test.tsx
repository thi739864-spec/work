// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Studio } from "./Studio";

const MODELS = {
  models: [
    { id: "flux", label: "Flux (free)", description: "", available: true },
    { id: "hf-flux-schnell", label: "FLUX.1 schnell (Hugging Face)", description: "", available: false },
  ],
};

function mockApi(onGenerate: () => Response | Promise<Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
    if (!init?.method || init.method === "GET") return Response.json(MODELS);
    return onGenerate();
  });
}

beforeEach(() => {
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:mock-${++n}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => cleanup());

describe("Studio", () => {
  it("generates an image and offers follow-up actions", async () => {
    const user = userEvent.setup();
    const fetchSpy = mockApi(
      () => new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png", "x-seed": "99", "x-model": "flux", "x-width": "1280", "x-height": "720" } }),
    );
    render(<Studio />);

    const generate = screen.getByRole("button", { name: "Generate" });
    expect(generate).toBeDisabled();

    await user.type(screen.getByLabelText("Prompt"), "a neon samurai");
    await user.click(generate);

    const card = await screen.findByRole("img", { name: "a neon samurai" });
    const figure = card.closest("figure")!;
    expect(within(figure).getByText(/seed 99/)).toBeInTheDocument();
    expect(within(figure).getByRole("button", { name: /Animate/ })).toBeInTheDocument();

    const body = JSON.parse((fetchSpy.mock.calls.find(([, init]) => init?.method === "POST")![1] as RequestInit).body as string);
    expect(body).toMatchObject({ prompt: "a neon samurai", style: "cinematic", aspect: "16:9", model: "flux" });
  });

  it("shows the server's error message when generation is rejected", async () => {
    const user = userEvent.setup();
    mockApi(() => Response.json({ error: { code: "upstream_rejected", message: "Pollinations rejected the request (400)." } }, { status: 422 }));
    render(<Studio />);

    await user.type(screen.getByLabelText("Prompt"), "something");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Pollinations rejected the request (400).");
    expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
  });

  it("reports an unreachable server instead of failing silently", async () => {
    const user = userEvent.setup();
    mockApi(() => Promise.reject(new TypeError("Failed to fetch")));
    render(<Studio />);

    await user.type(screen.getByLabelText("Prompt"), "offline test");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not reach the studio server/);
  });

  it("disables models that need server setup", async () => {
    mockApi(() => new Response(null, { status: 500 }));
    render(<Studio />);
    const option = await screen.findByRole("option", { name: /needs setup/ });
    expect(option).toBeDisabled();
  });

  it("supports keyboard navigation between tools", async () => {
    const user = userEvent.setup();
    mockApi(() => new Response(null, { status: 500 }));
    render(<Studio />);

    const createTab = screen.getByRole("tab", { name: /Create/ });
    createTab.focus();
    await user.keyboard("{ArrowRight}");

    const animateTab = screen.getByRole("tab", { name: /Animate/ });
    expect(animateTab).toHaveAttribute("aria-selected", "true");
    expect(animateTab).toHaveFocus();
    expect(screen.getByText("Pick an image to bring it to life")).toBeVisible();

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Gallery/ })).toHaveAttribute("aria-selected", "true");
  });
});
