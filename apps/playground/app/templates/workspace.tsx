"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CustomTemplateFamilySchema,
  FORMATS,
  type ArchetypeInfo,
  type CustomTemplateCanvas,
  type CustomTemplateFamily,
  type CustomTemplateLayer,
  type FormatId,
  type LayoutArchetype,
  type TemplateBox,
} from "@brandrail/spec";
import { WorkspaceLockup } from "../components/workspace-lockup";

const FORMAT_LABELS: Record<FormatId, string> = {
  "ig-carousel": "IG portrait",
  "li-image": "LinkedIn",
  story: "Story",
  "x-graphic": "X graphic",
  "og-image": "Open Graph",
};

const fieldClass = "mt-1 w-full border border-hairline bg-ink p-2 text-xs";
const smallFieldClass = "w-full border border-hairline bg-ink px-2 py-1.5 font-mono text-[10px]";
const HISTORY_LIMIT = 50;

interface TemplateWorkspaceProps {
  initialFamilies: CustomTemplateFamily[];
  brands: string[];
  systemTemplates: Record<LayoutArchetype, ArchetypeInfo>;
  owner: boolean;
}

interface PreflightIssue {
  severity: "error" | "warning" | string;
  path: string;
  message: string;
}

interface ApiResult {
  family?: CustomTemplateFamily;
  families?: CustomTemplateFamily[];
  versions?: CustomTemplateFamily[];
  preflight?: { ready: boolean; issues: PreflightIssue[] };
  ready?: boolean;
  issues?: PreflightIssue[];
  latestVersion?: number;
  error?: string;
}

async function api(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({})) as ApiResult;
  if (!res.ok) throw new Error(body.error ?? "Template request failed");
  return body;
}

function familyJson(family: CustomTemplateFamily): string {
  return JSON.stringify(family, null, 2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizedBox(box: TemplateBox, patch: Partial<TemplateBox>): TemplateBox {
  const width = clamp(patch.width ?? box.width, 0.01, 1);
  const height = clamp(patch.height ?? box.height, 0.01, 1);
  const x = clamp(patch.x ?? box.x, 0, 1 - width);
  const y = clamp(patch.y ?? box.y, 0, 1 - height);
  return {
    x: Math.round(x * 10_000) / 10_000,
    y: Math.round(y * 10_000) / 10_000,
    width: Math.round(Math.min(width, 1 - x) * 10_000) / 10_000,
    height: Math.round(Math.min(height, 1 - y) * 10_000) / 10_000,
  };
}

function layerLabel(layer: CustomTemplateLayer): string {
  if (layer.type === "text" || layer.type === "image" || layer.type === "data") return `${layer.slot} · ${layer.type}`;
  return `${layer.id} · ${layer.type}`;
}

function CanvasPreview({
  canvas,
  format,
  selectedLayerId,
  onSelect,
  onMove,
  onInteractionStart,
  onInteractionEnd,
}: {
  canvas?: CustomTemplateCanvas;
  format: FormatId;
  selectedLayerId?: string;
  onSelect: (id: string) => void;
  onMove: (id: string, box: TemplateBox) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; pointerId: number; x: number; y: number; box: TemplateBox; mode: "move" | "resize" } | null>(null);
  const definition = FORMATS[format];
  const artworkHash = /^blob:\/\/([a-f0-9]{64})$/.exec(canvas?.artwork ?? "")?.[1];

  if (!canvas) {
    return <div className="flex min-h-56 items-center justify-center border border-dashed border-hairline text-xs text-muted">No canvas for this format</div>;
  }

  function pointerDown(event: React.PointerEvent<HTMLButtonElement>, layer: CustomTemplateLayer) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: layer.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, box: layer.box, mode: (event.target as HTMLElement).dataset.resize === "true" ? "resize" : "move" };
    onInteractionStart();
    onSelect(layer.id);
  }

  function pointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    const rect = surface.current?.getBoundingClientRect();
    if (!active || active.pointerId !== event.pointerId || !rect) return;
    const dx = (event.clientX - active.x) / rect.width;
    const dy = (event.clientY - active.y) / rect.height;
    onMove(active.id, normalizedBox(active.box, active.mode === "resize"
      ? { width: active.box.width + dx, height: active.box.height + dy }
      : { x: active.box.x + dx, y: active.box.y + dy }));
  }

  function pointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = null;
      onInteractionEnd();
    }
  }

  function keyDown(event: React.KeyboardEvent<HTMLButtonElement>, layer: CustomTemplateLayer) {
    const delta = event.shiftKey ? 0.02 : 0.005;
    const movement = event.key === "ArrowLeft" ? { x: layer.box.x - delta }
      : event.key === "ArrowRight" ? { x: layer.box.x + delta }
      : event.key === "ArrowUp" ? { y: layer.box.y - delta }
      : event.key === "ArrowDown" ? { y: layer.box.y + delta }
      : null;
    if (!movement) return;
    event.preventDefault();
    onInteractionStart();
    onMove(layer.id, normalizedBox(layer.box, movement));
    onInteractionEnd();
  }

  return (
    <div
      ref={surface}
      className="relative mx-auto w-full overflow-hidden border border-hairline bg-bone text-ink shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
      style={{ aspectRatio: `${definition.width}/${definition.height}` }}
      aria-label={`${definition.label} visual template canvas`}
    >
      {artworkHash
        ? <img src={`/api/template-assets/${artworkHash}`} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80" />
        : canvas.artwork && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#ddd,#fff)] opacity-70" aria-label="Locked artwork layer" />}
      {canvas.layers.map((layer) => {
        const style = {
          left: `${layer.box.x * 100}%`,
          top: `${layer.box.y * 100}%`,
          width: `${layer.box.width * 100}%`,
          height: `${layer.box.height * 100}%`,
          touchAction: "none",
        } as const;
        const selected = selectedLayerId === layer.id;
        return (
          <button
            key={layer.id}
            type="button"
            style={style}
            onClick={() => onSelect(layer.id)}
            onPointerDown={(event) => pointerDown(event, layer)}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            onKeyDown={(event) => keyDown(event, layer)}
            aria-label={`Select, move and resize ${layerLabel(layer)}`}
            className={`absolute cursor-move overflow-hidden border text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-signal ${selected ? "z-20 border-signal ring-2 ring-signal/40" : "border-ink/25 hover:border-signal/70"}`}
          >
            {layer.type === "shape" && <span className="block h-full w-full bg-[#ebe5da] opacity-80" />}
            {layer.type === "image" && <span className="flex h-full items-center justify-center bg-ink/10 font-mono text-[8px] uppercase">{layer.slot} image</span>}
            {layer.type === "logo" && <span className="flex h-full items-center px-1 font-display text-[8px] font-bold">BRAND</span>}
            {layer.type === "data" && <span className="flex h-full items-end gap-1 p-1">{[35, 70, 52, 86].map((height) => <i key={height} className="block flex-1 bg-green not-italic" style={{ height: `${height}%` }} />)}</span>}
            {layer.type === "text" && <span className={`flex h-full items-center px-1 text-[8px] ${layer.slot === "hook" ? "font-display font-bold" : "font-body"}`}>{layer.slot} · {layer.maxChars}</span>}
            {selected && <span data-resize="true" className="absolute bottom-0 right-0 flex h-5 w-5 cursor-nwse-resize items-center justify-center bg-signal font-mono text-[10px] font-bold text-ink" aria-hidden>↘</span>}
          </button>
        );
      })}
    </div>
  );
}

function GeometryEditor({ layer, onChange }: { layer: CustomTemplateLayer; onChange: (box: TemplateBox) => void }) {
  const labels: Array<{ key: keyof TemplateBox; label: string }> = [
    { key: "x", label: "X" },
    { key: "y", label: "Y" },
    { key: "width", label: "Width" },
    { key: "height", label: "Height" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {labels.map(({ key, label }) => <label key={key} className="font-mono text-[9px] uppercase text-muted">{label} %<input type="number" min={0} max={100} step={0.5} value={Math.round(layer.box[key] * 1000) / 10} onChange={(event) => onChange(normalizedBox(layer.box, { [key]: Number(event.target.value) / 100 }))} className={smallFieldClass} /></label>)}
    </div>
  );
}

function LayerProperties({ layer, onPatch }: { layer: CustomTemplateLayer; onPatch: (patch: Partial<CustomTemplateLayer>) => void }) {
  if (layer.type === "text") return <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-muted">Typography<select value={layer.typography} onChange={(event) => onPatch({ typography: event.target.value as "display" | "body" })} className={smallFieldClass}><option value="display">Display</option><option value="body">Body</option></select></label><label className="text-[10px] text-muted">Alignment<select value={layer.align} onChange={(event) => onPatch({ align: event.target.value as "left" | "center" | "right" })} className={smallFieldClass}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><label className="text-[10px] text-muted">Text role<input value={layer.colorRole} onChange={(event) => onPatch({ colorRole: event.target.value })} className={smallFieldClass} /></label><label className="text-[10px] text-muted">Surface role<input value={layer.surfaceRole} onChange={(event) => onPatch({ surfaceRole: event.target.value })} className={smallFieldClass} /></label><label className="text-[10px] text-muted">Max lines<input type="number" min={1} max={12} value={layer.maxLines} onChange={(event) => onPatch({ maxLines: Number(event.target.value) })} className={smallFieldClass} /></label><p className="self-end font-mono text-[9px] text-muted">Contract: {layer.maxChars} chars · {layer.required ? "required" : "optional"}</p></div>;
  if (layer.type === "image") return <label className="text-[10px] text-muted">Image fit<select value={layer.fit} onChange={(event) => onPatch({ fit: event.target.value as "cover" | "contain" })} className={smallFieldClass}><option value="cover">Cover</option><option value="contain">Contain</option></select></label>;
  if (layer.type === "logo") return <label className="text-[10px] text-muted">Logo treatment<select value={layer.treatment} onChange={(event) => onPatch({ treatment: event.target.value as "auto" | "primary" | "mark" | "wordmark" })} className={smallFieldClass}><option value="auto">Automatic</option><option value="primary">Primary</option><option value="mark">Mark</option><option value="wordmark">Wordmark</option></select></label>;
  if (layer.type === "shape") return <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-muted">Fill role<input value={layer.fillRole} onChange={(event) => onPatch({ fillRole: event.target.value })} className={smallFieldClass} /></label><label className="text-[10px] text-muted">Border role<input value={layer.borderRole ?? ""} onChange={(event) => onPatch({ borderRole: event.target.value || undefined })} className={smallFieldClass} /></label></div>;
  return <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-muted">Visualization<select value={layer.visualization} onChange={(event) => onPatch({ visualization: event.target.value as "bars" | "ranked" })} className={smallFieldClass}><option value="bars">Bars</option><option value="ranked">Ranked</option></select></label><label className="text-[10px] text-muted">Color role<input value={layer.colorRole} onChange={(event) => onPatch({ colorRole: event.target.value })} className={smallFieldClass} /></label></div>;
}

export function TemplateWorkspace({ initialFamilies, brands, systemTemplates, owner }: TemplateWorkspaceProps) {
  const [families, setFamilies] = useState(initialFamilies);
  const [selectedId, setSelectedId] = useState(initialFamilies[0]?.id ?? "");
  const selected = families.find((family) => family.id === selectedId);
  const [source, setSource] = useState<LayoutArchetype>("hero-statement");
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [scope, setScope] = useState<"workspace" | "brand">("workspace");
  const [brand, setBrand] = useState(brands[0] ?? "");
  const [format, setFormat] = useState<FormatId>("li-image");
  const [json, setJson] = useState(selected ? familyJson(selected) : "");
  const [status, setStatus] = useState<string | null>(null);
  const [issues, setIssues] = useState<PreflightIssue[]>([]);
  const [versions, setVersions] = useState<CustomTemplateFamily[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string>();
  const [autoEligible, setAutoEligible] = useState(false);
  const [renderBrief, setRenderBrief] = useState("Show how the new workflow keeps every decision visible");
  const [renderProof, setRenderProof] = useState<{ id: string; assets: Array<{ filename: string; format: string }> } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const interactionActive = useRef(false);
  const canonicalJson = selected ? familyJson(selected) : "";
  const dirty = Boolean(selected && json !== canonicalJson);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!selectedId) { setVersions([]); return; }
    const controller = new AbortController();
    fetch(`/api/template-families/${encodeURIComponent(selectedId)}/versions`, { signal: controller.signal })
      .then(async (res) => res.ok ? (await res.json() as { versions: CustomTemplateFamily[] }).versions : [])
      .then(setVersions)
      .catch((error: unknown) => { if ((error as Error).name !== "AbortError") setVersions([]); });
    return () => controller.abort();
  }, [selectedId, selected?.version]);

  function parsedFamily(): CustomTemplateFamily {
    let value: unknown;
    try { value = JSON.parse(json); }
    catch { throw new Error("The template JSON is not valid yet"); }
    const parsed = CustomTemplateFamilySchema.safeParse(value);
    if (!parsed.success) throw new Error(`${parsed.error.issues[0]?.path.join(".") || "template"}: ${parsed.error.issues[0]?.message ?? "invalid template"}`);
    return parsed.data;
  }

  function replaceJson(next: string, recordHistory = true) {
    if (next === json) return;
    if (recordHistory) setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), json]);
    setRedoStack([]);
    setJson(next);
  }

  function editFamily(edit: (family: CustomTemplateFamily) => void, recordHistory = true) {
    try {
      const family = parsedFamily();
      edit(family);
      replaceJson(familyJson(family), recordHistory);
      setIssues([]);
      setStatus(null);
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  function choose(family: CustomTemplateFamily, force = false) {
    if (!force && dirty && !window.confirm("Discard the unsaved template changes?")) return;
    setSelectedId(family.id);
    setJson(familyJson(family));
    setSelectedLayerId(undefined);
    setAutoEligible(family.autoEligible);
    setIssues([]);
    setStatus(null);
    setUndoStack([]);
    setRedoStack([]);
    interactionActive.current = false;
  }

  function beginCanvasInteraction() {
    if (interactionActive.current) return;
    interactionActive.current = true;
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), json]);
    setRedoStack([]);
  }

  function endCanvasInteraction() {
    interactionActive.current = false;
  }

  function undo() {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), json]);
    setJson(previous);
    setIssues([]);
    setStatus("Undid the last template edit");
  }

  function redo() {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((current) => current.slice(0, -1));
    setUndoStack((current) => [...current.slice(-(HISTORY_LIMIT - 1)), json]);
    setJson(next);
    setIssues([]);
    setStatus("Restored the template edit");
  }

  async function duplicate() {
    if (!newId || !newName) return;
    setBusy(true); setStatus(null);
    try {
      const result = await api("/api/template-families/duplicate", { method: "POST", body: JSON.stringify({ source: { source: "system", id: source }, id: newId, name: newName, scope, ...(scope === "brand" ? { brand } : {}) }) });
      if (!result.family) throw new Error("No family returned");
      setFamilies((current) => [result.family!, ...current]);
      choose(result.family, true);
      setIssues(result.preflight?.issues ?? []);
      setNewId(""); setNewName(""); setStatus("Editable draft created");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setStatus(null);
    try {
      const result = await api("/api/template-families", { method: "POST", body: JSON.stringify(parsedFamily()) });
      if (!result.family) throw new Error("No family returned");
      setFamilies((current) => [result.family!, ...current.filter((family) => family.id !== result.family!.id)]);
      choose(result.family, true);
      setIssues(result.preflight?.issues ?? []);
      setStatus(`Draft v${result.family.version} saved`);
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function preflight() {
    if (!selectedId) return;
    if (dirty) { setStatus("Save this draft before running server preflight"); return; }
    setBusy(true); setStatus(null);
    try {
      const result = await api(`/api/template-families/${encodeURIComponent(selectedId)}/preflight`, { method: "POST", body: JSON.stringify({ brand: selected?.brand ?? brand }) });
      setIssues(result.issues ?? []);
      setStatus(result.ready ? "Preflight passed" : "Preflight found required changes");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function lifecycle(action: "publish" | "archive") {
    if (!selectedId) return;
    if (dirty) { setStatus("Save this draft before changing its lifecycle"); return; }
    setBusy(true); setStatus(null);
    try {
      const result = await api(`/api/template-families/${encodeURIComponent(selectedId)}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "publish" ? { brand: selected?.brand ?? brand, autoEligible } : {}),
      });
      if (!result.family) throw new Error("No family returned");
      setFamilies((current) => [result.family!, ...current.filter((family) => family.id !== result.family!.id)]);
      choose(result.family, true);
      setIssues(result.preflight?.issues ?? []);
      setStatus(`${action === "publish" ? "Published" : "Archived"} v${result.family.version}`);
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function removeDraftFamily() {
    if (!selected || versions.some((family) => family.status !== "draft")) return;
    if (!window.confirm(`Delete all draft versions of “${selected.name}”?`)) return;
    setBusy(true); setStatus(null);
    try {
      await api(`/api/template-families/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
      const next = families.filter((family) => family.id !== selected.id);
      setFamilies(next);
      setSelectedId(next[0]?.id ?? "");
      setJson(next[0] ? familyJson(next[0]) : "");
      setStatus("Draft family deleted");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setStatus(null);
    try {
      const form = new FormData(); form.set("file", file);
      const res = await fetch("/api/template-assets", { method: "POST", body: form });
      const body = await res.json() as { ref?: string; error?: string };
      if (!res.ok || !body.ref) throw new Error(body.error ?? "Upload failed");
      editFamily((family) => {
        if (!family.formats[format]) throw new Error(`Add a ${format} canvas before attaching artwork`);
        family.formats[format]!.artwork = body.ref;
      });
      setStatus("Locked artwork attached; save the draft to persist it");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  async function renderFamily() {
    if (!selected || !brand || !renderBrief.trim()) return;
    if (dirty) { setStatus("Save this draft before rendering it"); return; }
    setBusy(true); setStatus(null); setRenderProof(null);
    try {
      const res = await fetch("/api/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand, brief: renderBrief.trim(), formats: [format], templateRef: { source: selected.scope, id: selected.id, version: selected.version } }) });
      const body = await res.json() as { id?: string; assets?: Array<{ filename: string; format: string }>; error?: string };
      if (!res.ok || !body.id || !body.assets) throw new Error(body.error ?? "Proof render failed");
      setRenderProof({ id: body.id, assets: body.assets });
      setStatus("Production proof rendered through the full BrandSpec gate");
    } catch (error) { setStatus((error as Error).message); } finally { setBusy(false); }
  }

  function exportJson() {
    try {
      const family = parsedFamily();
      const url = URL.createObjectURL(new Blob([familyJson(family)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `${family.id}.brandrail-template.json`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { setStatus((error as Error).message); }
  }

  async function importJson(file?: File) {
    if (!file) return;
    try {
      const parsed = CustomTemplateFamilySchema.parse(JSON.parse(await file.text()));
      replaceJson(familyJson(parsed));
      setSelectedLayerId(undefined);
      setIssues([]);
      setStatus("Imported locally; review and save as a new draft version");
    } catch { setStatus("That file does not match the strict Brandrail template schema"); }
  }

  function restoreVersion(version: CustomTemplateFamily) {
    if (!selected) return;
    const restored: CustomTemplateFamily = {
      ...structuredClone(version),
      version: selected.version,
      status: "draft",
      autoEligible: false,
      createdAt: selected.createdAt,
      updatedAt: selected.updatedAt,
    };
    replaceJson(familyJson(restored));
    setSelectedLayerId(undefined);
    setStatus(`Loaded v${version.version} into the editor; save to create a new draft version`);
  }

  function updateLayer(id: string, edit: (layer: CustomTemplateLayer) => void, recordHistory = true) {
    editFamily((family) => {
      const layer = family.formats[format]?.layers.find((candidate) => candidate.id === id);
      if (!layer) throw new Error("Layer not found in this canvas");
      edit(layer);
    }, recordHistory);
  }

  function reorderLayer(direction: -1 | 1) {
    if (!selectedLayerId) return;
    editFamily((family) => {
      const layers = family.formats[format]?.layers;
      if (!layers) return;
      const from = layers.findIndex((layer) => layer.id === selectedLayerId);
      const to = clamp(from + direction, 0, layers.length - 1);
      if (from < 0 || from === to) return;
      const [layer] = layers.splice(from, 1);
      layers.splice(to, 0, layer!);
    });
  }

  function addLayer(type: "shape" | "logo") {
    editFamily((family) => {
      const canvas = family.formats[format];
      if (!canvas) throw new Error(`Add a ${format} canvas first`);
      if (type === "logo" && canvas.layers.some((layer) => layer.type === "logo")) throw new Error("This canvas already has a logo layer");
      const taken = new Set(canvas.layers.map((layer) => layer.id));
      let sequence = 1;
      while (taken.has(`shape-${sequence}`)) sequence += 1;
      const id = type === "logo" ? "brand-logo" : `shape-${sequence}`;
      const layer: CustomTemplateLayer = type === "logo"
        ? { id, type: "logo", box: { x: 0.08, y: 0.88, width: 0.22, height: 0.05 }, treatment: "auto" }
        : { id, type: "shape", box: { x: 0.1, y: 0.1, width: 0.3, height: 0.2 }, fillRole: "panel" };
      canvas.layers.push(layer);
      setSelectedLayerId(id);
    });
  }

  function removeSelectedLayer() {
    if (!selectedLayerId) return;
    editFamily((family) => {
      const canvas = family.formats[format];
      const layer = canvas?.layers.find((candidate) => candidate.id === selectedLayerId);
      if (!canvas || !layer) return;
      if (layer.type === "text" || layer.type === "image" || layer.type === "data") throw new Error("Contract-bound layers cannot be removed; duplicate a different base template instead");
      canvas.layers = canvas.layers.filter((candidate) => candidate.id !== selectedLayerId);
      setSelectedLayerId(undefined);
    });
  }

  function addFormatCanvas() {
    editFamily((family) => {
      if (family.formats[format]) return;
      const sourceCanvas = Object.values(family.formats)[0];
      if (!sourceCanvas) throw new Error("Import or duplicate a family with at least one canvas first");
      family.formats[format] = { ...structuredClone(sourceCanvas), artwork: undefined };
    });
    setStatus(`${FORMAT_LABELS[format]} canvas cloned without artwork; review its layout before publishing`);
  }

  function focusIssue(issue: PreflightIssue) {
    const match = /^formats\.([^.]+)(?:\.layers(?:\.(\d+))?)?/.exec(issue.path);
    if (!match || !FORMATS[match[1] as FormatId]) return;
    const issueFormat = match[1] as FormatId;
    setFormat(issueFormat);
    const index = match[2] === undefined ? undefined : Number(match[2]);
    if (index !== undefined) {
      try { setSelectedLayerId(parsedFamily().formats[issueFormat]?.layers[index]?.id); }
      catch { setSelectedLayerId(undefined); }
    } else {
      setSelectedLayerId(undefined);
    }
    setStatus(`Showing ${FORMAT_LABELS[issueFormat]}: ${issue.message}`);
  }

  let preview: CustomTemplateFamily | undefined;
  try { preview = json ? parsedFamily() : undefined; } catch { preview = selected; }
  const previewCanvas = preview?.formats[format];
  const selectedLayer = previewCanvas?.layers.find((layer) => layer.id === selectedLayerId);
  const canDelete = Boolean(selected && versions.length && versions.every((family) => family.status === "draft"));
  const issueCounts = { errors: issues.filter((issue) => issue.severity === "error").length, warnings: issues.filter((issue) => issue.severity === "warning").length };
  const sourceInfo = systemTemplates[source];
  const completedFormats = Object.keys(preview?.formats ?? {}).length;

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4"><WorkspaceLockup context="Visual templates" /><nav className="flex gap-5 font-mono text-[10px] uppercase"><a href="/dashboard">Workspace</a><a href="/">Create</a><a href="/docs">Docs</a></nav></header>
      <section className="mt-8 grid gap-5 xl:grid-cols-[260px_minmax(500px,1fr)_390px]">
        <aside className="panel h-fit p-4 xl:sticky xl:top-5">
          <p className="eyebrow text-signal">Library</p><h1 className="mt-2 font-display text-2xl font-bold">Visual families</h1><p className="mt-2 text-sm text-muted">Built-ins stay locked. Duplicate one to create a safe, versioned visual system.</p>
          <div className="mt-5 max-h-[62vh] space-y-2 overflow-auto pr-1">{families.map((family) => <button key={`${family.id}-${family.version}`} type="button" onClick={() => choose(family)} className={`w-full border p-3 text-left ${selectedId === family.id ? "border-signal bg-signal/5" : "border-hairline hover:border-bone"}`}><span className="block font-display text-sm font-bold">{family.name}</span><span className="mt-1 block font-mono text-[9px] text-muted">{family.scope}:{family.id}@{family.version}</span><span className={`mt-2 inline-block px-1.5 py-0.5 font-mono text-[8px] uppercase ${family.status === "published" ? "bg-green text-ink" : family.status === "archived" ? "bg-hairline text-muted" : "bg-signal text-ink"}`}>{family.status}</span></button>)}</div>
          {!families.length && <p className="mt-5 border border-dashed border-hairline p-4 text-xs text-muted">No custom families yet. Create one from a system template.</p>}
        </aside>

        <section className="space-y-5">
          <div className="panel p-5">
            <p className="eyebrow text-signal">Create family</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs">Start from<select value={source} onChange={(event) => setSource(event.target.value as LayoutArchetype)} className={fieldClass}>{Object.entries(systemTemplates).map(([id, info]) => <option key={id} value={id}>{info.label}</option>)}</select></label>
              <label className="text-xs">Scope<select value={scope} onChange={(event) => setScope(event.target.value as "workspace" | "brand")} className={fieldClass}><option value="workspace">Workspace</option><option value="brand" disabled={!brands.length}>Brand</option></select></label>
              <div className="grid gap-3 border border-hairline bg-ink p-3 sm:col-span-2 sm:grid-cols-[190px_1fr] sm:items-center">
                <div className="relative aspect-[40/21] overflow-hidden border border-hairline bg-bone"><Image src={`/proof/templates/${source}.png`} alt={`${sourceInfo.label} built-in template preview`} fill sizes="190px" className="object-cover" /></div>
                <div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-signal">{source}</span><h2 className="mt-1 font-display text-lg font-bold">{sourceInfo.label}</h2><p className="mt-1 text-xs leading-relaxed text-muted">{sourceInfo.description}</p><p className="mt-2 font-mono text-[8px] uppercase text-muted">Best for · {sourceInfo.bestFor}</p><p className="mt-2 text-[10px] text-bone">Editable · {Object.values(sourceInfo.slots).map((slot) => slot.label).join(" · ")}</p></div>
              </div>
              <label className="text-xs">Family ID<input value={newId} onChange={(event) => setNewId(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={fieldClass} placeholder="launch-card" /></label>
              <label className="text-xs">Display name<input value={newName} onChange={(event) => setNewName(event.target.value)} className={fieldClass} placeholder="Launch card" /></label>
              {scope === "brand" && <label className="text-xs sm:col-span-2">Brand<select value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass}>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>}
            </div>
            <button type="button" disabled={!owner || busy || !newId || !newName || (scope === "brand" && !brand)} onClick={() => void duplicate()} className="btn mt-4">Create editable draft</button>
            {!owner && <p className="mt-2 text-xs text-muted">Reviewers can inspect and render existing families; only workspace owners can change them.</p>}
          </div>

          {selected && <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow text-signal">Visual editor</p><h2 className="mt-1 font-display text-xl font-bold">{preview?.name ?? selected.name}</h2><p className="mt-1 font-mono text-[9px] text-muted">{selected.scope}:{selected.id}@{selected.version} · {selected.status}{dirty ? " · unsaved changes" : ""}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!undoStack.length} onClick={undo} className="btn-ghost" title="Undo the last visual edit">Undo</button><button type="button" disabled={!redoStack.length} onClick={redo} className="btn-ghost" title="Redo the reverted edit">Redo</button>{dirty && <button type="button" onClick={() => choose(selected, true)} className="btn-ghost">Reset changes</button>}<label className="btn-ghost cursor-pointer">Import JSON<input className="sr-only" type="file" accept="application/json" onChange={(event) => void importJson(event.target.files?.[0])} /></label><button type="button" onClick={exportJson} className="btn-ghost">Export JSON</button></div></div>
            <div className="mt-5 flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="template-format">Canvas format</label><select id="template-format" value={format} onChange={(event) => { setFormat(event.target.value as FormatId); setSelectedLayerId(undefined); }} className="border border-hairline bg-ink p-2 font-mono text-[9px]">{Object.entries(FORMAT_LABELS).map(([id, label]) => <option key={id} value={id}>{label} · {FORMATS[id as FormatId].width}×{FORMATS[id as FormatId].height}</option>)}</select><span className="font-mono text-[9px] text-muted">{completedFormats}/{Object.keys(FORMAT_LABELS).length} canvases</span><button type="button" onClick={() => addLayer("shape")} disabled={!previewCanvas} className="btn-ghost">Add shape</button><button type="button" onClick={() => addLayer("logo")} disabled={!previewCanvas || previewCanvas.layers.some((layer) => layer.type === "logo")} className="btn-ghost">Add logo</button>{!previewCanvas && <button type="button" onClick={addFormatCanvas} className="btn">Add this canvas</button>}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label="Template format readiness">{(Object.keys(FORMAT_LABELS) as FormatId[]).map((id) => { const exists = Boolean(preview?.formats[id]); const active = id === format; return <button key={id} type="button" aria-pressed={active} onClick={() => { setFormat(id); setSelectedLayerId(undefined); }} className={`border px-2 py-2 text-left font-mono text-[8px] uppercase ${active ? "border-signal bg-signal/5" : "border-hairline"}`}><span className={exists ? "text-green" : "text-muted"}>{exists ? "●" : "○"}</span> {FORMAT_LABELS[id]}</button>; })}</div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(240px,1fr)_220px] 2xl:grid-cols-[minmax(300px,1fr)_280px]">
              <CanvasPreview canvas={previewCanvas} format={format} selectedLayerId={selectedLayerId} onSelect={setSelectedLayerId} onMove={(id, box) => updateLayer(id, (layer) => { layer.box = box; }, false)} onInteractionStart={beginCanvasInteraction} onInteractionEnd={endCanvasInteraction} />
              <div className="border border-hairline p-3"><p className="eyebrow">Layer inspector</p>{selectedLayer ? <div className="mt-3 space-y-4"><div><p className="font-display text-sm font-bold">{layerLabel(selectedLayer)}</p><p className="font-mono text-[9px] text-muted">{selectedLayer.id}</p></div><GeometryEditor layer={selectedLayer} onChange={(box) => updateLayer(selectedLayer.id, (layer) => { layer.box = box; })} /><LayerProperties layer={selectedLayer} onPatch={(patch) => updateLayer(selectedLayer.id, (layer) => Object.assign(layer, patch))} /><div className="flex flex-wrap gap-2"><button type="button" className="btn-ghost !px-3 !py-2" onClick={() => reorderLayer(-1)}>Send back</button><button type="button" className="btn-ghost !px-3 !py-2" onClick={() => reorderLayer(1)}>Bring forward</button><button type="button" className="btn-ghost !px-3 !py-2" onClick={removeSelectedLayer}>Remove</button></div></div> : <p className="mt-3 text-xs text-muted">Select a layer on the canvas. Drag to position it, then use exact percentage controls here.</p>}</div>
            </div>
            <div className="mt-4 grid gap-3 border border-hairline p-3 sm:grid-cols-[180px_1fr] sm:items-end"><label className="text-[10px] text-muted">Canvas background role<input value={previewCanvas?.backgroundRole ?? ""} disabled={!previewCanvas} onChange={(event) => editFamily((family) => { if (family.formats[format]) family.formats[format]!.backgroundRole = event.target.value; })} className={smallFieldClass} /></label><div className="flex flex-wrap items-center gap-2"><label className="btn-ghost cursor-pointer">Upload locked artwork<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => void upload(event.target.files?.[0])} /></label>{previewCanvas?.artwork && <button type="button" className="btn-ghost" onClick={() => editFamily((family) => { if (family.formats[format]) delete family.formats[format]!.artwork; })}>Remove artwork</button>}<span className="font-mono text-[9px] text-muted">Raster ≤12 MB / 40 MP · static SVG ≤2 MB</span></div></div>
            <details className="mt-5 border-t border-hairline pt-4"><summary className="cursor-pointer font-mono text-[10px] uppercase text-muted">Advanced JSON editor</summary><p className="mt-3 text-sm text-muted">The schema is strict: HTML, CSS, scripts, remote assets, and unknown fields are rejected.</p><textarea aria-label="Template family JSON" spellCheck={false} value={json} onChange={(event) => setJson(event.target.value)} className="mt-3 min-h-[380px] w-full border border-hairline bg-black/20 p-3 font-mono text-[11px] leading-5" /></details>
            <div className="mt-5 flex flex-wrap items-center gap-2"><button type="button" disabled={!owner || busy || !dirty} onClick={() => void save()} className="btn">Save new draft version</button><button type="button" disabled={busy || dirty} onClick={() => void preflight()} className="btn-ghost" title={dirty ? "Save first" : undefined}>Run preflight</button><button type="button" disabled={!owner || busy || dirty || !brand} onClick={() => void lifecycle("publish")} className="btn-ghost">{selected.status === "published" ? "Publish settings version" : "Publish"}</button><button type="button" disabled={!owner || busy || dirty || selected.status === "archived"} onClick={() => void lifecycle("archive")} className="btn-ghost">Archive</button>{canDelete && <button type="button" disabled={!owner || busy} onClick={() => void removeDraftFamily()} className="btn-ghost">Delete drafts</button>}</div>
            <label className="mt-4 flex items-start gap-3 border border-hairline p-3 text-xs"><input type="checkbox" checked={autoEligible} onChange={(event) => setAutoEligible(event.target.checked)} className="mt-0.5 accent-[#ff4d00]" /><span><b className="block font-display">Allow automatic planning</b><span className="text-muted">Requires all five format canvases and a clean preflight. Leave off for deliberate, manually selected campaign templates.</span></span></label>
          </div>}

          {selected && <div className="panel p-5"><div className="flex items-center justify-between"><div><p className="eyebrow text-signal">Immutable history</p><h3 className="mt-1 font-display text-lg font-bold">Version timeline</h3></div><span className="font-mono text-[9px] text-muted">{versions.length} version{versions.length === 1 ? "" : "s"}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{versions.map((version) => <div key={version.version} className="flex items-center justify-between border border-hairline p-3"><div><b className="font-mono text-xs">v{version.version}</b><span className="ml-2 font-mono text-[8px] uppercase text-muted">{version.status}</span><time className="mt-1 block font-mono text-[8px] text-muted">{new Date(version.updatedAt).toLocaleString()}</time></div><button type="button" disabled={version.version === selected.version} onClick={() => restoreVersion(version)} className="btn-ghost !px-3 !py-2">Restore</button></div>)}</div></div>}
        </section>

        <aside className="panel h-fit p-5 xl:sticky xl:top-5">
          <div className="flex items-center justify-between"><p className="eyebrow text-signal">Quality gate</p>{issues.length > 0 && <span className="font-mono text-[9px] text-muted">{issueCounts.errors} errors · {issueCounts.warnings} warnings</span>}</div>
          <p className="mt-3 text-sm text-muted">Preflight checks strict contracts, brand color roles, contrast, minimum geometry, frozen artwork, and suspicious layer overlap.</p>
          {status && <p role="status" aria-live="polite" className="mt-4 border border-hairline p-3 text-xs">{busy ? "Working… " : ""}{status}</p>}
          {issues.length > 0 ? <ul className="mt-4 max-h-72 space-y-2 overflow-auto">{issues.map((issue, index) => <li key={`${issue.path}-${issue.message}-${index}`}><button type="button" onClick={() => focusIssue(issue)} className={`w-full border p-2 text-left text-xs hover:bg-white/[.03] ${issue.severity === "error" ? "border-signal/60" : "border-yellow-500/50"}`}><b className={`font-mono text-[9px] uppercase ${issue.severity === "error" ? "text-signal" : "text-yellow-400"}`}>{issue.severity}</b><span className="mt-1 block break-words">{issue.path}: {issue.message}</span><span className="mt-2 block font-mono text-[8px] uppercase text-muted">Show affected canvas →</span></button></li>)}</ul> : <div className="mt-4 border border-dashed border-hairline p-4 text-xs text-muted">Run preflight after saving. A clean gate is required before publishing.</div>}
          {selected && <div className="mt-6 border-t border-hairline pt-5"><p className="eyebrow text-bone">Production proof</p><label className="mt-3 block text-xs">Validate against brand<select value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass}>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>{!brands.length && <p className="mt-2 text-xs text-signal">Compile a brand before preflight, publishing, or production rendering.</p>}<textarea value={renderBrief} onChange={(event) => setRenderBrief(event.target.value)} className="mt-3 min-h-20 w-full border border-hairline bg-ink p-2 text-xs" aria-label="Proof render brief" /><button type="button" disabled={busy || dirty || !brand || selected.status === "archived" || !previewCanvas} onClick={() => void renderFamily()} className="btn mt-2 w-full">Render this version</button>{renderProof?.assets.map((asset) => <img key={asset.filename} src={`/api/asset/${encodeURIComponent(renderProof.id)}/${encodeURIComponent(asset.filename)}`} alt={`${selected.name} production proof`} className="mt-3 w-full border border-hairline bg-bone" />)}</div>}
        </aside>
      </section>
    </main>
  );
}
