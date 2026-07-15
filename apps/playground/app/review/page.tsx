"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeliveryDialog } from "./delivery-dialog";

/* ------------------------------------------------------------------ types */
type Slide = Record<string, string>;
type Copy = { brief: string; formats: Record<string, Slide[]> };
type Status = "pending" | "approved" | "edited" | "flagged";
type Item = {
  id: string;
  brand: string;
  brief: string;
  archetype?: string;
  status: Status;
  renderId: string;
  violations: number;
  note?: string;
  copy: Copy;
  assets: Array<{ format: string; filename: string }>;
  reviewMs?: number;
};
type Batch = { id: string; title: string; items: Item[] };

const FORMAT_ORDER = ["og-image", "ig-carousel", "li-image", "story", "x-graphic"];
const SLOTS = ["kicker", "hook", "body", "cta", "badge", "rating"];

function assetSrc(renderId: string, filename: string): string {
  return `/api/asset/${encodeURIComponent(renderId)}/${encodeURIComponent(filename)}`;
}
/** assets grouped by format, in a stable display order */
function byFormat(item: Item): Array<{ format: string; files: string[] }> {
  const map = new Map<string, string[]>();
  for (const a of item.assets) map.set(a.format, [...(map.get(a.format) ?? []), a.filename]);
  return [...map.entries()]
    .sort((a, b) => FORMAT_ORDER.indexOf(a[0]) - FORMAT_ORDER.indexOf(b[0]))
    .map(([format, files]) => ({ format, files }));
}

/* ------------------------------------------------------------------ page */
export default function ReviewPage() {
  const [specs, setSpecs] = useState<Array<{ name: string }>>([]);
  const [brands, setBrands] = useState<Set<string>>(new Set());
  const [briefs, setBriefs] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [cursor, setCursor] = useState(0);
  const [editing, setEditing] = useState<Copy["formats"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [role, setRole] = useState<"owner" | "reviewer">("owner");
  const [access, setAccess] = useState<"loading" | "allowed" | "locked" | "signedout">("loading");
  const shownAt = useRef<number>(0);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then(async (data) => {
      if (!data.user) return setAccess("signedout");
      const features = Array.isArray(data.entitlements?.features) ? data.entitlements.features as string[] : [];
      if (!features.includes("batchReview")) return setAccess("locked");
      setRole(data.role === "reviewer" ? "reviewer" : "owner");
      setAccess("allowed");
      const specsRes = await fetch("/api/specs");
      if (specsRes.ok) setSpecs(((await specsRes.json()) as { specs?: Array<{ name: string }> }).specs ?? []);
      const id = new URLSearchParams(window.location.search).get("batch");
      if (!id) return;
      const batchRes = await fetch(`/api/batch/${encodeURIComponent(id)}`);
      if (!batchRes.ok) return;
      const loaded = await batchRes.json() as Batch;
      if (!loaded?.items) return;
      setBatch(loaded);
      const first = loaded.items.findIndex((item) => item.status === "pending");
      setCursor(first >= 0 ? first : 0);
    }).catch(() => setAccess("signedout"));
  }, []);

  // reset the review timer whenever the focused item changes
  useEffect(() => {
    shownAt.current = typeof performance !== "undefined" ? performance.now() : 0;
    setEditing(null);
  }, [cursor, batch?.id]);

  const items = batch?.items ?? [];
  const current = items[cursor];

  const setItem = useCallback((updated: Item) => {
    setBatch((b) => (b ? { ...b, items: b.items.map((it) => (it.id === updated.id ? updated : it)) } : b));
  }, []);

  const nextPending = useCallback(
    (from: number) => {
      for (let d = 1; d <= items.length; d++) {
        const i = (from + d) % items.length;
        if (items[i]?.status === "pending") return i;
      }
      return from;
    },
    [items],
  );

  // the planner: propose on-brand briefs for the first selected client
  const suggest = useCallback(async () => {
    const brand = [...brands][0];
    if (!brand) {
      setError("pick a client first");
      return;
    }
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brand, count: 6 }),
      });
      const data = (await res.json()) as { items?: Array<{ brief: string }>; error?: string };
      if (!res.ok) throw new Error(data.error ?? "planning failed");
      setBriefs((data.items ?? []).map((i) => i.brief).join("\n"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSuggesting(false);
    }
  }, [brands]);

  const generate = useCallback(async () => {
    const briefList = briefs.split("\n").map((b) => b.trim()).filter(Boolean);
    if (brands.size === 0 || briefList.length === 0) {
      setError("pick at least one brand and one brief");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const payload = {
        title: title || `Review ${new Date().toISOString().slice(0, 10)}`,
        // cross-product: every brief for every selected client
        items: [...brands].flatMap((brand) => briefList.map((brief) => ({ brand, brief }))),
      };
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "batch failed");
      setBatch(data as Batch);
      const first = (data.items as Item[]).findIndex((i) => i.status === "pending");
      setCursor(first >= 0 ? first : 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [brands, briefs, title]);

  const review = useCallback(
    async (action: "approve" | "edit" | "regenerate" | "flag", extra: Record<string, unknown> = {}) => {
      if (!batch || !current || busy) return;
      setBusy(true);
      try {
        const reviewMs = Math.round((typeof performance !== "undefined" ? performance.now() : 0) - shownAt.current);
        const res = await fetch(`/api/batch/${batch.id}/item/${current.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, reviewMs, ...extra }),
        });
        const updated = await res.json();
        if (!res.ok) throw new Error(updated.error ?? "action failed");
        setItem(updated as Item);
        setEditing(null);
        if (action !== "regenerate") setCursor((c) => nextPending(c)); // regen stays for re-review
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [batch, current, busy, setItem, nextPending],
  );

  const approveAllPending = useCallback(async () => {
    if (!batch) return;
    setBusy(true);
    try {
      for (const it of batch.items) {
        if (it.status !== "pending" || !it.renderId) continue;
        const res = await fetch(`/api/batch/${batch.id}/item/${it.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "approve", reviewMs: 0 }),
        });
        const updated = await res.json();
        if (res.ok) setItem(updated as Item);
      }
    } finally {
      setBusy(false);
    }
  }, [batch, setItem]);

  /** export the approved set as a zip: PNGs foldered by client + a manifest the
   * scheduler (or a human) can act on. The hand-off the strategy calls for. */
  const exportApproved = useCallback(async () => {
    if (!batch) return;
    const approved = batch.items.filter((i) => (i.status === "approved" || i.status === "edited") && i.renderId);
    if (approved.length === 0) return;
    setBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const manifest = approved.map((it) => ({
        brand: it.brand,
        brief: it.brief,
        status: it.status,
        archetype: it.archetype,
        copy: it.copy?.formats,
        assets: it.assets.map((a) => a.filename),
      }));
      zip.file("manifest.json", JSON.stringify({ batch: batch.title, approved: approved.length, items: manifest }, null, 2));
      for (const it of approved) {
        const slug = it.brief.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "post";
        for (const a of it.assets) {
          const res = await fetch(assetSrc(it.renderId, a.filename));
          if (res.ok) zip.file(`${it.brand}/${slug}/${a.filename}`, await res.blob());
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batch.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "batch"}-approved.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }, [batch]);

  /* keyboard triage */
  useEffect(() => {
    if (!batch || deliveryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // don't hijack the editor
      if (editing) return;
      if (e.key === "a" && e.shiftKey) return void approveAllPending();
      switch (e.key.toLowerCase()) {
        case "a": return void review("approve");
        case "f": return void review("flag");
        case "r": return void review("regenerate");
        case "e": return void (current && setEditing(structuredClone(current.copy.formats)));
        case "j": return setCursor((c) => Math.min(items.length - 1, c + 1));
        case "k": return setCursor((c) => Math.max(0, c - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [batch, deliveryOpen, editing, current, items.length, review, approveAllPending]);

  /* metrics */
  const reviewed = items.filter((i) => i.status !== "pending").length;
  const approveTimes = items
    .filter((i) => (i.status === "approved" || i.status === "edited") && typeof i.reviewMs === "number" && i.reviewMs! > 0)
    .map((i) => i.reviewMs!)
    .sort((a, b) => a - b);
  const median = approveTimes.length ? approveTimes[Math.floor(approveTimes.length / 2)]! : 0;
  const approvedItems = items.filter((item) => (item.status === "approved" || item.status === "edited") && item.renderId);

  const grouped = useMemo(() => {
    const g = new Map<string, Item[]>();
    for (const it of items) g.set(it.brand, [...(g.get(it.brand) ?? []), it]);
    return [...g.entries()];
  }, [items]);

  /* ---------------------------------------------------------------- render */
  if (access === "loading") return <AccessScreen title="Loading review workspace…" body="Checking your workspace access and latest plan." />;
  if (access === "signedout") return <AccessScreen title="Sign in to review" body="Review queues live in a recoverable workspace, so we need to know which brand system to open." cta="Email me a sign-in link" href="/login" />;
  if (access === "locked") return <AccessScreen title="Batch review starts with Studio" body="Free gives you the full compile, render and export loop. Studio adds planning, batch approvals, autopilot and publishing when the weekly workload earns it." cta="Compare plans" href="/#pricing" />;
  if (!batch) {
    if (role === "reviewer") {
      return (
        <main className="min-h-screen bg-ink text-bone px-6 py-14 max-w-3xl mx-auto">
          <a href="/dashboard" className="eyebrow hover:text-bone">← WORKSPACE</a>
          <h1 className="text-3xl font-semibold mt-6">Reviewer access</h1>
          <p className="text-muted mt-2 max-w-xl">Open a review batch from the workspace. Creating batches, planning content and publishing remain with the workspace owner.</p>
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-ink text-bone px-6 py-14 max-w-3xl mx-auto">
        <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
        <h1 className="text-3xl font-semibold mt-6">Batch review</h1>
        <p className="text-muted mt-2 max-w-xl">
          Generate many brand-locked posts across your clients, then triage them by keyboard.
          Every render already passed the brand gate — you&rsquo;re judging the message, not the design.
        </p>

        <p className="eyebrow mt-10 mb-3 text-bone">CLIENTS</p>
        {specs.length === 0 ? (
          <p className="text-muted text-sm">
            No compiled brands yet. <a className="text-signal" href="/">Compile one first →</a>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {specs.map((s) => {
              const on = brands.has(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() =>
                    setBrands((b) => {
                      const n = new Set(b);
                      n.has(s.name) ? n.delete(s.name) : n.add(s.name);
                      return n;
                    })
                  }
                  className={`px-3 py-1.5 rounded border text-sm font-mono transition-colors duration-mech ${
                    on ? "border-signal text-signal" : "border-hairline text-muted hover:border-bone"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 mb-3">
          <p className="eyebrow text-bone">BRIEFS · one per line</p>
          <button className="eyebrow text-signal hover:text-bone disabled:opacity-40" onClick={suggest} disabled={suggesting || brands.size === 0}>
            {suggesting ? "PLANNING…" : "✨ SUGGEST POSTS"}
          </button>
        </div>
        <textarea
          className="field h-40 font-mono"
          placeholder={"Summer sale — 20% off\nWe just shipped realtime\nHiring a brand designer\n\n(or ✨ Suggest posts to plan on-brand ideas for you)"}
          value={briefs}
          onChange={(e) => setBriefs(e.target.value)}
        />
        <input className="field mt-3" placeholder="Batch title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />

        {error && <p className="text-signal text-sm mt-3 font-mono">{error}</p>}
        <button className="btn mt-5" onClick={generate} disabled={generating}>
          {generating ? "Rendering the batch…" : `Generate ${brands.size || "—"} client × brief posts`}
        </button>
      </main>
    );
  }

  const formats = current ? byFormat(current) : [];
  const heroIdx = Math.max(0, formats.findIndex((f) => f.format === "og-image"));
  const hero = formats[heroIdx];

  return (
    <main className="min-h-screen bg-ink text-bone flex flex-col">
      {/* header: progress + the R8 KPIs */}
      <header className="flex flex-col gap-4 border-b border-hairline px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
          <span className="text-bone font-semibold">{batch.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-sm xl:justify-end">
          <span className="text-muted">{reviewed}/{items.length} reviewed</span>
          <span className="text-muted">median <span className="text-bone">{(median / 1000).toFixed(1)}s</span> / approve</span>
          <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={approveAllPending} disabled={busy}>
            ⇧A approve all passing
          </button>
          <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={exportApproved} disabled={busy}>
            Export ↓
          </button>
          {role === "owner" && <button className="btn !py-1.5 !px-3 text-xs" onClick={() => setDeliveryOpen(true)} disabled={busy || approvedItems.length === 0}>
            Schedule approved ({approvedItems.length}) →
          </button>}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left rail: grouped by client */}
        <aside className="flex w-full shrink-0 gap-2 overflow-x-auto border-b border-hairline py-3 lg:block lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-4">
          {grouped.map(([brand, its]) => (
            <div key={brand} className="mb-2 min-w-48 lg:mb-4 lg:min-w-0">
              <p className="eyebrow px-4 mb-2">{brand}</p>
              {its.map((it) => {
                const idx = items.indexOf(it);
                const dot =
                  it.status === "approved" || it.status === "edited"
                    ? "bg-signal"
                    : it.status === "flagged"
                      ? "bg-bone"
                      : "bg-hairline";
                return (
                  <button
                    key={it.id}
                    onClick={() => setCursor(idx)}
                    className={`w-full text-left px-4 py-1.5 flex items-center gap-2 text-sm transition-colors duration-mech ${
                      idx === cursor ? "bg-panel text-bone" : "text-muted hover:text-bone"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <span className="truncate">{it.brief}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* center: current item */}
        <section className="flex-1 min-w-0 overflow-y-auto p-6">
          {!current ? (
            <p className="text-muted">Nothing here.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">{current.brand} · {current.archetype ?? "auto"}</p>
                  <h2 className="text-xl font-semibold mt-1">{current.brief}</h2>
                </div>
                {current.renderId ? (
                  <span className="font-mono text-[11px] px-2 py-1 rounded border border-signal text-signal whitespace-nowrap">
                    brand-locked ✓ {current.violations} violations
                  </span>
                ) : (
                  <span className="font-mono text-[11px] px-2 py-1 rounded border border-bone text-bone">could not render</span>
                )}
              </div>

              {current.note && <p className="text-muted text-sm mt-2 font-mono">{current.note}</p>}

              {current.renderId && hero && (
                <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
                  {/* hero format */}
                  <div className="panel p-3">
                    <p className="eyebrow mb-2">{hero.format}</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {hero.files.map((f) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={f} src={assetSrc(current.renderId, f)} alt={hero.format} className="rounded border border-hairline max-h-72" />
                      ))}
                    </div>
                  </div>
                  {/* other formats as thumbnails */}
                  <div className="grid grid-cols-2 gap-2 content-start">
                    {formats.filter((_, i) => i !== heroIdx).map((fmt) => (
                      <div key={fmt.format} className="panel p-2">
                        <p className="eyebrow mb-1 text-[10px]">{fmt.format}</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetSrc(current.renderId, fmt.files[0]!)} alt={fmt.format} className="rounded border border-hairline w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editing ? (
                <CopyEditor
                  formats={editing}
                  onChange={setEditing}
                  onCancel={() => setEditing(null)}
                  onSave={() => review("edit", { copy: editing })}
                  busy={busy}
                />
              ) : (
                <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-sm">
                  <ActionButton k="A" label="Approve" onClick={() => review("approve")} disabled={busy || !current.renderId} primary />
                  <ActionButton k="E" label="Edit copy" onClick={() => current.renderId && setEditing(structuredClone(current.copy.formats))} disabled={busy || !current.renderId} />
                  <ActionButton k="R" label="Regenerate" onClick={() => review("regenerate")} disabled={busy} />
                  <ActionButton k="F" label="Flag" onClick={() => review("flag")} disabled={busy} />
                  <span className="text-muted ml-2">J/K to move</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {deliveryOpen && (
        <DeliveryDialog
          batchId={batch.id}
          batchTitle={batch.title}
          items={approvedItems}
          onClose={() => setDeliveryOpen(false)}
        />
      )}
    </main>
  );
}

function AccessScreen({ title, body, cta, href }: { title: string; body: string; cta?: string; href?: string }) {
  return <main className="min-h-screen bg-ink text-bone px-6 py-20 max-w-2xl mx-auto"><a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a><div className="rail w-14 mt-16" /><h1 className="font-display text-4xl font-bold mt-6">{title}</h1><p className="text-muted mt-4 max-w-xl leading-relaxed">{body}</p>{cta && href && <a className="btn mt-7" href={href}>{cta} →</a>}</main>;
}

/* ------------------------------------------------------------- components */
function ActionButton({ k, label, onClick, disabled, primary }: { k: string; label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={primary ? "btn !py-2" : "btn-ghost !py-2"}>
      <kbd className={`px-1.5 py-0.5 rounded text-[11px] ${primary ? "bg-ink/20 text-ink" : "border border-hairline text-muted"}`}>{k}</kbd>
      {label}
    </button>
  );
}

function CopyEditor({
  formats,
  onChange,
  onSave,
  onCancel,
  busy,
}: {
  formats: Copy["formats"];
  onChange: (f: Copy["formats"]) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const set = (fmt: string, slide: number, slot: string, value: string) => {
    const next = structuredClone(formats);
    next[fmt]![slide]![slot] = value;
    onChange(next);
  };
  return (
    <div className="mt-6 panel p-4">
      <p className="eyebrow mb-3">EDIT COPY — re-renders through the brand gate on save</p>
      <div className="grid gap-4 max-h-80 overflow-y-auto">
        {Object.entries(formats).map(([fmt, slides]) => (
          <div key={fmt}>
            <p className="font-mono text-xs text-muted mb-1">{fmt}</p>
            {slides.map((slide, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2">
                {SLOTS.filter((s) => s in slide).map((slot) => (
                  <label key={slot} className="text-xs text-muted">
                    <span className="font-mono">{slot}</span>
                    <input className="field !py-1.5 mt-0.5" value={slide[slot] ?? ""} onChange={(e) => set(fmt, i, slot, e.target.value)} />
                  </label>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn !py-2" onClick={onSave} disabled={busy}>{busy ? "Re-rendering…" : "Save & re-render"}</button>
        <button className="btn-ghost !py-2" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}
