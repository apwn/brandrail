import { z } from "zod";
import { BrandSpecSchema, type BrandSpec } from "./schema.js";

/**
 * Canonical serialization: identical spec content must produce identical bytes.
 * Key order is derived from the Zod schema declaration order; keys not covered
 * by the schema (catchall color roles, forward-compat fields) sort
 * alphabetically after the declared ones. Arrays keep their order — order is
 * meaningful (e.g. archetype preference).
 */

function unwrap(s: z.ZodTypeAny): z.ZodTypeAny {
  let cur = s;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) {
      cur = cur.unwrap();
    } else if (cur instanceof z.ZodDefault) {
      cur = cur._def.innerType;
    } else if (cur instanceof z.ZodEffects) {
      cur = cur._def.schema;
    } else {
      return cur;
    }
  }
}

function canonicalize(value: unknown, schema?: z.ZodTypeAny): unknown {
  if (Array.isArray(value)) {
    const s = schema ? unwrap(schema) : undefined;
    const el = s instanceof z.ZodArray ? (s.element as z.ZodTypeAny) : undefined;
    return value.map((v) => canonicalize(v, el));
  }
  if (value !== null && typeof value === "object") {
    const s = schema ? unwrap(schema) : undefined;
    const shape: Record<string, z.ZodTypeAny> | undefined =
      s instanceof z.ZodObject ? s.shape : undefined;
    const present = Object.keys(value as Record<string, unknown>);
    const declared = shape ? Object.keys(shape).filter((k) => present.includes(k)) : [];
    const extras = present.filter((k) => !shape || !(k in shape)).sort();
    const ordered = shape ? [...declared, ...extras] : extras;
    const out: Record<string, unknown> = {};
    for (const k of ordered) {
      out[k] = canonicalize((value as Record<string, unknown>)[k], shape?.[k]);
    }
    return out;
  }
  return value;
}

/** Canonical JSON string for a BrandSpec (2-space indent, trailing newline). */
export function stringify(spec: BrandSpec): string {
  return JSON.stringify(canonicalize(spec, BrandSpecSchema), null, 2) + "\n";
}

/** Canonicalize without serializing (useful for structural comparison). */
export function canonical(spec: BrandSpec): BrandSpec {
  return canonicalize(spec, BrandSpecSchema) as BrandSpec;
}
