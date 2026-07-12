/**
 * Color math shared by the validator, renderer and compiler.
 * WCAG 2.x relative luminance and contrast ratio.
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex);
  if (!m) throw new Error(`invalid hex color: ${hex}`);
  const v = parseInt(m[1]!, 16);
  return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick whichever of the candidates has the highest contrast against bg. */
export function bestContrast(bg: string, candidates: string[]): string {
  if (candidates.length === 0) throw new Error("bestContrast: no candidates");
  return candidates.reduce((best, c) =>
    contrastRatio(bg, c) > contrastRatio(bg, best) ? c : best,
  );
}

export function normalizeHex(hex: string): string {
  return hex.toUpperCase();
}
