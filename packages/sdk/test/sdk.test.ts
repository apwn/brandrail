import { afterEach, describe, expect, it, vi } from "vitest";
import { acme } from "@brandrail/spec";
import { Brandrail, BrandrailError } from "../src/index.js";

afterEach(() => vi.restoreAllMocks());

describe("Brandrail SDK transport", () => {
  it("sends scoped credentials and serializes lifecycle requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ specs: [{ name: "acme", version: 1 }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    const api = new Brandrail({ apiUrl: "https://api.example.test/", apiKey: "brk_test" });

    await expect(api.listSpecs()).resolves.toEqual([{ name: "acme", version: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/v0/specs", expect.objectContaining({
      headers: expect.objectContaining({ "x-api-key": "brk_test", "content-type": "application/json" }),
    }));
  });

  it("URL-encodes user-controlled resource identifiers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ spec: acme }), { status: 200 }));
    const api = new Brandrail({ apiUrl: "https://api.example.test" });

    await api.getSpec("Acme / Launch", 2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.test/v0/specs/Acme%20%2F%20Launch?version=2");
  });

  it("preserves structured render violations as BrandrailError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      error: "render blocked",
      violations: [{ code: "contrast", message: "insufficient contrast", path: "identity.colors" }],
    }), { status: 422, statusText: "Unprocessable Entity" }));
    const api = new Brandrail({ apiUrl: "https://api.example.test" });

    const error = await api.render("acme", "Launch").catch((cause) => cause);
    expect(error).toBeInstanceOf(BrandrailError);
    expect(error).toMatchObject({ status: 422, message: "render blocked", isSpecViolation: true });
  });
});
