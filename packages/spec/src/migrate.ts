import { SPEC_SCHEMA_URL } from "./schema.js";
import type { BrandSpec } from "./schema.js";
import { parse } from "./validate.js";

export interface MigrationResult {
  spec: BrandSpec;
  fromSchema: string;
  migrated: boolean;
}

/**
 * Versioned schema upgrades. v0.1 is the only schema; when v0.2 lands,
 * add an upgrader keyed by the old $schema URL. Unknown schemas are a
 * hard error — silently guessing at a brand definition is how slop happens.
 */
const UPGRADERS: Record<string, (doc: Record<string, unknown>) => Record<string, unknown>> = {
  // "https://brandrail.dev/spec/v0.2.json": (doc) => ...   // V1
};

export function migrate(doc: unknown): MigrationResult {
  if (doc === null || typeof doc !== "object") {
    throw new Error("migrate: document is not an object");
  }
  let current = doc as Record<string, unknown>;
  const fromSchema = String(current.$schema ?? SPEC_SCHEMA_URL);
  let migrated = false;

  let schema = fromSchema;
  while (schema !== SPEC_SCHEMA_URL) {
    const up = UPGRADERS[schema];
    if (!up) throw new Error(`migrate: unknown BrandSpec schema "${schema}"`);
    current = up(current);
    schema = String(current.$schema);
    migrated = true;
  }

  return { spec: parse(current), fromSchema, migrated };
}
