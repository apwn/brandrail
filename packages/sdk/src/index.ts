import type { BrandSpec, DiffEntry, FormatId, LayoutArchetype, Violation } from "@brandrail/spec";

export interface BrandrailOptions {
  /** API base URL. Defaults to $BRANDRAIL_API_URL / $RENDER_API_URL / https://api.brandrail.dev */
  apiUrl?: string;
  /** API key. Defaults to $BRANDRAIL_API_KEY. Optional against dev servers. */
  apiKey?: string;
}

export interface CompileResponse {
  spec: BrandSpec;
  confidence: Record<string, number>;
  warnings: string[];
}

export interface RenderAssetRef {
  filename: string;
  format: FormatId;
  slide: number;
  width: number;
  height: number;
  archetype: LayoutArchetype;
  /** relative to the API base */
  url: string;
}

export interface RenderResponse {
  id: string;
  specVersion: number;
  assets: RenderAssetRef[];
  manifest: {
    brand: string;
    brief: string;
    formats: FormatId[];
    archetype: LayoutArchetype;
    warnings: string[];
  };
}

export class BrandrailError extends Error {
  readonly status: number;
  readonly violations: Violation[];

  constructor(status: number, message: string, violations: Violation[] = []) {
    super(message);
    this.name = "BrandrailError";
    this.status = status;
    this.violations = violations;
  }

  get isSpecViolation(): boolean {
    return this.violations.length > 0;
  }
}

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

export class Brandrail {
  readonly apiUrl: string;
  private readonly apiKey?: string;

  constructor(opts: BrandrailOptions = {}) {
    this.apiUrl = (
      opts.apiUrl ??
      env("BRANDRAIL_API_URL") ??
      env("RENDER_API_URL") ??
      "https://api.brandrail.dev"
    ).replace(/\/$/, "");
    this.apiKey = opts.apiKey ?? env("BRANDRAIL_API_KEY");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
        ...(init.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new BrandrailError(
        res.status,
        String(body.error ?? `${res.status} ${res.statusText}`),
        (body.violations as Violation[]) ?? [],
      );
    }
    return body as T;
  }

  /** URL → compiled BrandSpec + per-field confidence. */
  compile(url: string): Promise<CompileResponse> {
    return this.request("/v0/compile", { method: "POST", body: JSON.stringify({ url }) });
  }

  async getSpec(name: string, version?: number): Promise<BrandSpec> {
    const q = version ? `?version=${version}` : "";
    const { spec } = await this.request<{ spec: BrandSpec }>(`/v0/specs/${name}${q}`);
    return spec;
  }

  async listSpecs(): Promise<Array<{ name: string; version: number }>> {
    const { specs } = await this.request<{ specs: Array<{ name: string; version: number }> }>(
      "/v0/specs",
    );
    return specs;
  }

  async createSpec(spec: unknown): Promise<BrandSpec> {
    const res = await this.request<{ spec: BrandSpec }>("/v0/specs", {
      method: "POST",
      body: JSON.stringify({ spec }),
    });
    return res.spec;
  }

  async patchSpec(name: string, patch: object): Promise<{ spec: BrandSpec; changes: DiffEntry[] }> {
    return this.request(`/v0/specs/${name}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async forkSpec(parent: string, name: string, overrides: object = {}): Promise<BrandSpec> {
    const res = await this.request<{ spec: BrandSpec }>(`/v0/specs/${parent}/fork`, {
      method: "POST",
      body: JSON.stringify({ name, overrides }),
    });
    return res.spec;
  }

  diffSpec(name: string, from: number, to: number): Promise<{ entries: DiffEntry[]; text: string }> {
    return this.request(`/v0/specs/${name}/diff?from=${from}&to=${to}`);
  }

  /** brief → finished, brand-locked assets. Pass `copy` to render exact copy (studio path). */
  render(
    brand: string,
    brief: string,
    opts: {
      formats?: FormatId[];
      archetype?: LayoutArchetype;
      version?: number;
      copy?: Record<string, Array<{ kicker?: string; hook: string; body?: string; cta?: string; badge?: string; rating?: string }>>;
    } = {},
  ): Promise<RenderResponse> {
    return this.request("/v0/render", {
      method: "POST",
      body: JSON.stringify({ brand, brief, ...opts }),
    });
  }

  /** Download a rendered asset by its RenderAssetRef url. */
  async downloadAsset(assetUrl: string): Promise<Uint8Array> {
    const res = await fetch(`${this.apiUrl}${assetUrl}`, {
      headers: this.apiKey ? { "x-api-key": this.apiKey } : {},
    });
    if (!res.ok) throw new BrandrailError(res.status, `asset download failed (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }
}

export type { BrandSpec, DiffEntry, FormatId, LayoutArchetype, Violation } from "@brandrail/spec";
