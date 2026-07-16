"use client";

import Image from "next/image";
import { ARCHETYPE_INFO, type LayoutArchetype } from "@brandrail/spec";

interface Candidate {
  archetype: string;
  score: number;
  valid?: boolean;
}

function TemplateMiniature({ archetype }: { archetype: LayoutArchetype }) {
  return (
    <span className="relative block aspect-[40/21] overflow-hidden border border-hairline bg-ink" aria-hidden>
      {/* Production-rendered proof: the picker cannot drift from the real template. */}
      <Image
        src={`/proof/templates/${archetype}.png`}
        alt=""
        fill
        sizes="(min-width: 640px) 180px, 46vw"
        loading="lazy"
        className="object-cover"
      />
    </span>
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
