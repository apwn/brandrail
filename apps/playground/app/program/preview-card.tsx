"use client";

import type { PreviewPost } from "./workspace";
import { localParts, weekForDate, zonedLocalIso } from "./time";

const FORMAT_LABELS = {
  "ig-carousel": "Instagram carousel",
  "li-image": "LinkedIn image",
  story: "Story / vertical",
  "x-graphic": "Short-post graphic",
  "og-image": "General social image",
} as const;

const TEMPLATE_LABELS = {
  "hero-statement": "Bold statement",
  "split-stat": "Stat spotlight",
  quote: "Quote",
  "list-3": "Three-point list",
  "cta-card": "Call to action",
  "promo-card": "Promotion",
  "feature-grid": "Feature grid",
  testimonial: "Customer proof",
  announcement: "Announcement",
  "before-after": "Before and after",
  "product-showcase": "Product showcase",
  "process-3": "Three-step process",
  "data-trend": "Data trend",
} as const;

interface PreviewCardProps {
  post: PreviewPost;
  timeZone: string;
  startAt?: string;
  endAt?: string;
  horizonWeeks: 1 | 4;
  replacing: boolean;
  onChange: (post: PreviewPost) => void;
  onReplace: () => void;
}

export function PreviewCard({ post, timeZone, startAt, endAt, horizonWeeks, replacing, onChange, onReplace }: PreviewCardProps) {
  const local = localParts(post.scheduledFor, timeZone);
  const updateSlot = (date: string, time: string) => {
    if (!date || !time) return;
    onChange({ ...post, scheduledFor: zonedLocalIso(date, time, timeZone), week: weekForDate(startAt, date, horizonWeeks) });
  };

  return (
    <article className={`border bg-ink/25 p-3 ${post.locked ? "border-green/60" : "border-hairline"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9px] text-muted">WEEK {post.week} · {post.locked ? "LOCKED" : "ADAPTIVE"}</span>
        <div className="flex gap-2">
          <button type="button" className="font-mono text-[9px] text-muted hover:text-bone" onClick={() => onChange({ ...post, locked: !post.locked })}>{post.locked ? "Unlock" : "Lock idea"}</button>
          <button type="button" className="font-mono text-[9px] text-signal hover:text-bone disabled:opacity-50" onClick={onReplace} disabled={replacing || post.locked}>{replacing ? "Replacing…" : "Replace idea"}</button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-[10px] text-muted">DATE<input className="field mt-1 !py-2 text-xs" type="date" min={startAt} max={endAt} value={local.date} onChange={(event) => updateSlot(event.target.value, local.time)} /></label>
        <label className="text-[10px] text-muted">LOCAL TIME<input className="field mt-1 !py-2 text-xs" type="time" value={local.time} onChange={(event) => updateSlot(local.date, event.target.value)} /></label>
      </div>
      <label className="mt-3 block text-[10px] text-muted">IDEA<input className="field mt-1 !py-2 text-sm font-semibold" maxLength={120} value={post.brief} onChange={(event) => onChange({ ...post, brief: event.target.value })} /></label>
      <label className="mt-2 block text-[10px] text-muted">WHY IT BELONGS<textarea className="field mt-1 min-h-16 resize-y !py-2 text-xs" maxLength={200} value={post.rationale} onChange={(event) => onChange({ ...post, rationale: event.target.value })} /></label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-[10px] text-muted">CHANNEL SHAPE<select className="field mt-1 !py-2 text-xs" value={post.format} onChange={(event) => onChange({ ...post, format: event.target.value })}>{Object.entries(FORMAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-[10px] text-muted">VISUAL STYLE<select className="field mt-1 !py-2 text-xs" value={post.archetype} onChange={(event) => onChange({ ...post, archetype: event.target.value })}>{Object.entries(TEMPLATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
    </article>
  );
}
