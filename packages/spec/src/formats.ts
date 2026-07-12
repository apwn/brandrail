/**
 * The five V0 output formats. Shared by renderer, SDK, CLI, MCP and
 * playground so a format id means the same thing everywhere.
 */
export interface FormatDef {
  id: string;
  label: string;
  width: number;
  height: number;
  /** Number of images produced (carousels are multi-slide). */
  slides: number;
}

export const FORMATS = {
  "ig-carousel": {
    id: "ig-carousel",
    label: "Instagram carousel",
    width: 1080,
    height: 1350,
    slides: 4, // hook → point → point → CTA
  },
  "li-image": {
    id: "li-image",
    label: "LinkedIn image",
    width: 1200,
    height: 627,
    slides: 1,
  },
  story: {
    id: "story",
    label: "Story",
    width: 1080,
    height: 1920,
    slides: 1,
  },
  "x-graphic": {
    id: "x-graphic",
    label: "X graphic",
    width: 1600,
    height: 900,
    slides: 1,
  },
  "og-image": {
    id: "og-image",
    label: "OG image",
    width: 1200,
    height: 630,
    slides: 1,
  },
} as const satisfies Record<string, FormatDef>;

export type FormatId = keyof typeof FORMATS;

export const ALL_FORMATS = Object.keys(FORMATS) as FormatId[];

export function isFormatId(v: string): v is FormatId {
  return v in FORMATS;
}
