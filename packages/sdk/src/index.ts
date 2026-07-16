import type { ArchetypeInfo, BrandSpec, CustomTemplateFamily, DiffEntry, FormatId, LayoutArchetype, TemplateRecipe, TemplateRef, TemplateSlotName, Violation } from "@brandrail/spec";

export interface TemplatePreflightIssue { severity: "error" | "warning"; code: string; path: string; message: string }

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
  /** Optional short-lived public delivery URL returned by hosted engines. */
  downloadUrl?: string | null;
}

export interface ArtDirectionCandidate {
  archetype: LayoutArchetype;
  score: number;
  semanticScore?: number;
  visualScore?: number;
  valid?: boolean;
  rejectedBy?: string[];
  reasons: string[];
}

export interface ArtDirectionDecision {
  selected: LayoutArchetype;
  intent: string;
  candidates: ArtDirectionCandidate[];
  rationale: string;
}

export interface RenderResponse {
  id: string;
  specVersion: number;
  assets: RenderAssetRef[];
  manifest: {
    brand: string;
    brief: string;
    recipe?: string;
    templateRef?: TemplateRef;
    formats: FormatId[];
    archetype: LayoutArchetype;
    plan?: Partial<Record<FormatId, LayoutArchetype>>;
    artDirection?: Partial<Record<FormatId, ArtDirectionDecision>>;
    mediaSelections?: Partial<Record<FormatId, { primary?: number; secondary?: number }>>;
    warnings: string[];
  };
}

export interface RenderHistoryEntry {
  id: string;
  createdAt: string;
  manifest: RenderResponse["manifest"] & { assets: RenderAssetRef[] };
}

export interface TemplateModification {
  format: FormatId;
  slide?: number;
  name: TemplateSlotName;
  text: string;
}

export interface TemplateMediaSelection {
  format: FormatId;
  name: "primary" | "secondary";
  /** Zero-based index in the active BrandSpec imagery.photos library. */
  photoIndex: number;
}

export interface ScheduledPost {
  id: string; runId?: string; channelIds: string[]; text: string; renderId?: string; imageFiles: string[];
  scheduledAt: string; status: "scheduled" | "publishing" | "published" | "failed" | "cancelled";
  metrics?: { impressions?: number; engagements?: number; fetchedAt?: string };
}
export interface Channel { id: string; platform: string; handle: string; service?: string; connectedAt: string }

export interface Campaign {
  id: string; name: string; objective: string; status: "draft" | "active" | "complete";
  startAt?: string; endAt?: string; brandIds: string[]; batchIds: string[]; postIds: string[];
  createdAt: string; updatedAt: string;
  progress: { batches: number; assets: number; approved: number; posts: number; scheduled: number; published: number; impressions: number; engagements: number };
}

export interface ContentProgramInput {
  brand: string;
  name?: string;
  objective: string;
  audience?: string;
  pillars?: string[];
  offer?: string;
  contentContext?: string;
  importantDates?: Array<{ date: string; label: string }>;
  perWeek: number;
  horizonWeeks?: 1 | 4;
  channelIds?: string[];
  approvalMode?: "review" | "auto";
  timeZone?: string;
  postingTime?: string;
  startAt?: string;
  endAt?: string;
  paused?: boolean;
  /** Optional approved preview. When omitted, activation plans a fresh horizon. */
  plannedPosts?: Array<{ week: number; scheduledFor: string; brief: string; rationale: string; archetype: LayoutArchetype; format: FormatId; locked?: boolean }>;
}

export interface ContentProgram extends ContentProgramInput {
  id: string;
  name: string;
  horizonWeeks: 1 | 4;
  channelIds: string[];
  approvalMode: "review" | "auto";
  timeZone: string;
  postingTime: string;
  pillars: string[];
  importantDates: Array<{ date: string; label: string }>;
  status: "active" | "paused" | "scheduled" | "complete";
  nextRunAt: string | null;
  lastRunAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentProgramPreview extends ContentProgram {
  posts: Array<{ week: number; scheduledFor: string; brief: string; rationale: string; archetype: LayoutArchetype; format: FormatId; locked?: boolean }>;
  totalPosts: number;
  renderStrategy: "rolling-weekly";
  firstProductionWindow: string[];
}

export interface AnalyticsSummary {
  totals: { posts: number; scheduled: number; published: number; failed: number; measured: number; impressions: number; engagements: number; engagementRate: number | null };
  byChannel: Array<{ platform: string; handle: string; posts: number; impressions: number; engagements: number }>;
  byMonth: Array<{ month: string; posts: number; impressions: number; engagements: number }>;
  topPosts: Array<Omit<ScheduledPost, "channelIds"> & { channelIds: Array<{ id: string; platform: string; handle: string }> }>;
  insight: string;
}

export interface ExecutionPlan {
  dryRun: true; ready: boolean; objective: string; brand: string | null; blockers: string[];
  safeguards: { brandSpecEnforced: boolean; humanApproval: string; idempotentPublishing: boolean };
  estimate: { finishedAssets: number; monthlyRemaining: number };
  steps: Array<{ id: string; action: string; mutates: boolean; ready: boolean }>;
}

export interface ReviewStatus {
  id: string; title: string; ready: boolean;
  counts: { total: number; pending: number; approved: number; flagged: number };
  nextAction: string;
  approved: Array<{ itemId: string; renderId: string; brand: string; brief: string; status: string }>;
  flagged: Array<{ itemId: string; brand: string; brief: string; note: string | null }>;
  comments: Array<{ id: string; itemId?: string; author: string; text: string; createdAt: string }>;
}

export interface AgentRun {
  id: string; objective: string; brand?: string; channels: string[]; assetCount: number; publishAt?: string;
  status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled";
  progress: number; currentStep: string; plan?: ExecutionPlan; input?: Record<string, unknown>;
  renderIds?: string[]; batchId?: string; postIds?: string[]; error?: string;
  createdBy: string; createdAt: string; updatedAt: string;
}

export interface UsageSummary {
  user: { id: string; email?: string | null; emailVerified?: boolean; plan: "free" | "studio" | "agency"; memberOf?: string; memberRole?: string };
  workspaceId: string;
  role: "owner" | "reviewer";
  entitlements: { brands: number; apiKeys: number; features: string[] };
  limit: number;
  genLimit: number;
  counts: { brands: number; batches: number; rendersThisMonth: number; generativeThisMonth: number };
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
    const { spec } = await this.request<{ spec: BrandSpec }>(`/v0/specs/${encodeURIComponent(name)}${q}`);
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
    return this.request(`/v0/specs/${encodeURIComponent(name)}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  listRecipes(brand: string): Promise<{ brand: string; specVersion: number; recipes: TemplateRecipe[] }> {
    return this.request(`/v0/specs/${encodeURIComponent(brand)}/recipes`);
  }

  createRecipe(brand: string, recipe: TemplateRecipe): Promise<{ recipe: TemplateRecipe; specVersion: number }> {
    return this.request(`/v0/specs/${encodeURIComponent(brand)}/recipes`, { method: "POST", body: JSON.stringify({ recipe }) });
  }

  renameRecipe(brand: string, id: string, name: string): Promise<{ recipe: TemplateRecipe; specVersion: number }> {
    return this.request(`/v0/specs/${encodeURIComponent(brand)}/recipes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ name }) });
  }

  deleteRecipe(brand: string, id: string): Promise<{ deleted: string; specVersion: number }> {
    return this.request(`/v0/specs/${encodeURIComponent(brand)}/recipes/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async forkSpec(parent: string, name: string, overrides: object = {}): Promise<BrandSpec> {
    const res = await this.request<{ spec: BrandSpec }>(`/v0/specs/${encodeURIComponent(parent)}/fork`, {
      method: "POST",
      body: JSON.stringify({ name, overrides }),
    });
    return res.spec;
  }

  diffSpec(name: string, from: number, to: number): Promise<{ entries: DiffEntry[]; text: string }> {
    return this.request(`/v0/specs/${encodeURIComponent(name)}/diff?from=${from}&to=${to}`);
  }

  /** brief → finished, brand-locked assets. Pass `copy` to render exact copy (studio path). */
  render(
    brand: string,
    brief: string,
    opts: {
      formats?: FormatId[];
      /** Reusable visual system stored in the active BrandSpec. */
      recipe?: string;
      /** Preferred public selector for a fixed catalog design. */
      template?: LayoutArchetype;
      /** Per-format manual choices. Formats omitted from the map stay automatic. */
      templates?: Partial<Record<FormatId, LayoutArchetype>>;
      /** Versioned system, workspace, or brand template selector. */
      templateRef?: TemplateRef;
      /** Compatibility alias for template. */
      archetype?: LayoutArchetype;
      version?: number;
      copy?: Record<string, Array<{ kicker?: string; hook: string; body?: string; cta?: string; badge?: string; rating?: string; series?: Array<{ label: string; value: number }> }>>;
      runId?: string;
      /** Named dynamic-field changes applied after copy generation. */
      modifications?: TemplateModification[];
      /** Named image slots may only select an existing BrandSpec photo. */
      media?: TemplateMediaSelection[];
    } = {},
  ): Promise<RenderResponse> {
    return this.request("/v0/render", {
      method: "POST",
      body: JSON.stringify({ brand, brief, ...opts }),
    });
  }

  listTemplates(): Promise<{ templates: Array<{ id: LayoutArchetype } & ArchetypeInfo>; modes: string[]; rule: string }> {
    return this.request("/v0/templates");
  }

  async listTemplateFamilies(): Promise<CustomTemplateFamily[]> {
    const { families } = await this.request<{ families: CustomTemplateFamily[] }>("/v0/template-families");
    return families;
  }

  async getTemplateFamily(id: string, version?: number): Promise<CustomTemplateFamily> {
    const query = version ? `?version=${version}` : "";
    const { family } = await this.request<{ family: CustomTemplateFamily }>(`/v0/template-families/${encodeURIComponent(id)}${query}`);
    return family;
  }

  async listTemplateFamilyVersions(id: string): Promise<CustomTemplateFamily[]> {
    const { versions } = await this.request<{ versions: CustomTemplateFamily[] }>(`/v0/template-families/${encodeURIComponent(id)}/versions`);
    return versions;
  }

  async saveTemplateFamily(family: Omit<CustomTemplateFamily, "version" | "status" | "autoEligible" | "createdAt" | "updatedAt"> & Partial<Pick<CustomTemplateFamily, "version" | "status" | "autoEligible" | "createdAt" | "updatedAt">>): Promise<{ family: CustomTemplateFamily; preflight: { ready: boolean; issues: TemplatePreflightIssue[] } }> {
    return this.request("/v0/template-families", { method: "POST", body: JSON.stringify(family) });
  }

  async duplicateTemplateFamily(input: { source: TemplateRef; id: string; name: string; scope: "workspace" | "brand"; brand?: string; formats?: FormatId[] }): Promise<{ family: CustomTemplateFamily; preflight: { ready: boolean; issues: TemplatePreflightIssue[] } }> {
    return this.request("/v0/template-families/duplicate", { method: "POST", body: JSON.stringify(input) });
  }

  preflightTemplateFamily(id: string, brand?: string): Promise<{ ready: boolean; issues: TemplatePreflightIssue[] }> {
    return this.request(`/v0/template-families/${encodeURIComponent(id)}/preflight`, { method: "POST", body: JSON.stringify({ brand }) });
  }

  async publishTemplateFamily(id: string, options: { brand?: string; autoEligible?: boolean } = {}): Promise<CustomTemplateFamily> {
    const { family } = await this.request<{ family: CustomTemplateFamily }>(`/v0/template-families/${encodeURIComponent(id)}/publish`, { method: "POST", body: JSON.stringify(options) });
    return family;
  }

  async archiveTemplateFamily(id: string): Promise<CustomTemplateFamily> {
    const { family } = await this.request<{ family: CustomTemplateFamily }>(`/v0/template-families/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" });
    return family;
  }

  deleteTemplateFamily(id: string): Promise<{ deleted: true }> {
    return this.request(`/v0/template-families/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async uploadTemplateArtwork(file: Blob, filename = "template-artwork"): Promise<{ ref: string; mime: string; bytes: number }> {
    const form = new FormData();
    form.set("file", file, filename);
    const res = await fetch(`${this.apiUrl}/v0/template-assets`, { method: "POST", headers: this.apiKey ? { "x-api-key": this.apiKey } : undefined, body: form });
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok) throw new BrandrailError(res.status, String(body.error ?? `${res.status} ${res.statusText}`));
    return body as { ref: string; mime: string; bytes: number };
  }

  async listRenders(limit = 24): Promise<RenderHistoryEntry[]> {
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const { renders } = await this.request<{ renders: RenderHistoryEntry[] }>(`/v0/renders?limit=${safeLimit}`);
    return renders;
  }

  /** Generate one fenced background, pin it into the BrandSpec, and create a new spec version. */
  generateBackground(brand: string, subject: string): Promise<{ background: string; version: number; photos: number }> {
    return this.request(`/v0/brands/${encodeURIComponent(brand)}/background`, {
      method: "POST",
      body: JSON.stringify({ subject }),
    });
  }

  schedule(input: { text: string; channelIds: string[]; scheduledAt?: string; renderId?: string; imageFiles?: string[]; idempotencyKey?: string; runId?: string; dryRun?: boolean; confirm?: boolean; approval?: { batchId: string; itemId: string } }): Promise<{ dryRun: true; ready: boolean; action: string; channels: string[]; renderId: string | null } | { scheduled: boolean; post: ScheduledPost; deduplicated?: boolean; dryRun?: false }> {
    return this.request("/v0/publish", { method: "POST", body: JSON.stringify(input) });
  }

  executionPlan(input: { objective: string; brand?: string; channels?: string[]; assetCount?: number; publishAt?: string }): Promise<ExecutionPlan> {
    return this.request("/v0/agent/plan", { method: "POST", body: JSON.stringify(input) });
  }

  async startAgentRun(input: { objective: string; brand?: string; channels?: string[]; assetCount?: number; publishAt?: string; start?: boolean }): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>("/v0/agent/runs", { method: "POST", body: JSON.stringify(input) });
    return run;
  }

  async listAgentRuns(limit = 25): Promise<AgentRun[]> {
    const safe = Math.min(100, Math.max(1, Math.floor(limit)));
    const { runs } = await this.request<{ runs: AgentRun[] }>(`/v0/agent/runs?limit=${safe}`);
    return runs;
  }

  async getAgentRun(id: string): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>(`/v0/agent/runs/${encodeURIComponent(id)}`);
    return run;
  }

  async provideAgentInput(id: string, input: Record<string, unknown>): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>(`/v0/agent/runs/${encodeURIComponent(id)}/input`, { method: "POST", body: JSON.stringify({ input }) });
    return run;
  }

  async retryAgentRun(id: string): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>(`/v0/agent/runs/${encodeURIComponent(id)}/retry`, { method: "POST", body: "{}" });
    return run;
  }

  async completeAgentRun(id: string): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>(`/v0/agent/runs/${encodeURIComponent(id)}/complete`, { method: "POST", body: "{}" });
    return run;
  }

  async cancelAgentRun(id: string): Promise<AgentRun> {
    const { run } = await this.request<{ run: AgentRun }>(`/v0/agent/runs/${encodeURIComponent(id)}/cancel`, { method: "POST", body: "{}" });
    return run;
  }

  reviewStatus(batchId: string, runId?: string): Promise<ReviewStatus> {
    return this.request(`/v0/batches/${encodeURIComponent(batchId)}/status${runId ? `?runId=${encodeURIComponent(runId)}` : ""}`);
  }

  createReviewBatch(input: { title?: string; runId?: string; items: Array<{ brand: string; version?: number; brief: string; archetype?: LayoutArchetype; renderId?: string; copy?: Record<string, Array<{ kicker?: string; hook: string; body?: string; cta?: string; badge?: string; rating?: string; series?: Array<{ label: string; value: number }> }>> }> }): Promise<{ id: string; title: string; items: unknown[] }> {
    return this.request("/v0/batches", { method: "POST", body: JSON.stringify(input) });
  }

  addReviewComment(batchId: string, input: { author: string; text: string; itemId?: string }): Promise<{ comment: unknown; comments: unknown[] }> {
    return this.request(`/v0/batches/${encodeURIComponent(batchId)}/comments`, { method: "POST", body: JSON.stringify(input) });
  }

  async audit(limit = 50): Promise<Array<{ id: string; action: string; actor: string; actorId: string; path: string; method: string; status: number; createdAt: string }>> {
    const safeLimit = Math.min(250, Math.max(1, Math.floor(limit)));
    const { events } = await this.request<{ events: Array<{ id: string; action: string; actor: string; actorId: string; path: string; method: string; status: number; createdAt: string }> }>(`/v0/me/audit?limit=${safeLimit}`);
    return events;
  }

  async listChannels(): Promise<Channel[]> {
    const { channels } = await this.request<{ channels: Channel[] }>("/v0/channels");
    return channels;
  }

  async listScheduled(): Promise<ScheduledPost[]> {
    const { posts } = await this.request<{ posts: ScheduledPost[] }>("/v0/scheduled");
    return posts;
  }

  async reschedulePost(id: string, input: { scheduledAt?: string; text?: string }): Promise<ScheduledPost> {
    const { post } = await this.request<{ post: ScheduledPost }>(`/v0/scheduled/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
    return post;
  }

  cancelPost(id: string): Promise<{ post: ScheduledPost }> {
    return this.request(`/v0/scheduled/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async listCampaigns(): Promise<Campaign[]> {
    const { campaigns } = await this.request<{ campaigns: Campaign[] }>("/v0/campaigns");
    return campaigns;
  }

  async createCampaign(input: { name: string; objective: string; status?: Campaign["status"]; startAt?: string; endAt?: string; brandIds?: string[]; batchIds?: string[]; postIds?: string[] }): Promise<Campaign> {
    const { campaign } = await this.request<{ campaign: Campaign }>("/v0/campaigns", { method: "POST", body: JSON.stringify(input) });
    return campaign;
  }

  async updateCampaign(id: string, input: Partial<Omit<Campaign, "id" | "createdAt" | "updatedAt" | "progress">>): Promise<Campaign> {
    const { campaign } = await this.request<{ campaign: Campaign }>(`/v0/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
    return campaign;
  }

  async listContentPrograms(): Promise<ContentProgram[]> {
    const { programs } = await this.request<{ programs: ContentProgram[] }>("/v0/content-programs");
    return programs;
  }

  async previewContentProgram(input: ContentProgramInput): Promise<ContentProgramPreview> {
    const { preview } = await this.request<{ preview: ContentProgramPreview }>("/v0/content-programs/preview", { method: "POST", body: JSON.stringify(input) });
    return preview;
  }

  async saveContentProgram(input: ContentProgramInput): Promise<ContentProgram> {
    const { program } = await this.request<{ program: ContentProgram }>(`/v0/content-programs/${encodeURIComponent(input.brand)}`, { method: "PUT", body: JSON.stringify(input) });
    return program;
  }

  async setContentProgramPaused(brand: string, paused: boolean): Promise<ContentProgram> {
    const { program } = await this.request<{ program: ContentProgram }>(`/v0/content-programs/${encodeURIComponent(brand)}/pause`, { method: "POST", body: JSON.stringify({ paused }) });
    return program;
  }

  runContentProgram(brand: string, confirmForce = false): Promise<{ batches: number; rendered: number; queued: number; skipped: string[]; program: ContentProgram }> {
    return this.request(`/v0/content-programs/${encodeURIComponent(brand)}/run`, { method: "POST", body: JSON.stringify({ confirmForce }) });
  }

  deleteContentProgram(brand: string): Promise<{ ok: boolean }> {
    return this.request(`/v0/content-programs/${encodeURIComponent(brand)}`, { method: "DELETE" });
  }

  async getRender(id: string): Promise<{ id: string; manifest: RenderHistoryEntry["manifest"] }> {
    return this.request(`/v0/renders/${encodeURIComponent(id)}`);
  }

  usage(): Promise<UsageSummary> {
    return this.request("/v0/me/usage");
  }

  analytics(): Promise<AnalyticsSummary> {
    return this.request("/v0/analytics");
  }

  refreshAnalytics(): Promise<{ published: number; updated: number }> {
    return this.request("/v0/analytics/refresh", { method: "POST" });
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

export type { BrandSpec, CustomTemplateFamily, DiffEntry, FormatId, LayoutArchetype, TemplateRef, Violation } from "@brandrail/spec";
