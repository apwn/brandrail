"use client";

import { ARCHETYPE_INFO, type LayoutArchetype } from "@brandrail/spec";

interface Candidate {
  archetype: string;
  score: number;
  valid?: boolean;
}

function TemplateMiniature({ archetype }: { archetype: LayoutArchetype }) {
  const line = "h-1 rounded-full bg-bone/80";
  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-ink p-2" aria-hidden>
      <span className="absolute left-2 top-2 h-1 w-4 bg-signal" />
      {archetype === "hero-statement" && <><span className={`absolute bottom-7 left-2 w-3/4 ${line}`} /><span className={`absolute bottom-4 left-2 w-1/2 ${line}`} /></>}
      {archetype === "cta-card" && <><span className={`absolute left-2 top-1/2 w-4/5 ${line}`} /><span className="absolute bottom-2 left-2 h-3 w-8 bg-signal" /></>}
      {archetype === "split-stat" && <><span className="absolute bottom-4 left-2 font-display text-2xl font-bold text-bone">4×</span><span className="absolute bottom-3 right-2 h-7 w-px bg-signal" /></>}
      {archetype === "quote" && <><span className="absolute left-2 top-4 font-serif text-2xl text-signal">“</span><span className={`absolute bottom-7 left-5 w-3/4 ${line}`} /><span className="absolute bottom-3 left-5 h-1 w-1/3 rounded-full bg-muted" /></>}
      {archetype === "list-3" && <div className="absolute inset-x-2 bottom-2 space-y-1.5">{[0, 1, 2].map((item) => <span key={item} className="flex items-center gap-1.5"><i className="h-2 w-2 bg-signal" /><i className="h-1 flex-1 rounded-full bg-bone/75" /></span>)}</div>}
      {archetype === "promo-card" && <><span className="absolute inset-y-0 right-0 w-2/5 bg-muted/35" /><span className="absolute right-1 top-2 bg-signal px-1 font-mono text-[5px] text-ink">-30%</span><span className={`absolute bottom-5 left-2 w-2/5 ${line}`} /></>}
      {archetype === "feature-grid" && <div className="absolute inset-x-2 bottom-2 grid grid-cols-2 gap-1">{[0, 1, 2, 3].map((item) => <span key={item} className="h-5 border border-hairline bg-panel" />)}</div>}
      {archetype === "testimonial" && <><span className={`absolute left-2 top-1/2 w-3/4 ${line}`} /><span className="absolute bottom-2 left-2 h-3 w-3 rounded-full bg-muted" /><span className="absolute bottom-3 left-7 h-1 w-8 rounded-full bg-muted" /></>}
      {archetype === "announcement" && <><span className="absolute right-2 top-0 bg-signal px-1.5 py-1 font-mono text-[5px] text-ink">JUN 14</span><span className={`absolute bottom-6 left-2 w-3/4 ${line}`} /><span className="absolute bottom-3 left-2 h-1 w-1/2 rounded-full bg-muted" /></>}
      {archetype === "before-after" && <><span className="absolute inset-y-0 left-0 w-1/2 bg-muted/25" /><span className="absolute inset-y-0 right-0 w-1/2 bg-panel" /><span className="absolute bottom-2 left-2 bg-bone px-1 font-mono text-[5px] text-ink">AFTER</span><span className="absolute bottom-2 right-2 border border-bone px-1 font-mono text-[5px] text-bone">BEFORE</span></>}
    </div>
  );
}

export function TemplatePicker({
  selected,
  allowed,
  candidates = [],
  allowAuto = false,
  photoCount,
  onSelect,
}: {
  selected: string | null;
  allowed: readonly string[];
  candidates?: Candidate[];
  allowAuto?: boolean;
  photoCount?: number;
  onSelect: (archetype: string | null) => void;
}) {
  const scores = new Map(candidates.filter((candidate) => candidate.valid !== false).map((candidate) => [candidate.archetype, candidate.score]));
  const templates = (Object.keys(ARCHETYPE_INFO) as LayoutArchetype[]).filter((archetype) => allowed.includes(archetype));

  return (
    <div role="group" aria-label="Template library" className="grid max-h-[430px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
      {allowAuto && (
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={`border p-2 text-left transition-colors ${selected === null ? "border-signal bg-signal/5" : "border-hairline hover:border-muted"}`}
        >
          <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-ink p-2" aria-hidden>
            <span className="absolute left-2 top-2 h-1 w-4 bg-green" />
            <span className="absolute bottom-3 left-2 h-7 w-1/4 border border-muted" />
            <span className="absolute bottom-3 left-[38%] h-10 w-1/4 border border-muted" />
            <span className="absolute bottom-3 right-2 h-5 w-1/4 border border-muted" />
          </div>
          <span className="mt-2 block text-xs font-semibold text-bone">Auto for this format</span>
          <span className="mt-1 block font-mono text-[8px] leading-relaxed text-green">Agent chooses best fit</span>
        </button>
      )}
      {templates.map((archetype) => {
        const info = ARCHETYPE_INFO[archetype];
        const score = scores.get(archetype);
        const requiredPhotos = Object.values(info.mediaSlots ?? {}).filter((slot) => slot.required).length;
        const unavailable = photoCount !== undefined && photoCount < requiredPhotos;
        return (
          <button
            key={archetype}
            type="button"
            aria-pressed={selected === archetype}
            disabled={unavailable}
            onClick={() => onSelect(archetype)}
            className={`border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selected === archetype ? "border-signal bg-signal/5" : "border-hairline hover:border-muted"}`}
          >
            <TemplateMiniature archetype={archetype} />
            <span className="mt-2 flex items-start justify-between gap-1 text-xs font-semibold text-bone"><span>{info.label}</span>{score !== undefined && <span className="font-mono text-[8px] text-green">{score}</span>}</span>
            <span className={`mt-1 block font-mono text-[8px] leading-relaxed ${unavailable ? "text-signal" : "text-muted"}`}>{unavailable ? `Needs ${requiredPhotos} approved ${requiredPhotos === 1 ? "photo" : "photos"}` : info.optIn ? "Needs supplied proof" : info.needsPhotos ? "Uses brand photos" : "Brand-safe layout"}</span>
          </button>
        );
      })}
    </div>
  );
}
