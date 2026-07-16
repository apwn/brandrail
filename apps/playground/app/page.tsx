"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { BrandSpec, FormatId, TemplateRecipe, TemplateSlotInfo, TemplateSlotName } from "@brandrail/spec";
import { ARCHETYPE_INFO } from "@brandrail/spec";
import { WorkspaceLockup } from "./components/workspace-lockup";
import { TemplatePicker } from "./components/template-picker";
import { MarketingLanding } from "./marketing";
import { MCP_TOOL_COUNT } from "@/lib/mcp-meta";

type Step = "landing" | "loading" | "compiling" | "sheet" | "rendering" | "result";

interface CompileResponse {
  spec: BrandSpec;
  confidence: Record<string, number>;
  warnings: string[];
  error?: string;
}
interface AssetRef {
  filename: string;
  format: string;
  slide: number;
  width: number;
  height: number;
  url: string;
}
interface SlideCopy {
  kicker?: string;
  hook: string;
  body?: string;
  cta?: string;
  badge?: string;
  rating?: string;
}
interface ArtDirectionCandidate {
  archetype: string;
  score: number;
  semanticScore?: number;
  visualScore?: number;
  valid?: boolean;
  rejectedBy?: string[];
  reasons: string[];
}
interface ArtDirectionDecision {
  selected: string;
  intent: string;
  candidates: ArtDirectionCandidate[];
  rationale: string;
}
interface RenderResponse {
  id: string;
  specVersion: number;
  assets: AssetRef[];
  manifest: {
    warnings: string[];
    artDirection?: Record<string, ArtDirectionDecision>;
    mediaSelections?: Record<string, { primary?: number; secondary?: number }>;
  };
  plan?: Record<string, string>;
  copy?: Record<string, SlideCopy[]>;
  error?: string;
  violations?: Array<{ code: string; message: string }>;
}
interface AccountState {
  email: string | null;
  verified: boolean;
  plan: string;
  features: string[];
}

const SUGGESTED_BRIEFS = ["Summer promotion", "We're hiring", "Announce our new product"];
const FORMAT_OPTIONS: Array<{ id: FormatId; label: string }> = [
  { id: "ig-carousel", label: "Carousel" },
  { id: "li-image", label: "LinkedIn" },
  { id: "story", label: "Story" },
  { id: "x-graphic", label: "X graphic" },
  { id: "og-image", label: "Link preview" },
];

async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "The server returned an unreadable response. Please retry."
        : `The request failed (${res.status}). Please retry in a moment.`,
    );
  }
}

export default function Playground() {
  const [step, setStep] = useState<Step>("landing");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [compiled, setCompiled] = useState<CompileResponse | null>(null);
  const [existingBrand, setExistingBrand] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [brief, setBrief] = useState("");
  const [render, setRender] = useState<RenderResponse | null>(null);
  const [email, setEmail] = useState("");
  // the value gate: previews are free; TAKING (zip, heavy restyling) needs a
  // verified account. `gate` records what the visitor was trying to do.
  const [gate, setGate] = useState<null | "download" | "restyle">(null);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [restyles, setRestyles] = useState(0);
  const [zipping, setZipping] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const verified = Boolean(account?.verified);
  const canReview = Boolean(account?.features.includes("batchReview"));

  async function refreshAccount() {
    try {
      const res = await fetch("/api/auth/session");
      const data = (await res.json()) as {
        user: { email: string | null; emailVerified?: boolean; plan?: string } | null;
        entitlements?: { features?: string[] };
      };
      setAccount(data.user ? {
        email: data.user.email,
        verified: Boolean(data.user.emailVerified),
        plan: data.user.plan ?? "free",
        features: data.entitlements?.features ?? [],
      } : null);
    } catch {
      /* stay anonymous */
    }
  }
  // re-check when the tab regains focus — the magic link opens in another tab
  useEffect(() => {
    void refreshAccount();
    const onFocus = () => void refreshAccount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Existing brands enter the studio directly. This turns workspace and
  // history CTAs into a continuation of the same product flow instead of
  // sending users back through URL compilation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brand = params.get("brand")?.trim();
    if (!brand) return;
    let cancelled = false;
    const controller = new AbortController();
    setBrief(params.get("brief")?.trim() ?? "");
    setError(null);
    setStep("loading");
    void (async () => {
      try {
        const res = await fetch(`/api/spec?brand=${encodeURIComponent(brand)}`, { cache: "no-store", signal: controller.signal });
        const body = await readApiJson<BrandSpec | { error?: string }>(res);
        if (!res.ok || !("meta" in body)) throw new Error("error" in body ? body.error ?? "brand not found" : "brand not found");
        if (cancelled) return;
        setCompiled({ spec: body, confidence: {}, warnings: [] });
        setExistingBrand(true);
        setEdits({});
        setStep("sheet");
      } catch (e) {
        if (cancelled || (e as Error).name === "AbortError") return;
        setError((e as Error).message);
        setStep("landing");
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const spec = compiled?.spec ?? null;
  const lowConfidence = useMemo(
    () =>
      new Set(
        Object.entries(compiled?.confidence ?? {})
          .filter(([, v]) => v < 0.5)
          .map(([k]) => k),
      ),
    [compiled],
  );

  async function doCompile() {
    if (!url.trim()) return;
    setError(null);
    setStep("compiling");
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const body = await readApiJson<CompileResponse>(res);
      if (!res.ok) throw new Error(body.error ?? "compile failed");
      setCompiled(body);
      setExistingBrand(false);
      setEdits({});
      setStep("sheet");
    } catch (e) {
      setError((e as Error).message);
      setStep("landing");
    }
  }

  async function applyEditsIfAny(): Promise<string> {
    if (!spec) throw new Error("no spec");
    if (Object.keys(edits).length === 0) return spec.meta.name;
    const patch: Record<string, unknown> = {};
    const colorEdits: Record<string, string> = {};
    for (const [key, value] of Object.entries(edits)) {
      if (key.startsWith("color:")) colorEdits[key.slice(6)] = value.toUpperCase();
      if (key === "tone") {
        (patch.voice as Record<string, unknown>) ??= {};
        (patch.voice as Record<string, unknown>).tone = value.split(",").map((t) => t.trim()).filter(Boolean);
      }
      if (key === "banned") {
        (patch.voice as Record<string, unknown>) ??= {};
        (patch.voice as Record<string, unknown>).banned = value.split(",").map((t) => t.trim()).filter(Boolean);
      }
      if (key === "removedPhotos" && value) {
        const removed = new Set(value.split(",").map(Number));
        patch.imagery = {
          photos: spec.imagery.photos.filter((_, i) => !removed.has(i)),
        };
      }
    }
    if (Object.keys(colorEdits).length > 0) {
      patch.identity = { colors: { roles: colorEdits } };
    }
    const res = await fetch("/api/spec", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand: spec.meta.name, patch }),
    });
    const body = await readApiJson<{ spec?: BrandSpec; error?: string; issues?: Array<{ path: string; message: string }> }>(res);
    if (!res.ok) {
      throw new Error(body.issues?.[0] ? `${body.issues[0].path}: ${body.issues[0].message}` : (body.error ?? "edit rejected"));
    }
    setCompiled((c) => (c ? { ...c, spec: body.spec! } : c));
    setEdits({});
    return body.spec!.meta.name;
  }

  async function doRender(
    chosenBrief: string,
    chosenTemplate?: string,
    chosenTemplates?: Partial<Record<FormatId, string>>,
    chosenRecipe?: string,
  ) {
    if (!spec) return;
    setBrief(chosenBrief);
    setError(null);
    setStep("rendering");
    try {
      const brand = await applyEditsIfAny();
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brand,
          brief: chosenBrief,
          ...(chosenTemplate ? { template: chosenTemplate } : {}),
          ...(chosenTemplates && Object.keys(chosenTemplates).length ? { templates: chosenTemplates } : {}),
          ...(chosenRecipe ? { recipe: chosenRecipe } : {}),
        }),
      });
      const body = await readApiJson<RenderResponse>(res);
      if (!res.ok) {
        throw new Error(
          body.violations?.length
            ? `spec violations: ${body.violations.map((v) => v.message).join("; ")}`
            : (body.error ?? "render failed"),
        );
      }
      setRender(body);
      setStep("result");
    } catch (e) {
      setError((e as Error).message);
      setStep("sheet");
    }
  }

  async function saveCurrentRecipe(name: string): Promise<void> {
    if (!spec || !render?.plan) return;
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "saved-look";
    const existing = new Set(spec.composition.recipes.map((recipe) => recipe.id));
    let id = base;
    let suffix = 2;
    while (existing.has(id)) id = `${base}-${suffix++}`;
    const media = Object.entries(render.manifest.mediaSelections ?? {}).flatMap(([format, selection]) =>
      Object.entries(selection).map(([slot, photoIndex]) => ({ format: format as FormatId, name: slot as "primary" | "secondary", photoIndex })),
    );
    const recipe: TemplateRecipe = {
      id,
      name: name.trim(),
      templates: render.plan as Partial<Record<FormatId, keyof typeof ARCHETYPE_INFO>>,
      ...(media.length ? { media } : {}),
    };
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand: spec.meta.name, recipe }),
    });
    const body = await readApiJson<{ recipe?: TemplateRecipe; specVersion?: number; error?: string }>(res);
    if (!res.ok || !body.recipe || !body.specVersion) throw new Error(body.error ?? "recipe could not be saved");
    setCompiled((current) => current ? { ...current, spec: { ...current.spec, meta: { ...current.spec.meta, version: body.specVersion! }, composition: { ...current.spec.composition, recipes: [...current.spec.composition.recipes, body.recipe!] } } } : current);
  }

  async function deleteRecipe(id: string): Promise<void> {
    if (!spec) return;
    const res = await fetch("/api/recipes", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand: spec.meta.name, id }) });
    const body = await readApiJson<{ deleted?: string; specVersion?: number; error?: string }>(res);
    if (!res.ok || !body.deleted || !body.specVersion) throw new Error(body.error ?? "recipe could not be deleted");
    setCompiled((current) => current ? { ...current, spec: { ...current.spec, meta: { ...current.spec.meta, version: body.specVersion! }, composition: { ...current.spec.composition, recipes: current.spec.composition.recipes.filter((recipe) => recipe.id !== id) } } } : current);
  }

  async function renameRecipe(id: string, name: string): Promise<void> {
    if (!spec) return;
    const res = await fetch("/api/recipes", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand: spec.meta.name, id, name: name.trim() }),
    });
    const body = await readApiJson<{ recipe?: TemplateRecipe; specVersion?: number; error?: string }>(res);
    if (!res.ok || !body.recipe || !body.specVersion) throw new Error(body.error ?? "recipe could not be renamed");
    setCompiled((current) => current ? {
      ...current,
      spec: {
        ...current.spec,
        meta: { ...current.spec.meta, version: body.specVersion! },
        composition: {
          ...current.spec.composition,
          recipes: current.spec.composition.recipes.map((recipe) => recipe.id === id ? body.recipe! : recipe),
        },
      },
    } : current);
  }

  const [restyling, setRestyling] = useState<string | null>(null);

  /** studio: re-render one format with a chosen template and/or edited copy.
   * Anonymous visitors get 2 free restyles — enough to feel the studio, not
   * enough to run a production workflow without an account. */
  async function restyleFormat(
    format: string,
    archetype: string,
    copyOverride?: SlideCopy[],
    mediaOverride?: { primary?: number; secondary?: number },
  ) {
    if (!render || !spec) return;
    if (!verified && restyles >= 2) {
      setGate("restyle");
      return;
    }
    setError(null);
    setRestyling(format);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brand: spec.meta.name,
          brief,
          formats: [format],
          archetype,
          replaceRenderId: render.id,
          ...(copyOverride ? { copy: { [format]: copyOverride } } : {}),
          ...(mediaOverride !== undefined ? {
            media: Object.entries(mediaOverride).map(([name, photoIndex]) => ({ format, name, photoIndex })),
          } : {}),
        }),
      });
      const body = await readApiJson<RenderResponse>(res);
      if (!res.ok) {
        throw new Error(
          body.violations?.length
            ? `spec violations: ${body.violations.map((v) => v.message).join("; ")}`
            : (body.error ?? "re-render failed"),
        );
      }
      // splice the new asset(s) for this format into the grid, keeping order
      setRender((prev) => {
        if (!prev) return prev;
        const others = prev.assets.filter((a) => a.format !== format);
        const order = [...new Set(prev.assets.map((a) => a.format))];
        const merged = [...others, ...body.assets].sort(
          (a, b) => order.indexOf(a.format) - order.indexOf(b.format) || a.slide - b.slide,
        );
        const nextMedia = { ...(prev.manifest.mediaSelections ?? {}) };
        if (mediaOverride !== undefined) delete nextMedia[format];
        if (body.manifest.mediaSelections?.[format]) nextMedia[format] = body.manifest.mediaSelections[format];
        return {
          ...prev,
          assets: merged,
          plan: { ...(prev.plan ?? {}), [format]: archetype },
          copy: { ...(prev.copy ?? {}), [format]: body.copy?.[format] ?? prev.copy?.[format] ?? [] },
          manifest: {
            ...prev.manifest,
            artDirection: {
              ...(prev.manifest.artDirection ?? {}),
              ...(body.manifest.artDirection?.[format]
                ? { [format]: body.manifest.artDirection[format] }
                : {}),
            },
            mediaSelections: nextMedia,
          },
        };
      });
      if (!verified) setRestyles((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRestyling(null);
    }
  }


  async function downloadZip() {
    if (!render) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const asset of render.assets) {
        const blob = await fetch(assetUrl(render.id, asset.filename)).then((r) => r.blob());
        zip.file(asset.filename, blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${spec?.meta.name ?? "brandrail"}-assets.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setZipping(false);
    }
  }

  async function sendToReview() {
    if (!render || !spec || reviewing) return;
    setReviewing(true);
    setHandoffError(null);
    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${spec.meta.displayName ?? spec.meta.name} · ${brief}`.slice(0, 120),
          items: [{
            brand: spec.meta.name,
            version: render.specVersion,
            brief,
            renderId: render.id,
            copy: render.copy ?? {},
          }],
        }),
      });
      const body = await readApiJson<{ id?: string; error?: string }>(res);
      if (!res.ok || !body.id) throw new Error(body.error ?? "couldn't create the review handoff");
      window.location.assign(`/review?batch=${encodeURIComponent(body.id)}`);
    } catch (e) {
      setHandoffError((e as Error).message);
      setReviewing(false);
    }
  }

  // the marketing front door is full-bleed; the tool view is the narrow column
  if (step === "landing") {
    return <MarketingLanding url={url} setUrl={setUrl} onSubmit={doCompile} error={error} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Header />
      {error && (
        <div className="panel border-signal mb-8 px-4 py-3 text-sm" role="alert">
          <span className="font-mono text-signal">ERR</span> {error}
        </div>
      )}

      {step === "compiling" && (
        <Working
          label="COMPILING"
          steps={[
            `fetching ${url.trim()}`,
            "reading computed styles",
            "clustering the palette",
            "identifying typography",
            "hunting the logo",
            "judging taste (vision model)",
            "assembling the BrandSpec",
          ]}
        />
      )}
      {step === "loading" && (
        <Working
          label="LOADING BRAND SYSTEM"
          steps={["opening the active BrandSpec", "checking assets and visual language", "preparing the creation studio"]}
        />
      )}
      {(step === "sheet" || step === "rendering") && spec && (
        <>
          {existingBrand
            ? <ActiveBrandSummary spec={spec} />
            : <BrandSheet spec={spec} lowConfidence={lowConfidence} edits={edits} setEdits={setEdits} warnings={compiled?.warnings ?? []} />}
          {step === "sheet" ? (
            <BriefBar
              existingBrand={existingBrand}
              initialValue={brief}
              allowedTemplates={spec.composition.layoutArchetypes}
              photoCount={spec.imagery.photos.length}
              recipes={spec.composition.recipes}
              onDeleteRecipe={deleteRecipe}
              onRenameRecipe={renameRecipe}
              onRender={doRender}
            />
          ) : (
            <Working
              label="RENDERING"
              steps={[
                `writing copy for "${brief}"`,
                "validating against your voice rules",
                "laying out 5 formats on the grid",
                "running the violation gates",
                "rasterizing · 0 hallucinated pixels",
              ]}
            />
          )}
        </>
      )}
      {step === "result" && render && spec && (
        <ResultGrid
          render={render}
          brand={spec.meta.name}
          brief={brief}
          allowedTemplates={spec.composition.layoutArchetypes}
          brandPhotos={spec.imagery.photos}
          unlocked={verified}
          canReview={canReview}
          zipping={zipping}
          reviewing={reviewing}
          handoffError={handoffError}
          restyling={restyling}
          onRestyle={restyleFormat}
          onDownload={() => (verified ? void downloadZip() : setGate("download"))}
          onReview={() => void sendToReview()}
          onAgain={() => setStep("sheet")}
          onSaveRecipe={saveCurrentRecipe}
        />
      )}

      {gate && (
        <AccountGate
          reason={gate}
          email={email}
          setEmail={setEmail}
          onVerified={() => {
            void refreshAccount();
            setGate(null);
            if (gate === "download") void downloadZip();
          }}
          onClose={() => setGate(null)}
        />
      )}
      <Footer />
    </main>
  );
}

function assetUrl(renderId: string, filename: string): string {
  return `/api/asset/${encodeURIComponent(renderId)}/${encodeURIComponent(filename)}`;
}

function ActiveBrandSummary({ spec }: { spec: BrandSpec }) {
  const visual = spec.identity.visualLanguage;
  return (
    <section className="mb-8 border border-hairline bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow text-green">✓ ACTIVE BRAND SYSTEM</p>
          <h1 className="font-display text-3xl font-bold mt-2">{spec.meta.displayName ?? spec.meta.name}</h1>
          <p className="font-mono text-[11px] text-muted mt-2">
            BrandSpec v{spec.meta.version} · {visual.family} · {visual.background} · {spec.imagery.photos.length} brand photo{spec.imagery.photos.length === 1 ? "" : "s"}
          </p>
        </div>
        <a href={`/brands/${encodeURIComponent(spec.meta.name)}`} className="btn-ghost">Edit brand system →</a>
      </div>
    </section>
  );
}

/** Pinned brand assets are stored as content-addressed `blob://<hash>` refs;
 * route them through the blob proxy so the browser can display them. http/data
 * refs (un-pinned) pass through unchanged. */
function photoSrc(asset: BrandSpec["imagery"]["photos"][number] | string): string {
  const ref = typeof asset === "string" ? asset : asset.ref;
  const hash = /^blob:\/\/([a-f0-9]{64})$/.exec(ref)?.[1];
  return hash ? `/api/blob/${hash}` : ref;
}

function removedPhotoSet(edits: Record<string, string>): number[] {
  return (edits.removedPhotos ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
}
function isPhotoRemoved(edits: Record<string, string>, index: number): boolean {
  return removedPhotoSet(edits).includes(index);
}
function removedPhotoCount(edits: Record<string, string>): number {
  return removedPhotoSet(edits).length;
}

function Header() {
  return (
    <header className="mb-14 flex items-center justify-between">
      <WorkspaceLockup context="Playground · V0" />
      <div className="flex gap-5">
        <a href="/dashboard" className="eyebrow hover:text-bone">WORKSPACE</a>
        <a href="/review" className="eyebrow hover:text-bone">BATCH REVIEW →</a>
      </div>
    </header>
  );
}

function Working({ label, steps }: { label: string; steps: string[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  // narration paces itself: ~4s per step, parking on the last one
  const stepIndex = Math.min(Math.floor(tick / 4), steps.length - 1);
  return (
    <section className="py-20" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="rail w-16 animate-pulse" />
        <span className="eyebrow text-signal">{label}</span>
        <span className="font-mono text-[11px] text-muted">{tick}s</span>
      </div>
      <div className="mt-5">
        {steps.map((s, i) => (
          <p
            key={s}
            className={`font-mono text-xs leading-6 transition-colors duration-mech ${
              i < stepIndex ? "text-muted" : i === stepIndex ? "text-bone" : "text-hairline"
            }`}
          >
            {i < stepIndex ? "▪" : i === stepIndex ? "▸" : "·"} {s}
          </p>
        ))}
      </div>
    </section>
  );
}

function Chip({ hex, label, flagged, value, onChange }: { hex: string; label: string; flagged: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded border border-hairline shrink-0" style={{ backgroundColor: value || hex }} />
      <div className="min-w-0">
        <p className="eyebrow">
          {label}
          {flagged && <span className="text-signal ml-2">REVIEW</span>}
        </p>
        <input
          className="bg-transparent font-mono text-sm text-bone w-24 focus:outline-none focus:text-signal"
          value={value || hex}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color`}
        />
      </div>
    </div>
  );
}

function BrandSheet({
  spec,
  lowConfidence,
  edits,
  setEdits,
  warnings,
}: {
  spec: BrandSpec;
  lowConfidence: Set<string>;
  edits: Record<string, string>;
  setEdits: (e: Record<string, string>) => void;
  warnings: string[];
}) {
  const roles = spec.identity.colors.roles;
  const set = (key: string, value: string) => setEdits({ ...edits, [key]: value });
  return (
    <section className="mb-10">
      <p className="eyebrow mb-4">02 / YOUR BRANDSPEC — {spec.meta.name} v{spec.meta.version}</p>
      <div className="panel p-6 grid gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-4 text-bone">COLOR ROLES</p>
          <div className="grid grid-cols-2 gap-5">
            {(["ink", "paper", "signal", "muted"] as const).map((role) =>
              roles[role] ? (
                <Chip
                  key={role}
                  label={role}
                  hex={roles[role]!}
                  value={edits[`color:${role}`] ?? ""}
                  flagged={lowConfidence.has(`identity.colors.roles.${role}`)}
                  onChange={(v) => set(`color:${role}`, v)}
                />
              ) : null,
            )}
          </div>
          <p className="eyebrow mt-8 mb-3 text-bone">TYPE</p>
          <p className="font-display font-bold text-2xl leading-tight">{spec.identity.typography.display.family}</p>
          <p className="text-muted text-sm mt-1">
            body · {spec.identity.typography.body.family}
            {lowConfidence.has("identity.typography.display") && <span className="font-mono text-signal text-[11px] ml-2">REVIEW</span>}
          </p>
          <p className="eyebrow mt-8 mb-3 text-bone">LOGO</p>
          {spec.identity.logo.assets.primary ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc(spec.identity.logo.assets.primary)} alt="detected logo" className="h-10 w-10 rounded border border-hairline object-contain bg-white" />
          ) : (
            <p className="text-muted text-sm">none found — the wordmark is typeset from &ldquo;{spec.meta.name}&rdquo;</p>
          )}
          <p className="eyebrow mt-8 mb-3 text-bone">PHOTOS ({spec.imagery.photos.length - removedPhotoCount(edits)})</p>
          {spec.imagery.photos.length === 0 ? (
            <p className="text-muted text-sm">none found — layouts render typographic. Photo-rich pages compile better.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {spec.imagery.photos.map((photo, i) =>
                isPhotoRemoved(edits, i) ? null : (
                  <div key={(typeof photo === "string" ? photo : photo.ref).slice(0, 80) + i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoSrc(photo)} alt={typeof photo === "string" ? `brand photo ${i + 1}` : photo.alt || `brand photo ${i + 1}`} loading="lazy" className="h-14 w-14 rounded border border-hairline object-cover" />
                    <button
                      aria-label={`remove photo ${i + 1}`}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded bg-ink border border-hairline text-muted hover:text-signal hover:border-signal font-mono text-[9px] leading-none transition-colors duration-mech"
                      onClick={() => set("removedPhotos", [...removedPhotoSet(edits), i].join(","))}
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
        <div>
          <p className="eyebrow mb-4 text-bone">
            VOICE {lowConfidence.has("voice") && <span className="text-signal">DRAFT — REVIEW</span>}
          </p>
          <label className="eyebrow block mb-1">tone (comma-separated)</label>
          <input className="field mb-4" value={edits.tone ?? spec.voice.tone.join(", ")} onChange={(e) => set("tone", e.target.value)} />
          <label className="eyebrow block mb-1">banned words</label>
          <input
            className="field mb-4"
            placeholder="synergy, game-changing, unleash"
            value={edits.banned ?? spec.voice.banned.join(", ")}
            onChange={(e) => set("banned", e.target.value)}
          />
          <p className="text-muted text-xs leading-relaxed">
            CTA style <span className="font-mono text-bone">{spec.voice.ctaStyle}</span> · max {spec.voice.emojiMax} emoji ·
            max {spec.voice.hashtagMax} hashtags. Edits create a new spec version — every change is a diff.
          </p>
          {warnings.length > 0 && (
            <div className="mt-6 border-t border-hairline pt-4">
              {warnings.map((w) => (
                <p key={w} className="font-mono text-[11px] text-muted leading-relaxed">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BriefBar({
  existingBrand,
  initialValue,
  allowedTemplates,
  photoCount,
  recipes,
  onDeleteRecipe,
  onRenameRecipe,
  onRender,
}: {
  existingBrand?: boolean;
  initialValue?: string;
  allowedTemplates: readonly string[];
  photoCount: number;
  recipes: readonly TemplateRecipe[];
  onDeleteRecipe: (id: string) => Promise<void>;
  onRenameRecipe: (id: string, name: string) => Promise<void>;
  onRender: (brief: string, template?: string, templates?: Partial<Record<FormatId, string>>, recipe?: string) => void;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [template, setTemplate] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "template" | "plan" | "recipe">("auto");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<string | null>(null);
  const [confirmDeleteRecipe, setConfirmDeleteRecipe] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [renamingRecipe, setRenamingRecipe] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<FormatId>("ig-carousel");
  const [templatePlan, setTemplatePlan] = useState<Partial<Record<FormatId, string>>>({});
  const selectedInfo = template ? ARCHETYPE_INFO[template as keyof typeof ARCHETYPE_INFO] : null;
  const submit = (brief: string) => onRender(
    brief,
    mode === "template" ? template ?? undefined : undefined,
    mode === "plan" ? templatePlan : undefined,
    mode === "recipe" ? recipe ?? undefined : undefined,
  );
  const selectionReady = (mode !== "template" || Boolean(template)) && (mode !== "recipe" || Boolean(recipe));
  return (
    <section>
      <p className="eyebrow mb-4">{existingBrand ? "01 / WHAT SHOULD WE CREATE?" : "03 / WHAT SHOULD IT SAY?"}</p>
      <form
        className="flex max-w-xl gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) submit(value.trim());
        }}
      >
        <input className="field" placeholder='e.g. "Summer promotion"' value={value} onChange={(e) => setValue(e.target.value)} aria-label="Brief" />
        <button className="btn whitespace-nowrap" type="submit" disabled={!value.trim() || !selectionReady}>
          Render 5 formats →
        </button>
      </form>
      <div className="mt-3 flex gap-2 flex-wrap">
        {SUGGESTED_BRIEFS.map((s) => (
          <button key={s} disabled={!selectionReady} className="btn-ghost !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40" onClick={() => submit(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="mt-6 max-w-3xl border border-hairline bg-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow text-bone">ART DIRECTION</p><p className="mt-1 text-xs leading-relaxed text-muted">Keep it automatic, use one design everywhere, or direct individual channels.</p></div>
          <span className="font-mono text-[9px] text-green">BRANDSPEC LOCKED</span>
        </div>
        {recipes.length > 0 && (
          <div className="mt-3 border-t border-hairline pt-3">
            <p className="mb-2 font-mono text-[9px] text-muted">SAVED VISUAL RECIPES</p>
            <div className="flex flex-wrap gap-2">
              {recipes.map((item) => {
                const selected = mode === "recipe" && recipe === item.id;
                const confirming = confirmDeleteRecipe === item.id;
                return (
                  <span key={item.id} className={`inline-flex min-h-9 border bg-ink ${selected ? "border-signal" : "border-hairline"}`}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setMode("recipe");
                        setRecipe(item.id);
                        setTemplate(null);
                        setRecipeError(null);
                        setConfirmDeleteRecipe(null);
                        setEditingRecipe(null);
                      }}
                      className={`px-3 text-xs ${selected ? "text-bone" : "text-muted hover:text-bone"}`}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Rename recipe ${item.name}`}
                      onClick={() => {
                        setEditingRecipe(item.id);
                        setRecipeName(item.name);
                        setRecipeError(null);
                        setConfirmDeleteRecipe(null);
                      }}
                      className="border-l border-hairline px-2 font-mono text-[9px] text-muted hover:text-bone"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      aria-label={`${confirming ? "Confirm deletion of" : "Delete"} recipe ${item.name}`}
                      disabled={deletingRecipe === item.id}
                      onClick={async () => {
                        if (!confirming) {
                          setConfirmDeleteRecipe(item.id);
                          return;
                        }
                        setDeletingRecipe(item.id);
                        setRecipeError(null);
                        try {
                          await onDeleteRecipe(item.id);
                          if (recipe === item.id) {
                            setRecipe(null);
                            setMode("auto");
                          }
                        } catch (error) {
                          setRecipeError((error as Error).message);
                        } finally {
                          setDeletingRecipe(null);
                          setConfirmDeleteRecipe(null);
                        }
                      }}
                      className={`min-w-9 border-l border-hairline px-2 font-mono text-[9px] hover:text-signal disabled:opacity-40 ${confirming ? "text-signal" : "text-muted"}`}
                    >
                      {deletingRecipe === item.id ? "…" : confirming ? "sure?" : "×"}
                    </button>
                  </span>
                );
              })}
            </div>
            {editingRecipe && (
              <form
                className="mt-3 flex max-w-sm gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!recipeName.trim() || renamingRecipe) return;
                  setRenamingRecipe(true);
                  setRecipeError(null);
                  try {
                    await onRenameRecipe(editingRecipe, recipeName);
                    setEditingRecipe(null);
                    setRecipeName("");
                  } catch (error) {
                    setRecipeError((error as Error).message);
                  } finally {
                    setRenamingRecipe(false);
                  }
                }}
              >
                <input
                  autoFocus
                  aria-label="Recipe name"
                  className="field !min-h-9 !py-1.5 text-xs"
                  maxLength={64}
                  value={recipeName}
                  onChange={(event) => setRecipeName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setEditingRecipe(null);
                      setRecipeName("");
                    }
                  }}
                />
                <button type="submit" disabled={!recipeName.trim() || renamingRecipe} className="btn !min-h-9 !px-3 !py-1.5 text-xs disabled:opacity-40">
                  {renamingRecipe ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => { setEditingRecipe(null); setRecipeName(""); }} className="btn-ghost !min-h-9 !px-3 !py-1.5 text-xs">
                  Cancel
                </button>
              </form>
            )}
            {mode === "recipe" && recipe && <p className="mt-2 font-mono text-[9px] text-green">RECIPE APPLIES THE SAVED VISUAL SYSTEM · COPY STAYS FRESH</p>}
            {recipeError && <p role="status" aria-live="polite" className="mt-2 font-mono text-[9px] text-signal">{recipeError}</p>}
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={mode === "auto"} onClick={() => { setMode("auto"); setTemplate(null); }} className={`border p-3 text-left ${mode === "auto" ? "border-signal bg-signal/5" : "border-hairline"}`}>
            <span className="block text-sm font-semibold text-bone">Auto mix <span className="font-mono text-[9px] text-green">RECOMMENDED</span></span>
            <span className="mt-1 block text-xs text-muted">Best-fit composition per format and carousel slide.</span>
          </button>
          <button type="button" aria-pressed={mode === "template"} onClick={() => setMode("template")} className={`border p-3 text-left ${mode === "template" ? "border-signal bg-signal/5" : "border-hairline"}`}>
            <span className="block text-sm font-semibold text-bone">One template</span>
            <span className="mt-1 block text-xs text-muted">{selectedInfo ? `${selectedInfo.label} selected` : `${allowedTemplates.length} brand-approved designs`}</span>
          </button>
          <button type="button" aria-pressed={mode === "plan"} onClick={() => { setMode("plan"); setTemplate(null); }} className={`border p-3 text-left ${mode === "plan" ? "border-signal bg-signal/5" : "border-hairline"}`}>
            <span className="block text-sm font-semibold text-bone">Channel plan</span>
            <span className="mt-1 block text-xs text-muted">Direct key formats; leave the rest on auto.</span>
          </button>
        </div>
        {mode === "template" && <div className="mt-3 border-t border-hairline pt-3"><TemplatePicker selected={template} allowed={allowedTemplates} photoCount={photoCount} onSelect={setTemplate} /></div>}
        {mode === "template" && selectedInfo && <p className="mt-3 border-l-2 border-signal pl-3 text-xs leading-relaxed text-muted"><span className="font-semibold text-bone">{selectedInfo.label}.</span> {selectedInfo.description} Dynamic: {Object.values(selectedInfo.slots).map((slot) => slot.label.toLowerCase()).join(", ")}. Brand-locked: {selectedInfo.locked.join(", ")}.</p>}
        {mode === "plan" && (
          <div className="mt-3 border-t border-hairline pt-3">
            <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose a channel format">
              {FORMAT_OPTIONS.map((format) => (
                <button key={format.id} type="button" aria-pressed={activeFormat === format.id} onClick={() => setActiveFormat(format.id)} className={`border px-2.5 py-1.5 text-left ${activeFormat === format.id ? "border-signal text-bone" : "border-hairline text-muted"}`}>
                  <span className="block text-[10px] font-semibold">{format.label}</span>
                  <span className={`block font-mono text-[8px] ${templatePlan[format.id] ? "text-signal" : "text-green"}`}>{templatePlan[format.id] ?? "auto"}</span>
                </button>
              ))}
            </div>
            <TemplatePicker
              selected={templatePlan[activeFormat] ?? null}
              allowed={allowedTemplates}
              photoCount={photoCount}
              allowAuto
              onSelect={(value) => setTemplatePlan((current) => {
                const next = { ...current };
                if (value) next[activeFormat] = value;
                else delete next[activeFormat];
                return next;
              })}
            />
            <p className="mt-2 font-mono text-[9px] text-muted">{Object.keys(templatePlan).length} OF {FORMAT_OPTIONS.length} DIRECTED · UNSPECIFIED FORMATS STAY AUTO</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ResultGrid({
  render,
  brand,
  brief,
  allowedTemplates,
  brandPhotos,
  unlocked,
  canReview,
  zipping,
  reviewing,
  handoffError,
  restyling,
  onRestyle,
  onDownload,
  onReview,
  onAgain,
  onSaveRecipe,
}: {
  render: RenderResponse;
  brand: string;
  brief: string;
  allowedTemplates: readonly string[];
  brandPhotos: BrandSpec["imagery"]["photos"];
  unlocked: boolean;
  canReview: boolean;
  zipping: boolean;
  reviewing: boolean;
  handoffError: string | null;
  restyling: string | null;
  onRestyle: (format: string, archetype: string, copy?: SlideCopy[], media?: { primary?: number; secondary?: number }) => void;
  onDownload: () => void;
  onReview: () => void;
  onAgain: () => void;
  onSaveRecipe: (name: string) => Promise<void>;
}) {
  const formats = [...new Set(render.assets.map((a) => a.format))];
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [recipeStatus, setRecipeStatus] = useState<string | null>(null);
  async function saveRecipe() {
    if (!recipeName.trim()) return;
    setRecipeSaving(true);
    setRecipeStatus(null);
    try {
      await onSaveRecipe(recipeName.trim());
      setRecipeStatus("Saved to this BrandSpec");
      setRecipeName("");
      setRecipeOpen(false);
    } catch (error) {
      setRecipeStatus((error as Error).message);
    } finally {
      setRecipeSaving(false);
    }
  }
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-2">04 / FINISHED CAMPAIGN SET · STUDIO</p>
          <h2 className="font-display font-bold text-2xl tracking-tight">&ldquo;{brief}&rdquo; — {brand}</h2>
          <p className="text-muted text-sm mt-1">One idea, adapted to every channel format. Swap a template or edit the words without breaking the set.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => setRecipeOpen((current) => !current)}>Save as recipe</button>
          <button className="btn-ghost" onClick={onAgain}>← another brief</button>
          <button className="btn" onClick={onDownload} disabled={zipping}>
            {zipping ? "zipping…" : unlocked ? "Download all (.zip)" : "Download all →"}
          </button>
        </div>
      </div>
      {recipeOpen && <form className="mb-5 flex max-w-md gap-2" onSubmit={(event) => { event.preventDefault(); void saveRecipe(); }}><input className="field !py-2" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} maxLength={64} placeholder="e.g. Weekly product launch" aria-label="Recipe name" autoFocus /><button className="btn !py-2 whitespace-nowrap" disabled={!recipeName.trim() || recipeSaving}>{recipeSaving ? "saving…" : "Save →"}</button></form>}
      {recipeStatus && <p role="status" aria-live="polite" className={`mb-4 font-mono text-[10px] ${recipeStatus.startsWith("Saved") ? "text-green" : "text-signal"}`}>{recipeStatus}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {formats.map((format) => (
          <StudioCard
            key={format}
            format={format}
            render={render}
            archetype={render.plan?.[format] ?? ""}
            direction={render.manifest.artDirection?.[format]}
            copy={render.copy?.[format] ?? []}
            allowedTemplates={allowedTemplates}
            brandPhotos={brandPhotos}
            mediaSelection={render.manifest.mediaSelections?.[format]}
            busy={restyling === format}
            onRestyle={onRestyle}
          />
        ))}
      </div>
      {render.manifest.warnings.length > 0 && (
        <div className="mt-4">
          {render.manifest.warnings.map((w) => (
            <p key={w} className="font-mono text-[11px] text-muted">⚠ {w}</p>
          ))}
        </div>
      )}
      <div className="mt-10 border border-hairline bg-bone text-ink">
        <div className="grid gap-px bg-hairline md:grid-cols-3">
          {[
            ["01", "RENDERED", `${formats.length} formats · exact asset set`, true],
            ["02", "APPROVAL", canReview ? "Ready for a human decision" : "Studio adds the review gate", canReview],
            ["03", "DELIVERY", canReview ? "Schedule after approval" : "Publish when the workload earns it", false],
          ].map(([number, label, detail, complete]) => (
            <div key={String(number)} className="bg-bone p-4">
              <div className="flex items-center justify-between font-mono text-[9px] tracking-[.16em]">
                <span>{number} / {label}</span>
                <span className={complete ? "text-green" : "text-[#7D776E]"}>{complete ? "● READY" : "○ NEXT"}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{detail}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="eyebrow text-signal">PRODUCTION HANDOFF</p>
            <h3 className="mt-2 font-display text-xl font-bold">Approve this exact set. Then schedule it.</h3>
            <p className="mt-1 max-w-2xl text-sm text-[#625D55]">
              No duplicate generation and no changed creative. The review trail stays attached to render <span className="font-mono text-[11px]">{render.id.slice(-10)}</span>.
            </p>
            {handoffError && <p className="mt-2 font-mono text-[11px] text-signal">ERR {handoffError}</p>}
          </div>
          {canReview ? (
            <button className="btn whitespace-nowrap" onClick={onReview} disabled={reviewing}>
              {reviewing ? "opening review…" : "Send to approval →"}
            </button>
          ) : (
            <a className="btn whitespace-nowrap" href="/#pricing">Add review + publishing →</a>
          )}
        </div>
      </div>
      <div className="relative mt-10 overflow-hidden border border-signal/60 bg-panel p-6 sm:p-8">
        <div className="surface-grid absolute inset-0 opacity-20" aria-hidden />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div><p className="eyebrow text-signal">DON&rsquo;T REBUILD THIS NEXT WEEK</p><h3 className="mt-3 font-display text-2xl font-bold">Give this BrandSpec to your agent.</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Connect a compatible agent. Ask for the campaign outcome; Brandrail keeps the identity, returns inspectable assets, pauses for approval and records every action.</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-bone"><span>✓ 1 FREE CONNECTION</span><span>✓ {MCP_TOOL_COUNT} MCP TOOLS</span><span>✓ SCOPED AUTHORITY</span></div></div>
          <a className="btn whitespace-nowrap" href={unlocked ? "/dashboard#agent" : "/login?agent=1"}>Connect your agent →</a>
        </div>
      </div>
    </section>
  );
}

function StudioCard({
  format,
  render,
  archetype,
  direction,
  copy,
  allowedTemplates,
  brandPhotos,
  mediaSelection,
  busy,
  onRestyle,
}: {
  format: string;
  render: RenderResponse;
  archetype: string;
  direction?: ArtDirectionDecision;
  copy: SlideCopy[];
  allowedTemplates: readonly string[];
  brandPhotos: BrandSpec["imagery"]["photos"];
  mediaSelection?: { primary?: number; secondary?: number };
  busy: boolean;
  onRestyle: (format: string, archetype: string, copy?: SlideCopy[], media?: { primary?: number; secondary?: number }) => void;
}) {
  const assets = render.assets.filter((a) => a.format === format).sort((a, b) => a.slide - b.slide);
  const [open, setOpen] = useState(false);
  const [arch, setArch] = useState(archetype);
  const [draft, setDraft] = useState<SlideCopy[]>(copy);
  const [media, setMedia] = useState<{ primary?: number; secondary?: number }>(mediaSelection ?? {});
  const isCarousel = assets.length > 1;

  // Keep local state in sync when a re-render replaces this format.
  const sig = archetype + "|" + JSON.stringify(copy) + "|" + JSON.stringify(mediaSelection ?? {});
  useEffect(() => {
    setArch(archetype);
    setDraft(copy);
    setMedia(mediaSelection ?? {});
  }, [sig, archetype, copy, mediaSelection]);

  const dirty = arch !== archetype || JSON.stringify(draft) !== JSON.stringify(copy) || JSON.stringify(media) !== JSON.stringify(mediaSelection ?? {});
  const templateInfo = ARCHETYPE_INFO[arch as keyof typeof ARCHETYPE_INFO];
  const templateSlots = Object.entries(templateInfo?.slots ?? {}) as Array<[TemplateSlotName, TemplateSlotInfo]>;
  const mediaSlots = Object.entries(templateInfo?.mediaSlots ?? {}) as Array<["primary" | "secondary", { label: string; required?: boolean }]>;
  const invalidFields = draft.flatMap((slide, slideIndex) => templateSlots.flatMap(([slot, field]) => {
    const value = slide[slot] ?? "";
    if (field.required && value.trim().length < (field.minChars ?? 1)) return [`Slide ${slideIndex + 1} · ${field.label} is required`];
    if (value.length > field.maxChars) return [`Slide ${slideIndex + 1} · ${field.label} is ${value.length - field.maxChars} characters over`];
    return [];
  }));
  if (media.primary !== undefined && media.primary === media.secondary) invalidFields.push("Choose two different photos for this comparison");

  return (
    <div className="panel overflow-hidden flex flex-col">
      <div className={`grid ${isCarousel ? "grid-cols-2" : "grid-cols-1"} gap-px bg-hairline`}>
        {assets.map((asset) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={asset.filename}
            src={assetUrl(render.id, asset.filename)}
            alt={`${format}${asset.slide > 0 ? ` ${asset.slide + 1}` : ""}`}
            width={asset.width}
            height={asset.height}
            loading="lazy"
            className={`w-full h-auto bg-panel ${busy ? "opacity-40" : ""}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-hairline">
        <span className="font-mono text-[11px] text-muted">
          {format} · {archetype}
          {direction?.intent && direction.intent !== "manual" ? ` · auto:${direction.intent}` : ""}
        </span>
        <button
          className="font-mono text-[11px] text-muted hover:text-signal transition-colors duration-mech"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "close ✕" : "edit ▸"}
        </button>
      </div>
      {direction?.rationale && (
        <p className="border-t border-hairline px-3 py-2 font-mono text-[10px] leading-relaxed text-muted">
          {direction.rationale}
        </p>
      )}
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-hairline flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2"><div><p className="eyebrow">template library</p><p className="mt-1 text-xs text-muted">Choose the composition. Brand tokens stay locked.</p></div><span className="font-mono text-[9px] text-green">{allowedTemplates.length} ALLOWED</span></div>
          <TemplatePicker selected={arch} allowed={allowedTemplates} candidates={direction?.candidates ?? []} photoCount={brandPhotos.length} onSelect={(value) => { if (value) { setArch(value); setMedia({}); } }} />
          {templateInfo && <div className="border-l-2 border-signal pl-3"><p className="text-xs font-semibold text-bone">{templateInfo.label}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{templateInfo.description}</p><p className="mt-1 font-mono text-[9px] text-muted">LOCKED · {templateInfo.locked.join(" · ")}</p></div>}
          {mediaSlots.length > 0 && (
            <div className="flex flex-col gap-3">
              <div><p className="eyebrow">approved imagery</p><p className="mt-1 text-xs text-muted">Choose from this BrandSpec only. Crop and treatment remain locked.</p></div>
              {brandPhotos.length === 0 ? (
                <p className="border border-hairline p-3 text-xs text-muted">No approved photography yet. Add photos in the brand workspace or use a typographic template.</p>
              ) : mediaSlots.map(([slot, field]) => (
                <fieldset key={slot} className="border border-hairline p-3">
                  <legend className="px-1 font-mono text-[9px] text-muted">{field.label.toUpperCase()}</legend>
                  <div className="grid grid-cols-5 gap-2">
                    <button type="button" aria-pressed={media[slot] === undefined} onClick={() => setMedia((current) => { const next = { ...current }; delete next[slot]; return next; })} className={`aspect-square border font-mono text-[8px] ${media[slot] === undefined ? "border-signal text-signal" : "border-hairline text-muted"}`}>AUTO</button>
                    {brandPhotos.map((photo, index) => (
                      <button key={(typeof photo === "string" ? photo : photo.ref).slice(0, 80) + index} type="button" aria-label={`Use brand photo ${index + 1} for ${field.label}`} aria-pressed={media[slot] === index} onClick={() => setMedia((current) => ({ ...current, [slot]: index }))} className={`aspect-square overflow-hidden border ${media[slot] === index ? "border-signal" : "border-hairline"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoSrc(photo)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div><p className="eyebrow">dynamic fields</p><p className="mt-1 text-xs text-muted">Edit named fields like a design API. Limits protect the layout.</p></div>
            {draft.map((slide, slideIndex) => (
              <div key={slideIndex} className="border border-hairline p-3">
                {isCarousel && <p className="mb-2 font-mono text-[9px] text-signal">SLIDE {String(slideIndex + 1).padStart(2, "0")}</p>}
                <div className="flex flex-col gap-2">
                  {templateSlots.map(([slot, field]) => {
                    if (!field) return null;
                    const value = slide[slot] ?? "";
                    const shared = {
                      className: "field !py-2 text-xs",
                      value,
                      maxLength: field.maxChars,
                      "aria-required": field.required || undefined,
                      placeholder: field.placeholder,
                      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((current) => current.map((item, index) => index === slideIndex ? { ...item, [slot]: event.target.value } : item)),
                    };
                    return <label key={slot} className="block"><span className="mb-1 flex items-center justify-between font-mono text-[9px] text-muted"><span>{field.label}{field.required ? " *" : ""}</span><span className={value.length > field.maxChars * 0.9 ? "text-signal" : ""}>{value.length}/{field.maxChars}</span></span>{field.multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />}</label>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn !py-2"
            disabled={busy || !dirty || invalidFields.length > 0}
            onClick={() => onRestyle(format, arch, draft, mediaSlots.length > 0 || mediaSelection ? media : undefined)}
          >
            {busy ? "re-rendering…" : "Re-render this →"}
          </button>
          {invalidFields[0] && <p className="font-mono text-[10px] text-signal">FIX · {invalidFields[0]}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * The value gate. Previewing is anonymous; exporting, continuing within the
 * free monthly allowance, and saving a workspace require one verified email.
 * Paid workflow features remain governed by the engine's plan entitlements.
 */
function AccountGate({
  reason,
  email,
  setEmail,
  onVerified,
  onClose,
}: {
  reason: "download" | "restyle";
  email: string;
  setEmail: (v: string) => void;
  onVerified: () => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function requestLink() {
    setState("sending");
    setErr(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json()) as { ok?: boolean; devLink?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "couldn't send the link");
      setDevLink(body.devLink ?? null);
      setState("sent");
    } catch (e) {
      setErr((e as Error).message);
      setState("error");
    }
  }

  const headline = reason === "download" ? "Your assets. Your workspace." : "Keep the studio open.";
  const pitch =
    reason === "download"
      ? "One verified email unlocks the one-click ZIP, saves this brand to your workspace, and makes it all recoverable on any device. No password — we email you a sign-in link."
      : "You've felt the studio — two anonymous restyles. A free account saves this brand and lets you keep creating within the free monthly allowance. No password — we email you a sign-in link.";

  return (
    <div className="fixed inset-0 bg-ink/90 flex items-center justify-center p-6 z-50" role="dialog" aria-modal="true">
      <div className="panel max-w-md w-full p-8 relative">
        <button className="absolute top-4 right-4 font-mono text-muted hover:text-bone" onClick={onClose} aria-label="close">✕</button>
        <div className="rail w-10 mb-6" />
        {state !== "sent" ? (
          <>
            <h3 className="font-display font-bold text-2xl tracking-tight">{headline}</h3>
            <p className="text-muted text-sm mt-3 leading-relaxed">{pitch}</p>
            <form
              className="mt-6 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void requestLink();
              }}
            >
              <input className="field" type="email" placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              <button className="btn whitespace-nowrap" type="submit" disabled={state === "sending"}>
                {state === "sending" ? "sending…" : "Email my link"}
              </button>
            </form>
            {err && <p className="font-mono text-xs text-signal mt-3">ERR {err}</p>}
            <p className="font-mono text-[11px] text-muted mt-4">Free plan. No credit card. The preview stays free either way.</p>
          </>
        ) : (
          <>
            <h3 className="font-display font-bold text-2xl tracking-tight">Check your inbox.</h3>
            <p className="text-muted text-sm mt-3 leading-relaxed">
              We sent a sign-in link to <b className="text-bone">{email}</b>. Click it, come back to this tab, and you&rsquo;re in —
              your work here carries over.
            </p>
            {devLink && (
              <a className="btn mt-5 inline-block" href={devLink} target="_blank" rel="noreferrer">
                Dev mode: open the link →
              </a>
            )}
            <button className="font-mono text-[11px] text-muted mt-5 block hover:text-bone" onClick={onVerified}>
              I clicked it — continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline pt-6 pb-10 flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="eyebrow">DEATH TO SLOP</span>
      <a className="font-mono text-[11px] text-muted hover:text-bone transition-colors duration-mech" href="https://github.com/apwn/brandrail">
        github.com/apwn/brandrail
      </a>
      <span className="font-mono text-[11px] text-muted">CLI · MCP · SDK are pre-release — run them from GitHub</span>
    </footer>
  );
}
