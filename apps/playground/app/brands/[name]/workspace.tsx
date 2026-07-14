"use client";

import type { BrandSpec } from "@brandrail/spec";
import { useState } from "react";

type SavedRender = { id: string; createdAt: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string }> } };

export function BrandWorkspace({ initialSpec, owner, genUsed, genLimit, genConfigured, renders }: { initialSpec: BrandSpec; owner: boolean; genUsed: number; genLimit: number; genConfigured: boolean; renders: SavedRender[] }) {
  const [spec, setSpec] = useState(initialSpec);
  const [colors, setColors] = useState(spec.identity.colors.roles);
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveColors() {
    setBusy("save"); setMessage(null);
    const res = await fetch("/api/spec", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand: spec.meta.name, patch: { identity: { colors: { roles: colors } } } }) });
    const body = await res.json() as { spec?: BrandSpec; error?: string };
    if (res.ok && body.spec) { setSpec(body.spec); setMessage(`Saved as v${body.spec.meta.version}. Future renders now use these roles.`); }
    else setMessage(body.error ?? "Could not save changes");
    setBusy(null);
  }

  async function generate() {
    setBusy("generate"); setMessage(null);
    const res = await fetch("/api/background", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand: spec.meta.name, subject }) });
    const body = await res.json() as { version?: number; error?: string };
    if (res.ok) { setMessage(`Background generated and pinned to BrandSpec v${body.version}. It is ready for deterministic reuse.`); setSubject(""); }
    else setMessage(body.error ?? "Could not generate the background");
    setBusy(null);
  }

  const roles = Object.entries(colors).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-5"><div><a href="/dashboard" className="eyebrow hover:text-bone">← WORKSPACE</a><h1 className="font-display text-4xl font-bold mt-4">{spec.meta.name}</h1><p className="font-mono text-xs text-muted mt-2">BrandSpec v{spec.meta.version} · persistent and portable</p></div><a href={`/api/spec?brand=${encodeURIComponent(spec.meta.name)}`} className="btn-ghost">Export BrandSpec ↓</a></header>
      {message && <div className="panel border-signal/40 px-4 py-3 mt-7 text-sm">{message}</div>}
      <section className="grid gap-4 mt-10 lg:grid-cols-[1.2fr_.8fr]">
        <div className="panel p-6"><p className="eyebrow text-bone">COLOR ROLES</p><p className="text-muted text-sm mt-2">Edit the operating system, not every asset. Saving creates a version you can recover and export.</p><div className="grid sm:grid-cols-2 gap-4 mt-6">{roles.map(([role, value]) => <label key={role} className="border border-hairline p-3"><span className="eyebrow block mb-2">{role}</span><span className="flex items-center gap-3"><input type="color" value={value} onChange={(e) => setColors({ ...colors, [role]: e.target.value })} className="h-9 w-9 bg-transparent" disabled={!owner} /><input value={value} onChange={(e) => setColors({ ...colors, [role]: e.target.value })} className="field !py-2 font-mono" disabled={!owner} /></span></label>)}</div>{owner && <button onClick={saveColors} disabled={busy === "save"} className="btn mt-5">{busy === "save" ? "Saving…" : "Save new BrandSpec version"}</button>}</div>
        <div className="panel p-6"><p className="eyebrow text-bone">GENERATIVE IMAGE RAIL</p><div className="font-display text-3xl font-bold mt-3">{genUsed} <span className="font-mono text-sm text-muted">/ {genLimit}</span></div><p className="text-muted text-sm mt-3">Describe a scene. Brandrail generates imagery only, pins it into the spec, then every layout remains deterministic.</p>{owner && genConfigured ? <><textarea className="field mt-5 min-h-24" placeholder="e.g. sunlit studio desk with warm stone textures, no text or logos" value={subject} onChange={(e) => setSubject(e.target.value)} /><button onClick={generate} disabled={!subject.trim() || busy === "generate"} className="btn w-full mt-3">{busy === "generate" ? "Generating…" : "Generate and pin background"}</button></> : <p className="font-mono text-xs text-muted mt-4">{owner ? "Image generation is not configured on this instance. Add FAL_KEY to enable it." : "Only the workspace owner can change the BrandSpec."}</p>}</div>
      </section>
      <section className="mt-10"><p className="eyebrow text-bone mb-3">ASSET HISTORY ({renders.length})</p>{renders.length === 0 ? <p className="text-muted text-sm">No saved assets for this brand yet.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{renders.map((render) => { const cover = render.manifest.assets[0]; return <article className="panel overflow-hidden" key={render.id}>{cover && <img className="aspect-video w-full object-cover border-b border-hairline" src={`/api/asset/${encodeURIComponent(render.id)}/${encodeURIComponent(cover.filename)}`} alt={render.manifest.brief} />}<div className="p-4"><p className="text-sm line-clamp-2">{render.manifest.brief}</p><p className="font-mono text-[10px] text-muted mt-2">{render.createdAt.slice(0,10)} · {render.manifest.assets.length} files</p></div></article>; })}</div>}</section>
    </main>
  );
}
