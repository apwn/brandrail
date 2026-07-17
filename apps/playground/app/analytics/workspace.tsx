"use client";

import { useMemo, useState } from "react";
import { WorkspaceHeader } from "../components/workspace-header";
import { JourneyRail } from "../components/journey-rail";
import { trackConversion } from "@/lib/conversion";

type TopPost = { id: string; text: string; scheduledAt: string; metrics?: { impressions?: number; engagements?: number; fetchedAt?: string }; channelIds: Array<{ id: string; platform: string; handle: string }>; results?: Array<{ ok: boolean; url?: string }> };
export type AnalyticsData = {
  totals: { posts: number; scheduled: number; published: number; failed: number; measured: number; impressions: number; engagements: number; engagementRate: number | null };
  byChannel: Array<{ platform: string; handle: string; posts: number; impressions: number; engagements: number }>;
  byMonth: Array<{ month: string; posts: number; impressions: number; engagements: number }>;
  topPosts: TopPost[];
  insight: string;
};

const EMPTY: AnalyticsData = { totals: { posts: 0, scheduled: 0, published: 0, failed: 0, measured: 0, impressions: 0, engagements: 0, engagementRate: null }, byChannel: [], byMonth: [], topPosts: [], insight: "Publish your first post to start the feedback loop." };
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function AnalyticsWorkspace({ initialData }: { initialData: AnalyticsData | null }) {
  const [data, setData] = useState(initialData ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const peak = useMemo(() => Math.max(1, ...data.byMonth.map((row) => row.engagements)), [data.byMonth]);
  const topChannel = useMemo(() => [...data.byChannel].sort((left, right) => right.engagements - left.engagements)[0], [data.byChannel]);
  const recommendationBrief = `Create a new campaign using this measured signal: ${data.insight}`;

  async function refresh() {
    setBusy(true); setNotice(null);
    try {
      const refreshed = await fetch("/api/analytics", { method: "POST" });
      const result = await refreshed.json() as { updated?: number; error?: string };
      if (!refreshed.ok) throw new Error(result.error ?? "refresh failed");
      const response = await fetch("/api/analytics");
      const next = await response.json() as AnalyticsData & { error?: string };
      if (!response.ok) throw new Error(next.error ?? "analytics unavailable");
      setData(next); setNotice(result.updated ? `${result.updated} post${result.updated === 1 ? "" : "s"} refreshed.` : "No new platform metrics yet.");
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
    <WorkspaceHeader context="Analytics" active="analytics" plan="studio" />
    <JourneyRail active="learn" completed={["brand", "plan", "review", "schedule"]} />
    <section className="mt-8 flex flex-wrap items-center justify-between gap-5">
      <div><div className="rail w-12" /><h1 className="font-display text-4xl font-bold mt-4">Performance</h1><p className="text-muted mt-2 max-w-2xl">The signal behind the next content decision—not a vanity dashboard.</p></div>
      <div className="flex gap-2"><a href="/calendar" className="btn-ghost !py-2">Calendar</a><button className="btn !py-2" onClick={refresh} disabled={busy}>{busy ? "Refreshing…" : "Refresh metrics"}</button></div>
    </section>
    {notice && <p className="panel px-4 py-3 mt-6 font-mono text-xs text-signal">{notice}</p>}

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
      <Metric label="PUBLISHED" value={compact.format(data.totals.published)} detail={`${data.totals.scheduled} scheduled`} />
      <Metric label="IMPRESSIONS" value={compact.format(data.totals.impressions)} detail={`${data.totals.measured}/${data.totals.published} measured`} />
      <Metric label="ENGAGEMENTS" value={compact.format(data.totals.engagements)} detail="reactions + replies + shares" />
      <Metric label="ENGAGEMENT RATE" value={data.totals.engagementRate === null ? "—" : `${(data.totals.engagementRate * 100).toFixed(1)}%`} detail={data.totals.failed ? `${data.totals.failed} publishing failures` : "delivery healthy"} />
    </section>

    <section className="grid lg:grid-cols-[1.4fr_.8fr] gap-4 mt-4">
      <div className="panel p-5 sm:p-6"><p className="eyebrow text-bone">SIX-MONTH SIGNAL</p><div className="h-56 flex items-end gap-3 mt-8 border-b border-hairline">
        {data.byMonth.map((row) => <div key={row.month} className="flex-1 h-full flex flex-col justify-end group"><div className="font-mono text-[10px] text-muted text-center mb-2 opacity-0 group-hover:opacity-100">{row.engagements}</div><div className="bg-signal/80 min-h-[2px] transition-all" style={{ height: `${Math.max(2, row.engagements / peak * 100)}%` }} /><p className="font-mono text-[9px] text-muted text-center py-2">{row.month.slice(5)}</p></div>)}
      </div></div>
      <aside className="panel border-signal/40 p-5 sm:p-6"><p className="eyebrow text-signal">RECOMMENDED NEXT MOVE</p><p className="mt-4 leading-relaxed text-bone">{data.insight}</p><div className="mt-5 border-y border-hairline py-4 font-mono text-[9px] leading-relaxed text-muted"><p>EVIDENCE · {data.totals.measured} measured of {data.totals.published} published</p><p className="mt-1">STRONGEST CHANNEL · {topChannel ? `${topChannel.platform} · ${compact.format(topChannel.engagements)} engagements` : "waiting for enough signal"}</p><p className="mt-1">CONTROL · this recommendation changes nothing until you review the new plan</p></div><a href={`/?brief=${encodeURIComponent(recommendationBrief)}`} onClick={() => trackConversion("analytics_recommendation_applied", { measured: data.totals.measured })} className="mt-5 inline-block font-mono text-xs text-signal hover:text-bone">Use this in a new brief →</a>{data.totals.measured < 3 && <p className="mt-3 text-xs text-muted">Low-confidence signal: treat this as a test, not an automatic strategy change.</p>}</aside>
    </section>

    <section className="grid lg:grid-cols-[.8fr_1.4fr] gap-4 mt-4">
      <div className="panel p-5 sm:p-6"><p className="eyebrow text-bone">CHANNEL CONTRIBUTION</p>{data.byChannel.length ? <div className="mt-5 divide-y divide-hairline">{data.byChannel.map((row) => <div key={`${row.platform}-${row.handle}`} className="py-3 flex items-center justify-between gap-4"><div><p className="text-sm text-bone capitalize">{row.platform}</p><p className="font-mono text-[10px] text-muted truncate max-w-40">{row.handle}</p></div><div className="text-right"><p className="font-display font-bold text-lg">{compact.format(row.engagements)}</p><p className="font-mono text-[9px] text-muted">{row.posts} POSTS</p></div></div>)}</div> : <Empty text="Connect a channel and publish to compare contribution." />}</div>
      <div className="panel p-5 sm:p-6"><p className="eyebrow text-bone">TOP CONTENT</p>{data.topPosts.length ? <div className="mt-4 divide-y divide-hairline">{data.topPosts.map((post, index) => <article key={post.id} className="py-4 grid grid-cols-[28px_1fr_auto] gap-3"><span className="font-mono text-xs text-signal">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm text-bone line-clamp-2">{post.text}</p><p className="font-mono text-[9px] text-muted mt-2 uppercase">{post.channelIds.map((channel) => channel.platform).join(" + ") || "channel removed"} · {post.scheduledAt.slice(0, 10)}</p></div><div className="text-right"><p className="font-display font-bold">{compact.format(post.metrics?.engagements ?? 0)}</p><p className="font-mono text-[9px] text-muted">ENG.</p></div></article>)}</div> : <Empty text="Published posts will rank here when metrics arrive." />}</div>
    </section>
  </main>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="panel p-4 sm:p-5"><p className="eyebrow text-bone">{label}</p><p className="font-display text-3xl sm:text-4xl font-bold mt-3">{value}</p><p className="font-mono text-[9px] text-muted mt-2 uppercase">{detail}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="text-muted text-sm mt-6 leading-relaxed">{text}</p>; }
