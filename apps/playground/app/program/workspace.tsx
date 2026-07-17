"use client";

import { useEffect, useState } from "react";
import { trackConversion } from "@/lib/conversion";
import { PreviewCard } from "./preview-card";
import { addDateDays } from "./time";
import { WorkspaceHeader } from "../components/workspace-header";
import { JourneyRail } from "../components/journey-rail";
import { ConceptHelp } from "../components/concept-help";

export type ChannelOption = { id: string; platform: string; handle: string };
type ImportantDate = { date: string; label: string };
export type PreviewPost = { week: number; scheduledFor: string; brief: string; rationale: string; archetype: string; format: string; locked?: boolean };
export type ContentProgram = {
  id: string; brand: string; name: string; objective: string; audience?: string; pillars: string[]; offer?: string; contentContext?: string;
  importantDates: ImportantDate[]; perWeek: number; horizonWeeks: 1 | 4; channelIds: string[]; approvalMode: "review" | "auto";
  timeZone: string; postingTime: string;
  startAt?: string; endAt?: string; paused?: boolean; status: "active" | "paused" | "scheduled" | "complete"; nextRunAt: string | null; lastRunAt?: string;
  plannedPosts?: PreviewPost[];
};
type Draft = Omit<ContentProgram, "id" | "status" | "nextRunAt" | "lastRunAt" | "plannedPosts">;
type Preview = { posts: PreviewPost[]; totalPosts: number; renderStrategy: string };

const DRAFT_KEY = "brandrail:content-program:draft:v1";
const GOAL_STARTERS = [
  { label: "Launch something", objective: "Build demand for our next launch and turn interest into signups", pillars: ["Education", "Product proof", "Launch story"], offer: "Join the launch list" },
  { label: "Own the category", objective: "Become the trusted voice for the problem our product solves", pillars: ["Expert education", "Contrarian perspective", "Customer proof"], offer: "See how we solve it" },
  { label: "Grow a founder brand", objective: "Build a distinct founder voice that earns trust with future customers", pillars: ["Founder perspective", "Lessons learned", "Building in public"], offer: "Follow the journey" },
  { label: "Stay consistently visible", objective: "Keep our brand useful and visible without repeating the same ideas", pillars: ["Practical education", "Behind the scenes", "Proof and progress"], offer: "Start a conversation" },
] as const;

const emptyDraft = (brand: string): Draft => ({
  brand, name: "", objective: "", audience: "", pillars: [], offer: "", contentContext: "", importantDates: [], perWeek: 3, horizonWeeks: 4,
  timeZone: "UTC", postingTime: "10:00",
  channelIds: [], approvalMode: "review", startAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), endAt: "", paused: false,
});

function fromProgram(program: ContentProgram): Draft {
  const { id: _id, status: _status, nextRunAt: _next, lastRunAt: _last, plannedPosts: _plan, ...draft } = program;
  return draft;
}

function fromProgramPlan(program?: ContentProgram): Preview | null {
  if (!program?.plannedPosts?.length) return null;
  return { posts: program.plannedPosts, totalPosts: program.plannedPosts.length, renderStrategy: "rolling-weekly" };
}

function shortDate(value: string, timeZone: string, weekday = false): string {
  return new Date(value).toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric", ...(weekday ? { weekday: "short" as const } : {}) });
}

export function ContentProgramWorkspace({ brands, channels, initialPrograms, canActivate }: { brands: string[]; channels: ChannelOption[]; initialPrograms: ContentProgram[]; canActivate: boolean }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const firstBrand = initialPrograms[0]?.brand ?? brands[0] ?? "";
  const initialProgram = initialPrograms.find((program) => program.brand === firstBrand);
  const [draft, setDraft] = useState<Draft>(() => initialProgram ? fromProgram(initialProgram) : emptyDraft(firstBrand));
  const [preview, setPreview] = useState<Preview | null>(() => fromProgramPlan(initialProgram));
  const [newDate, setNewDate] = useState<ImportantDate>({ date: "", label: "" });
  const [busy, setBusy] = useState<"preview" | "save" | "run" | "state" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRun, setConfirmRun] = useState(false);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const saved = programs.find((program) => program.brand === draft.brand);

  useEffect(() => {
    if (initialProgram) { setRestored(true); return; }
    let hasStoredDraft = false;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { draft?: Draft; preview?: Preview | null };
        if (stored.draft && brands.includes(stored.draft.brand) && typeof stored.draft.objective === "string") {
          hasStoredDraft = true;
          setDraft({ ...emptyDraft(stored.draft.brand), ...stored.draft });
          if (stored.preview?.posts?.length) setPreview(stored.preview);
        }
      }
    } catch { /* A malformed local draft should never block the workspace. */ }
    setRestored(true);
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && !hasStoredDraft) setDraft((current) => ({ ...current, timeZone: detected }));
  }, [brands, initialProgram]);

  useEffect(() => {
    if (!restored || initialProgram) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, preview })); } catch { /* Draft persistence is a convenience, never a blocker. */ }
  }, [draft, initialProgram, preview, restored]);

  function change(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setPreview(null);
    setNotice(null);
    setError(null);
    setConfirmDelete(false);
    setConfirmRun(false);
  }

  function selectBrand(brand: string) {
    const existing = programs.find((program) => program.brand === brand);
    setDraft(existing ? fromProgram(existing) : emptyDraft(brand));
    setPreview(fromProgramPlan(existing)); setNotice(null); setError(null); setConfirmDelete(false); setConfirmRun(false);
  }

  function payload(includePreview = false) {
    return {
      ...draft,
      name: draft.name.trim() || `${draft.brand} content program`,
      objective: draft.objective.trim(),
      audience: draft.audience?.trim() || undefined,
      offer: draft.offer?.trim() || undefined,
      contentContext: draft.contentContext?.trim() || undefined,
      pillars: draft.pillars.filter(Boolean).slice(0, 6),
      importantDates: draft.importantDates.filter((item) => item.date && item.label),
      endAt: draft.endAt || undefined,
      ...(includePreview && preview ? { plannedPosts: preview.posts } : {}),
    };
  }

  async function request(path: string, init: RequestInit) {
    const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "The content program could not be updated.");
    return body;
  }

  async function buildPreview() {
    if (!draft.brand || draft.objective.trim().length < 3) return setError("Add the business outcome before previewing the calendar.");
    setBusy("preview"); setError(null); setNotice("Planning the full horizon without rendering anything…");
    try {
      const body = await request("/api/content-programs/preview", { method: "POST", body: JSON.stringify(payload()) });
      setPreview((body.preview ?? null) as Preview | null);
      setNotice("Calendar planned. Review the ideas, then activate rolling weekly production.");
    } catch (cause) { setError((cause as Error).message); setNotice(null); } finally { setBusy(null); }
  }

  async function save() {
    if (!preview) return setError("Preview the calendar before activating the program.");
    setBusy("save"); setError(null);
    try {
      const body = await request(`/api/content-programs/${encodeURIComponent(draft.brand)}`, { method: "PUT", body: JSON.stringify(payload(true)) });
      const program = body.program as ContentProgram;
      setPrograms((current) => [program, ...current.filter((candidate) => candidate.brand !== program.brand)]);
      setDraft(fromProgram(program));
      setPreview(fromProgramPlan(program));
      setNotice("Content program active. The next week is ready whenever you are.");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(null); }
  }

  async function act(action: "run" | "pause" | "resume") {
    const ranRecently = action === "run" && saved?.lastRunAt && new Date(saved.lastRunAt).getTime() > Date.now() - 6.5 * 24 * 60 * 60_000;
    if (ranRecently && !confirmRun) {
      setConfirmRun(true);
      setNotice("A week was produced recently. Click again to confirm producing another week early.");
      return;
    }
    setBusy(action === "run" ? "run" : "state"); setError(null);
    try {
      const body = await request(`/api/content-programs/${encodeURIComponent(draft.brand)}/${action}`, { method: "POST", body: JSON.stringify({ confirmForce: action === "run" && confirmRun }) });
      const program = body.program as ContentProgram;
      setPrograms((current) => [program, ...current.filter((candidate) => candidate.brand !== program.brand)]);
      setDraft(fromProgram(program));
      setPreview(fromProgramPlan(program));
      setConfirmRun(false);
      setNotice(action === "run" ? `${Number(body.batches ?? 0)} week generated · ${Number(body.rendered ?? 0)} finished assets · ${Number(body.queued ?? 0) ? `${Number(body.queued)} channel deliveries scheduled` : "waiting for review"}` : action === "pause" ? "Future production paused. Existing work is untouched." : "Program resumed.");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(null); }
  }

  function updatePreviewPost(index: number, post: PreviewPost) {
    setPreview((current) => current ? { ...current, posts: current.posts.map((item, itemIndex) => itemIndex === index ? post : item) } : current);
    setNotice("Preview edited. Activate to save these exact ideas and calendar slots.");
  }

  async function replacePreviewPost(index: number) {
    if (!preview) return;
    const current = preview.posts[index];
    if (!current || current.locked) return;
    setReplacing(`${current.scheduledFor}-${index}`); setError(null);
    try {
      const body = await request("/api/content-programs/preview-item", {
        method: "POST",
        body: JSON.stringify({ ...payload(), week: current.week, scheduledFor: current.scheduledFor, existingBriefs: preview.posts.map((post) => post.brief) }),
      });
      updatePreviewPost(index, body.post as PreviewPost);
    } catch (cause) { setError((cause as Error).message); } finally { setReplacing(null); }
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy("state"); setError(null);
    try {
      await request(`/api/content-programs/${encodeURIComponent(draft.brand)}`, { method: "DELETE" });
      setPrograms((current) => current.filter((candidate) => candidate.brand !== draft.brand));
      setDraft(emptyDraft(draft.brand)); setPreview(null); setNotice("Program deleted. Existing assets and calendar items remain intact."); setConfirmDelete(false);
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(null); }
  }

  function exportCalendar() {
    if (!preview) return;
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Week", "Scheduled ISO", "Format", "Template", "Locked", "Brief", "Rationale"],
      ...preview.posts.map((post) => [post.week, post.scheduledFor, post.format, post.archetype, post.locked ? "yes" : "no", post.brief, post.rationale]),
    ];
    const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${draft.brand || "brandrail"}-content-plan.csv`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    trackConversion("content_program_exported", { horizon: draft.horizonWeeks, posts: preview.totalPosts });
  }

  if (!brands.length) return <EmptyBrand />;
  const weeks = Array.from({ length: draft.horizonWeeks }, (_, index) => index + 1);
  const horizonEnd = draft.startAt ? addDateDays(draft.startAt, draft.horizonWeeks * 7 - 1) : draft.endAt;
  const previewEnd = draft.endAt && horizonEnd ? [draft.endAt, horizonEnd].sort()[0] : horizonEnd;

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6 sm:py-12">
      <WorkspaceHeader context="Content plan" active="plan" />
      <JourneyRail active="plan" completed={["brand"]} />
      <section className="mt-8 flex flex-wrap items-center justify-between gap-5 border-b border-hairline pb-6">
        <div><div className="eyebrow text-signal">CONTENT PLAN <ConceptHelp concept="approvalMode" className="ml-1" /></div><h1 className="mt-2 font-display text-[clamp(36px,5vw,56px)] font-bold leading-none tracking-[-.04em]">Keep the next four weeks full.</h1><p className="mt-4 max-w-2xl text-muted">Approve exact calendar slots. Brandrail produces one week at a time, preserves locked ideas and refreshes the adaptive ones with new performance.</p></div>
        {saved && <div className="border border-hairline bg-panel px-4 py-3 text-right"><span className={`font-mono text-[10px] uppercase ${saved.status === "active" ? "text-green" : "text-signal"}`}>● {saved.status}</span><p className="mt-1 font-mono text-[9px] text-muted">next {saved.nextRunAt ? shortDate(saved.nextRunAt, saved.timeZone) : "—"}</p></div>}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
        <section className="border border-hairline bg-panel p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="eyebrow text-signal">01 · STRATEGY</p><h2 className="mt-2 font-display text-2xl font-bold">Brief the outcome once.</h2></div><span className="font-mono text-[9px] text-muted">{preview?.posts.length ?? draft.perWeek * draft.horizonWeeks} planned posts</span></div>
          <div className="mt-6 grid gap-4">
            <label><span className="eyebrow text-bone">BRAND</span><select className="field mt-2" value={draft.brand} onChange={(event) => selectBrand(event.target.value)}>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
            <label><span className="eyebrow text-bone">WHAT SHOULD THE CONTENT ACHIEVE?</span><textarea className="field mt-2 min-h-24 resize-y" maxLength={500} value={draft.objective} onChange={(event) => change({ objective: event.target.value })} placeholder="Build demand for our analytics launch and make the founder a trusted voice" /></label>
            <div><p className="font-mono text-[9px] uppercase tracking-[.08em] text-muted">Start with a goal—or write your own</p><div className="mt-2 flex flex-wrap gap-2">{GOAL_STARTERS.map((starter) => <button key={starter.label} type="button" onClick={() => change({ objective: starter.objective, pillars: [...starter.pillars], offer: starter.offer })} className="border border-hairline px-2.5 py-1.5 text-[11px] text-muted hover:border-signal hover:text-bone">{starter.label}</button>)}</div></div>
            <label><span className="eyebrow text-bone">WHO IS IT FOR?</span><input className="field mt-2" value={draft.audience ?? ""} onChange={(event) => change({ audience: event.target.value })} placeholder="Product leaders at growing SaaS companies" /></label>
            <label><span className="eyebrow text-bone">CONTENT PILLARS <span className="text-muted">· comma separated</span></span><input className="field mt-2" value={draft.pillars.join(", ")} onChange={(event) => change({ pillars: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Education, customer proof, founder perspective" /></label>
            <label><span className="eyebrow text-bone">CURRENT OFFER OR CTA <span className="text-muted">· optional</span></span><input className="field mt-2" value={draft.offer ?? ""} onChange={(event) => change({ offer: event.target.value })} placeholder="Join the launch list" /></label>
            <label><span className="eyebrow text-bone">PRODUCT FACTS & CURRENT CONTEXT</span><textarea className="field mt-2 min-h-28 resize-y" maxLength={2000} value={draft.contentContext ?? ""} onChange={(event) => change({ contentContext: event.target.value })} placeholder="What we sell, key differentiators, verified proof points, customer questions and topics to avoid. Only include claims the content may safely use." /><span className="mt-1 block text-[10px] leading-relaxed text-muted">Concrete facts make the plan specific. Unverified claims will not be invented.</span></label>
          </div>

          <div className="mt-6 border-t border-hairline pt-5"><p className="eyebrow text-bone">IMPORTANT DATES</p><p className="mt-1 text-[10px] text-muted">Dates inside the horizon create locked ideas on that exact day.</p><div className="mt-2 grid gap-2 sm:grid-cols-[145px_1fr_auto]"><input aria-label="Important date" className="field" type="date" min={draft.startAt} max={previewEnd || undefined} value={newDate.date} onChange={(event) => setNewDate((current) => ({ ...current, date: event.target.value }))} /><input aria-label="Important date label" className="field" value={newDate.label} onChange={(event) => setNewDate((current) => ({ ...current, label: event.target.value }))} placeholder="Launch day" /><button type="button" className="btn-ghost !px-3" disabled={!newDate.date || !newDate.label.trim()} onClick={() => { const item = { ...newDate, label: newDate.label.trim() }; if (!draft.importantDates.some((candidate) => candidate.date === item.date && candidate.label === item.label)) change({ importantDates: [...draft.importantDates, item].slice(0, 12) }); setNewDate({ date: "", label: "" }); }}>Add</button></div>{draft.importantDates.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{draft.importantDates.map((item) => <button type="button" key={`${item.date}-${item.label}`} onClick={() => change({ importantDates: draft.importantDates.filter((candidate) => candidate !== item) })} className="border border-hairline px-2.5 py-1.5 font-mono text-[9px] text-muted hover:border-signal hover:text-bone">{item.date} · {item.label} ×</button>)}</div>}</div>

          <div className="mt-6 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2">
            <label><span className="eyebrow text-bone">CADENCE</span><select className="field mt-2" value={draft.perWeek} onChange={(event) => change({ perWeek: Number(event.target.value) })}>{[1, 2, 3, 4, 5, 7].map((value) => <option value={value} key={value}>{value} post{value === 1 ? "" : "s"} / week</option>)}</select></label>
            <fieldset><legend className="eyebrow text-bone">PLANNING HORIZON</legend><div className="mt-2 grid grid-cols-2 border border-hairline p-1">{([1, 4] as const).map((value) => <button type="button" key={value} aria-pressed={draft.horizonWeeks === value} onClick={() => change({ horizonWeeks: value })} className={`px-3 py-2 text-sm ${draft.horizonWeeks === value ? "bg-signal font-semibold text-ink" : "text-muted"}`}>{value === 1 ? "1 week" : "4 weeks"}</button>)}</div></fieldset>
            <label><span className="eyebrow text-bone">START</span><input className="field mt-2" type="date" value={draft.startAt ?? ""} onChange={(event) => change({ startAt: event.target.value })} /></label>
            <label><span className="eyebrow text-bone">END <span className="text-muted">· optional</span></span><input className="field mt-2" type="date" min={draft.startAt} value={draft.endAt ?? ""} onChange={(event) => change({ endAt: event.target.value })} /></label>
            <label><span className="eyebrow text-bone">TIMEZONE</span><input className="field mt-2" list="program-timezones" value={draft.timeZone} onChange={(event) => change({ timeZone: event.target.value })} /><datalist id="program-timezones"><option value="America/Costa_Rica" /><option value="America/New_York" /><option value="America/Chicago" /><option value="America/Denver" /><option value="America/Los_Angeles" /><option value="Europe/London" /><option value="Europe/Berlin" /><option value="Asia/Singapore" /><option value="UTC" /></datalist></label>
            <label><span className="eyebrow text-bone">PREFERRED POSTING TIME</span><input className="field mt-2" type="time" value={draft.postingTime} onChange={(event) => change({ postingTime: event.target.value })} /><span className="mt-1 block text-[10px] text-muted">Used for every generated slot; individual cards can differ.</span></label>
          </div>

          <fieldset className="mt-6 border-t border-hairline pt-5"><legend className="eyebrow text-bone">CHANNELS</legend>{channels.length ? <div className="mt-3 flex flex-wrap gap-2">{channels.map((channel) => { const selected = draft.channelIds.includes(channel.id); return <label key={channel.id} className={`cursor-pointer border px-3 py-2 text-xs ${selected ? "border-signal bg-signal/5 text-bone" : "border-hairline text-muted"}`}><input type="checkbox" className="sr-only" checked={selected} onChange={() => change({ channelIds: selected ? draft.channelIds.filter((id) => id !== channel.id) : [...draft.channelIds, channel.id] })} />{channel.platform} · {channel.handle}</label>; })}</div> : <p className="mt-2 text-sm text-muted">No channels connected yet. You can still produce and review; <a href="/dashboard" className="text-signal">connect publishing later →</a></p>}<p className="mt-2 font-mono text-[9px] text-muted">No selection means all connected channels.</p></fieldset>

          <fieldset className="mt-6 border-t border-hairline pt-5"><legend className="eyebrow text-bone">APPROVAL</legend><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" aria-pressed={draft.approvalMode === "review"} onClick={() => change({ approvalMode: "review" })} className={`border p-3 text-left ${draft.approvalMode === "review" ? "border-green bg-green/5" : "border-hairline"}`}><b className="text-sm">Review every week</b><span className="mt-1 block text-xs text-muted">Recommended. Nothing schedules until you approve it.</span></button><button type="button" disabled={!channels.length} aria-pressed={draft.approvalMode === "auto"} onClick={() => change({ approvalMode: "auto" })} className={`border p-3 text-left disabled:opacity-40 ${draft.approvalMode === "auto" ? "border-signal bg-signal/5" : "border-hairline"}`}><b className="text-sm">Schedule automatically</b><span className="mt-1 block text-xs text-muted">Only after you explicitly choose this mode and channels are connected.</span></button></div></fieldset>

          <button type="button" className="btn mt-6 w-full" onClick={() => void buildPreview()} disabled={busy !== null || draft.objective.trim().length < 3}>{busy === "preview" ? "Planning the horizon…" : `Preview ${draft.horizonWeeks === 4 ? "my next 4 weeks" : "next week"} →`}</button>
          {error && <p role="alert" className="mt-3 border-l-2 border-signal pl-3 text-sm text-signal">{error}</p>}
          {notice && <p role="status" className="mt-3 border-l-2 border-green pl-3 text-sm text-muted">{notice}</p>}
        </section>

        <section className="min-w-0">
          <div className="border border-hairline bg-panel p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow text-signal">02 · CALENDAR PREVIEW</p><h2 className="mt-2 font-display text-2xl font-bold">Plan four weeks. Produce one.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">These dates become the real delivery slots. Edit freely, lock must-keep ideas and replace weak suggestions. Before each production run, unlocked ideas in the next week can learn from performance.</p></div>{preview && <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-[10px] text-green">✓ {preview.posts.length} IDEAS · 0 ASSETS SPENT</span><button type="button" onClick={exportCalendar} className="btn-ghost !px-3 !py-1.5 text-[10px]">Export .csv ↓</button></div>}</div>
            {preview ? <div className="mt-6 grid gap-5">{weeks.map((week) => <section key={week}><div className="mb-2 flex items-center justify-between"><b className="font-mono text-[10px] text-bone">WEEK {String(week).padStart(2, "0")}</b><span className={`font-mono text-[8px] ${week === 1 ? "text-green" : "text-muted"}`}>{week === 1 ? "NEXT TO PRODUCE" : "PLANNED · ADAPTIVE"}</span></div><div className="grid gap-3 sm:grid-cols-2">{preview.posts.map((post, index) => post.week === week ? <PreviewCard key={`${week}-${index}`} post={post} timeZone={draft.timeZone} startAt={draft.startAt} endAt={previewEnd} horizonWeeks={draft.horizonWeeks} replacing={replacing === `${post.scheduledFor}-${index}`} onChange={(next) => updatePreviewPost(index, next)} onReplace={() => void replacePreviewPost(index)} /> : null)}</div></section>)}</div> : <div className="mt-6 grid min-h-[430px] place-items-center border border-dashed border-hairline p-8 text-center"><div><span className="font-display text-6xl text-hairline">4W</span><h3 className="mt-3 font-display text-xl font-bold">Your calendar appears here.</h3><p className="mx-auto mt-2 max-w-sm text-sm text-muted">Add the outcome and cadence, then preview a complete plan before Brandrail saves or renders anything.</p></div></div>}
          </div>

          {preview && <div className="mt-4 border border-signal/50 bg-panel p-5"><p className="eyebrow text-signal">03 · ACTIVATE</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-bold">Approve the strategy, not a black box.</h2><p className="mt-1 text-sm text-muted">{canActivate ? "Activation saves this program. Review mode remains fail-closed every week." : "Your full preview is free and exportable. Studio turns this exact calendar into rolling weekly production, approval and scheduling."}</p></div>{canActivate ? <button type="button" className="btn shrink-0" onClick={() => void save()} disabled={busy !== null}>{busy === "save" ? "Activating…" : saved ? "Update program →" : "Activate program →"}</button> : <a href="/login?plan=studio&return=%2Fprogram" className="btn shrink-0">Activate this plan →</a>}</div></div>}

          {saved && <div className="mt-4 border border-hairline bg-panel p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow text-bone">PROGRAM CONTROL</p><h2 className="mt-2 font-display text-xl font-bold">{saved.name}</h2><p className="mt-1 text-sm text-muted">{saved.perWeek} posts/week · {saved.approvalMode === "review" ? "weekly approval" : "automatic scheduling"} · {saved.postingTime} {saved.timeZone} · last run {saved.lastRunAt ? shortDate(saved.lastRunAt, saved.timeZone) : "never"}</p></div><div className="flex flex-wrap gap-2"><button type="button" className={`btn !px-4 !py-2 text-xs ${confirmRun ? "!border-signal !bg-signal !text-ink" : ""}`} onClick={() => void act("run")} disabled={busy !== null || saved.status === "paused"}>{busy === "run" ? "Producing…" : confirmRun ? "Confirm early production" : "Produce next week now →"}</button><button type="button" className="btn-ghost !px-4 !py-2 text-xs" onClick={() => void act(saved.status === "paused" ? "resume" : "pause")} disabled={busy !== null}>{saved.status === "paused" ? "Resume" : "Pause"}</button><button type="button" className={`btn-ghost !px-4 !py-2 text-xs ${confirmDelete ? "!border-signal !text-signal" : ""}`} onClick={() => void remove()} disabled={busy !== null}>{confirmDelete ? "Confirm delete" : "Delete"}</button></div></div></div>}
        </section>
      </div>
    </main>
  );
}

function EmptyBrand() {
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6"><WorkspaceHeader context="Content plan" active="plan" /><section className="mx-auto max-w-3xl py-16"><p className="eyebrow text-signal">FIRST, BUILD THE RAIL</p><h1 className="mt-3 font-display text-4xl font-bold">A content plan needs one BrandSpec.</h1><p className="mt-4 text-muted">Compile your website first. The plan will use its identity, voice, imagery and brand constraints every week.</p><a href="/#try" className="btn mt-7">Compile my brand →</a></section></main>;
}
