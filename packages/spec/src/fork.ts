import type { BrandSpec } from "./schema.js";
import { parse } from "./validate.js";

type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type BrandSpecOverrides = Omit<DeepPartial<BrandSpec>, "meta" | "$schema">;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(override)) {
      out[k] = deepMerge(base[k], v);
    }
    return out;
  }
  // Arrays and scalars replace wholesale — a fork that touches an array owns it.
  return override;
}

/**
 * Fork a parent spec into a child brand: agency master → per-client child.
 * The child starts at version 1 with lineage recorded in meta.forkedFrom.
 */
export function fork(
  parent: BrandSpec,
  name: string,
  overrides: BrandSpecOverrides = {},
): BrandSpec {
  const merged = deepMerge(parent, overrides) as BrandSpec;
  const child = {
    ...merged,
    meta: {
      name,
      version: 1,
      forkedFrom: { name: parent.meta.name, version: parent.meta.version },
      compiledFrom: parent.meta.compiledFrom,
    },
  };
  return parse(child); // forks must be valid specs, not partially-merged soup
}
