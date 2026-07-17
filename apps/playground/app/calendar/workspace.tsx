"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel, SavedRender, ScheduledPost } from "./page";
import { AuthorityBadge } from "./authority-badge";
import { WorkspaceHeader } from "../components/workspace-header";
import { JourneyRail } from "../components/journey-rail";

const WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const platformLabel: Record<string, string> = { linkedin: "in", meta: "fb", instagram: "ig", x: "x", tiktok: "tt", bluesky: "bs", mastodon: "md" };
const authorityMark: Record<NonNullable<ScheduledPost["source"]>, string> = { "human-approved": "✓", "agent-confirmed": "AG", autopilot: "AUTO", manual: "M" };

export function CalendarWorkspace({ initialPosts, channels, renders }: { initialPosts: ScheduledPost[]; channels: Channel[]; renders: SavedRender[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<ScheduledPost | null>(null);
  const [composer, setComposer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => monthGrid(month), [month]);
  const active = posts.filter((post) => post.status !== "cancelled");
  async function move(post: ScheduledPost, day: Date) {
    if (post.status !== "scheduled") return;
    const old = new Date(post.scheduledAt);
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), old.getHours(), old.getMinutes());
    if (next.getTime() <= Date.now()) return setError("Choose a future day for scheduled content.");
    const res = await fetch("/api/scheduled", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: post.id, scheduledAt: next.toISOString() }) });
    const body = await res.json() as { post?: ScheduledPost; error?: string };
    if (!res.ok || !body.post) return setError(body.error ?? "Could not move this post");
    setPosts((items) => items.map((item) => item.id === body.post!.id ? body.post! : item));
    setSelected(body.post);
  }

  async function cancel(post: ScheduledPost) {
    const res = await fetch("/api/scheduled", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: post.id }) });
    const body = await res.json() as { post?: ScheduledPost; error?: string };
    if (!res.ok || !body.post) return setError(body.error ?? "Could not cancel this post");
    setPosts((items) => items.map((item) => item.id === body.post!.id ? body.post! : item));
    setSelected(null);
  }

  return <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
    <WorkspaceHeader context="Calendar" active="calendar" plan="studio" />
    <JourneyRail active="schedule" completed={["brand", "plan", "review"]} />
    <section className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-signal">PUBLISHING</p><h1 className="font-display text-4xl font-bold mt-2">Content calendar</h1><p className="text-muted text-sm mt-2">Drag scheduled posts between days. The publishing time stays intact.</p></div><button className="btn" onClick={() => setComposer(true)}>+ Schedule content</button></section>
    {error && <div className="panel border-signal/50 px-4 py-3 mt-6 text-sm text-signal" role="alert">{error}<button className="float-right" onClick={() => setError(null)} aria-label="Dismiss calendar error">×</button></div>}
    <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_320px]">
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3"><button className="btn-ghost !px-3 !py-1.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button><h2 className="font-display text-xl font-bold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><button className="btn-ghost !px-3 !py-1.5" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button></div>
        <div className="grid grid-cols-7 border-b border-hairline">{WEEK.map((day) => <div key={day} className="px-2 py-2 text-center font-mono text-[9px] text-muted">{day}</div>)}</div>
        <div className="grid grid-cols-7">{days.map((day) => { const dayPosts = active.filter((post) => sameDay(new Date(post.scheduledAt), day)); const inMonth = day.getMonth() === month.getMonth(); const today = sameDay(day, new Date()); return <div key={day.toISOString()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const post = posts.find((item) => item.id === e.dataTransfer.getData("text/post-id")); if (post) void move(post, day); }} className={`min-h-28 border-b border-r border-hairline p-1.5 ${inMonth ? "bg-panel" : "bg-ink/40"}`}><div className={`mb-1 font-mono text-[10px] ${today ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-signal text-ink" : inMonth ? "text-bone" : "text-muted"}`}>{day.getDate()}</div><div className="space-y-1">{dayPosts.slice(0, 4).map((post) => <button key={post.id} draggable={post.status === "scheduled"} onDragStart={(e) => e.dataTransfer.setData("text/post-id", post.id)} onClick={() => setSelected(post)} className={`block w-full border px-1.5 py-1 text-left ${post.status === "published" ? "border-green/40 bg-green/10" : post.status === "failed" ? "border-signal/40" : "border-hairline bg-ink/50 hover:border-signal"}`}><span className="block font-mono text-[8px] text-signal">{post.source ? `${authorityMark[post.source]} · ` : ""}{new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {post.channelIds.map((id) => platformLabel[channels.find((c) => c.id === id)?.platform ?? ""] ?? "•").join("/")}</span><span className="block truncate text-[10px] text-bone">{post.text}</span></button>)}</div></div>; })}</div>
      </section>
      <aside className="panel p-5 h-fit xl:sticky xl:top-5">{selected ? <PostInspector post={selected} channels={channels} onClose={() => setSelected(null)} onSaved={(post) => { setPosts((items) => items.map((item) => item.id === post.id ? post : item)); setSelected(post); }} onCancel={() => void cancel(selected)} /> : <CalendarSummary posts={active} channels={channels} />}</aside>
    </div>
    {composer && <Composer channels={channels} renders={renders} onClose={() => setComposer(false)} onCreated={(post) => { setPosts((items) => [...items, post]); setSelected(post); setComposer(false); setMonth(new Date(new Date(post.scheduledAt).getFullYear(), new Date(post.scheduledAt).getMonth(), 1)); }} />}
  </main>;
}

function PostInspector({ post, channels, onClose, onSaved, onCancel }: { post: ScheduledPost; channels: Channel[]; onClose: () => void; onSaved: (post: ScheduledPost) => void; onCancel: () => void }) {
  const [text, setText] = useState(post.text);
  const [when, setWhen] = useState(localInput(post.scheduledAt));
  const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); const res = await fetch("/api/scheduled", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: post.id, text, scheduledAt: new Date(when).toISOString() }) }); const body = await res.json() as { post?: ScheduledPost }; if (body.post) onSaved(body.post); setBusy(false); }
  const cover = post.renderId && post.imageFiles[0] ? `/api/asset/${encodeURIComponent(post.renderId)}/${encodeURIComponent(post.imageFiles[0])}` : null;
  return <><div className="flex items-center justify-between"><p className="eyebrow text-bone">POST PREVIEW</p><button className="text-muted hover:text-bone" onClick={onClose} aria-label="Close post preview">×</button></div>{cover && <img src={cover} alt="Scheduled creative" className="mt-4 aspect-video w-full object-cover border border-hairline" />}<AuthorityBadge source={post.source} approval={post.approval} /><div className="flex flex-wrap gap-1 mt-3">{post.channelIds.map((id) => { const channel = channels.find((item) => item.id === id); return channel ? <span key={id} className="border border-hairline px-2 py-1 font-mono text-[9px] uppercase">{channel.platform} · {channel.handle}</span> : null; })}</div><textarea className="field min-h-32 mt-4" value={text} onChange={(e) => setText(e.target.value)} disabled={post.status !== "scheduled"} /><input className="field mt-2" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} disabled={post.status !== "scheduled"} /><p className="font-mono text-[10px] text-muted mt-2">STATUS · {post.status.toUpperCase()}</p>{post.status === "scheduled" && <div className="flex gap-2 mt-4"><button className="btn flex-1" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button><button className="btn-ghost" onClick={onCancel}>Cancel post</button></div>}</>;
}

function Composer({ channels, renders, onClose, onCreated }: { channels: Channel[]; renders: SavedRender[]; onClose: () => void; onCreated: (post: ScheduledPost) => void }) {
  const [text, setText] = useState(""); const [when, setWhen] = useState(localInput(new Date(Date.now() + 86_400_000).toISOString())); const [selectedChannels, setSelectedChannels] = useState<string[]>(channels.map((c) => c.id)); const [renderId, setRenderId] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [busy, onClose]);
  async function submit() { const render = renders.find((item) => item.id === renderId); const preferred = render?.manifest.assets.find((asset) => asset.format === "og-image") ?? render?.manifest.assets[0]; setBusy(true); const res = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, channelIds: selectedChannels, scheduledAt: new Date(when).toISOString(), ...(render && preferred ? { renderId: render.id, imageFiles: [preferred.filename] } : {}) }) }); const body = await res.json() as { post?: ScheduledPost; error?: string }; if (res.ok && body.post) onCreated(body.post); else setError(body.error ?? "Could not schedule content"); setBusy(false); }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-labelledby="calendar-composer-title"><div className="panel w-full max-w-xl p-6"><div className="flex items-center justify-between"><div><p className="eyebrow text-signal">NEW CALENDAR ITEM</p><h2 id="calendar-composer-title" className="font-display text-2xl font-bold mt-2">Schedule content</h2></div><button onClick={onClose} className="text-muted hover:text-bone" aria-label="Close schedule dialog">×</button></div>{channels.length === 0 ? <p className="text-muted mt-6">Connect a publishing channel in the workspace first.</p> : <><label className="sr-only" htmlFor="calendar-post-copy">Post caption</label><textarea id="calendar-post-copy" autoFocus className="field mt-6 min-h-32" placeholder="Write the post caption…" value={text} onChange={(e) => setText(e.target.value)} /><label className="sr-only" htmlFor="calendar-post-time">Publishing time</label><input id="calendar-post-time" className="field mt-2" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /><fieldset className="mt-4"><legend className="eyebrow text-bone mb-2">CHANNELS</legend><div className="flex flex-wrap gap-2">{channels.map((channel) => <label key={channel.id} className={`cursor-pointer border px-3 py-2 text-xs ${selectedChannels.includes(channel.id) ? "border-signal text-bone" : "border-hairline text-muted"}`}><input className="sr-only" type="checkbox" checked={selectedChannels.includes(channel.id)} onChange={() => setSelectedChannels((ids) => ids.includes(channel.id) ? ids.filter((id) => id !== channel.id) : [...ids, channel.id])} />{channel.platform} · {channel.handle}</label>)}</div></fieldset><label className="eyebrow text-bone block mt-4">OPTIONAL SAVED CREATIVE<select className="field mt-2 normal-case tracking-normal" value={renderId} onChange={(e) => setRenderId(e.target.value)}><option value="">Text only</option>{renders.map((render) => <option key={render.id} value={render.id}>{render.manifest.brand} · {render.manifest.brief.slice(0,55)}</option>)}</select></label>{error && <p className="font-mono text-xs text-signal mt-3" role="alert">{error}</p>}<button className="btn w-full mt-5" disabled={busy || !text.trim() || selectedChannels.length === 0} onClick={() => void submit()}>{busy ? "Scheduling…" : "Add to calendar"}</button></>}</div></div>;
}

function CalendarSummary({ posts, channels }: { posts: ScheduledPost[]; channels: Channel[] }) { const scheduled = posts.filter((post) => post.status === "scheduled").length; const published = posts.filter((post) => post.status === "published").length; const approved = posts.filter((post) => post.source === "human-approved").length; return <><p className="eyebrow text-bone">THIS WORKSPACE</p><div className="grid grid-cols-3 gap-2 mt-4"><Stat value={scheduled} label="scheduled" /><Stat value={published} label="published" /><Stat value={approved} label="approved" /></div><p className="eyebrow text-bone mt-6">CONNECTED CHANNELS</p><div className="mt-3 space-y-2">{channels.length ? channels.map((channel) => <div key={channel.id} className="border border-hairline px-3 py-2 text-xs"><span className="text-signal uppercase">{channel.platform}</span> · {channel.handle}</div>) : <a className="text-sm text-signal" href="/dashboard#channels">Connect a channel →</a>}</div><p className="font-mono text-[10px] leading-relaxed text-muted mt-6">Drag a scheduled card to another day. Click any card to inspect its publishing authority, edit its caption or move its time.</p></>; }
function Stat({ value, label }: { value: number; label: string }) { return <div className="border border-hairline p-3"><div className="font-display text-2xl font-bold">{value}</div><div className="font-mono text-[9px] uppercase text-muted">{label}</div></div>; }
function monthGrid(month: Date) { const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay()); return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)); }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function localInput(iso: string) { const date = new Date(iso); const pad = (n: number) => String(n).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
