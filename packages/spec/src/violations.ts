import type { FormatId } from "./formats.js";

export type ViolationCode =
  | "font-mismatch"
  | "contrast"
  | "density"
  | "whitespace"
  | "banned-word"
  | "required-word-missing"
  | "emoji-max"
  | "hashtag-max"
  | "cta-style"
  | "logo-misuse"
  | "clearspace"
  | "min-size"
  | "signal-area"
  | "overflow"
  | "unsupported-template-field"
  | "required-brand-asset"
  | "archetype-not-allowed"
  | "raw-design-value";

export interface Violation {
  code: ViolationCode;
  /** BrandSpec path of the rule that was violated, e.g. "voice.banned". */
  rule: string;
  message: string;
  format?: FormatId;
  slide?: number;
  /** The offending value, when it helps the caller fix the input. */
  offending?: string;
}

/**
 * The enforcement contract: renderers and copy validators throw this instead
 * of producing degraded output. A spec violation is a build error, not a
 * warning.
 */
export class SpecViolationError extends Error {
  readonly violations: Violation[];
  readonly name = "SpecViolationError";

  constructor(violations: Violation[]) {
    const lines = violations.map(
      (v) => `  [${v.code}] ${v.message}${v.format ? ` (${v.format}${v.slide !== undefined ? ` slide ${v.slide + 1}` : ""})` : ""}`,
    );
    super(`BrandSpec violations (${violations.length}):\n${lines.join("\n")}`);
    this.violations = violations;
  }

  toJSON(): { name: string; violations: Violation[] } {
    return { name: this.name, violations: this.violations };
  }
}

export function isSpecViolationError(e: unknown): e is SpecViolationError {
  return e instanceof Error && e.name === "SpecViolationError";
}
