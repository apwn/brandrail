import { BrandSpecSchema, type BrandSpec } from "./schema.js";
import { contrastRatio, normalizeHex } from "./color.js";

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export type ValidationResult =
  | { ok: true; spec: BrandSpec; warnings: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Structural validation (Zod) plus semantic invariants the schema alone
 * can't express. Warnings don't fail validation — they surface in the
 * playground as "review this".
 */
export function validate(input: unknown): ValidationResult {
  const parsed = BrandSpecSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        severity: "error" as const,
      })),
    };
  }

  const spec = parsed.data;
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const roles = spec.identity.colors.roles;
  const minContrast = spec.identity.colors.usage.minContrast;

  // Normalize hex casing so canonical bytes are stable regardless of source.
  for (const [k, v] of Object.entries(roles)) {
    if (v) (roles as Record<string, string>)[k] = normalizeHex(v);
  }

  const inkOnPaper = contrastRatio(roles.ink, roles.paper);
  if (inkOnPaper < minContrast) {
    issues.push({
      path: "identity.colors.roles",
      message: `ink on paper contrast is ${inkOnPaper.toFixed(2)}:1, below minContrast ${minContrast}:1 — this brand cannot render legible text`,
      severity: "error",
    });
  }

  const signalOnPaper = contrastRatio(roles.signal, roles.paper);
  const signalOnInk = contrastRatio(roles.signal, roles.ink);
  if (Math.max(signalOnPaper, signalOnInk) < 3) {
    warnings.push({
      path: "identity.colors.roles.signal",
      message: `signal color has low contrast on both ink (${signalOnInk.toFixed(2)}:1) and paper (${signalOnPaper.toFixed(2)}:1); accents will be reserved for non-text use`,
      severity: "warning",
    });
  }

  for (const role of spec.identity.logo.allowedOn) {
    if (!(role in roles)) {
      issues.push({
        path: "identity.logo.allowedOn",
        message: `logo.allowedOn references unknown color role "${role}"`,
        severity: "error",
      });
    }
  }

  const bannedLower = spec.voice.banned.map((w) => w.toLowerCase());
  for (const req of spec.voice.required) {
    if (bannedLower.includes(req.toLowerCase())) {
      issues.push({
        path: "voice.required",
        message: `"${req}" is both required and banned`,
        severity: "error",
      });
    }
  }

  if (issues.length > 0) return { ok: false, issues: [...issues, ...warnings] };
  return { ok: true, spec, warnings };
}

/** Validate and throw on failure. */
export function parse(input: unknown): BrandSpec {
  const result = validate(input);
  if (!result.ok) {
    const lines = result.issues.map((i) => `  ${i.path}: ${i.message}`).join("\n");
    throw new Error(`invalid BrandSpec:\n${lines}`);
  }
  return result.spec;
}
