import type { BrandSpec } from "./schema.js";
import { canonical } from "./stringify.js";

export type DiffOp = "added" | "removed" | "changed";

export interface DiffEntry {
  op: DiffOp;
  path: string;
  from?: unknown;
  to?: unknown;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function walk(a: unknown, b: unknown, path: string, out: DiffEntry[]): void {
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const k of keys) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in a)) out.push({ op: "added", path: p, to: b[k] });
      else if (!(k in b)) out.push({ op: "removed", path: p, from: a[k] });
      else walk(a[k], b[k], p, out);
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    // Arrays diff as whole values when short, element-wise when same length.
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    out.push({ op: "changed", path, from: a, to: b });
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    out.push({ op: "changed", path, from: a, to: b });
  }
}

/**
 * Semantic diff between two specs, in canonical key order.
 * meta.version is excluded — a version bump is the consequence of a diff,
 * not part of it.
 */
export function diff(a: BrandSpec, b: BrandSpec): DiffEntry[] {
  const out: DiffEntry[] = [];
  walk(canonical(a), canonical(b), "", out);
  return out.filter((e) => e.path !== "meta.version");
}

function show(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  return JSON.stringify(v);
}

const SECTION_LABELS: Record<string, string> = {
  meta: "Meta",
  identity: "Identity",
  composition: "Composition",
  imagery: "Imagery",
  voice: "Voice",
  judgment: "Judgment",
};

/** Human-readable diff, grouped by top-level section. */
export function formatDiff(entries: DiffEntry[]): string {
  if (entries.length === 0) return "No changes.";
  const bySection = new Map<string, DiffEntry[]>();
  for (const e of entries) {
    const section = e.path.split(".")[0] ?? "";
    const list = bySection.get(section) ?? [];
    list.push(e);
    bySection.set(section, list);
  }
  const lines: string[] = [];
  for (const [section, list] of bySection) {
    lines.push(`${SECTION_LABELS[section] ?? section}:`);
    for (const e of list) {
      const rel = e.path.slice(section.length + 1) || section;
      if (e.op === "changed") lines.push(`  ~ ${rel}: ${show(e.from)} → ${show(e.to)}`);
      else if (e.op === "added") lines.push(`  + ${rel}: ${show(e.to)}`);
      else lines.push(`  - ${rel}: ${show(e.from)}`);
    }
  }
  return lines.join("\n");
}
