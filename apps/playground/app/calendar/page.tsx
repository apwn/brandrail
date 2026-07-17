import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { CalendarWorkspace } from "./workspace";
import { WorkspaceHeader } from "../components/workspace-header";

export default async function CalendarPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?return=%2Fcalendar");
  const usageRes = await engine("/v0/me/usage", {}, uid);
  if (!usageRes.ok) redirect("/dashboard");
  const usage = await usageRes.json() as { role: "owner" | "reviewer"; entitlements: { features: string[] } };
  if (usage.role !== "owner" || !usage.entitlements.features.includes("publishing")) {
    return <LockedCalendar />;
  }
  const [scheduledRes, channelsRes, rendersRes] = await Promise.all([
    engine("/v0/scheduled", {}, uid),
    engine("/v0/channels", {}, uid),
    engine("/v0/renders?limit=30", {}, uid),
  ]);
  const scheduled = scheduledRes.ok ? await scheduledRes.json() as { posts: ScheduledPost[] } : { posts: [] };
  const channels = channelsRes.ok ? await channelsRes.json() as { channels: Channel[] } : { channels: [] };
  const renders = rendersRes.ok ? await rendersRes.json() as { renders: SavedRender[] } : { renders: [] };
  return <CalendarWorkspace initialPosts={scheduled.posts} channels={channels.channels} renders={renders.renders} />;
}

export type Channel = { id: string; platform: string; handle: string };
export type ScheduledPost = { id: string; channelIds: string[]; text: string; renderId?: string; imageFiles: string[]; scheduledAt: string; status: "scheduled" | "publishing" | "published" | "failed" | "cancelled"; source?: "human-approved" | "manual" | "agent-confirmed" | "autopilot"; approval?: { batchId: string; itemId: string }; results?: Array<{ ok: boolean; url?: string; error?: string }> };
export type SavedRender = { id: string; createdAt: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string }> } };

function LockedCalendar() {
  return <main className="mx-auto max-w-5xl px-6 py-12"><WorkspaceHeader context="Calendar" active="calendar" plan="free" /><section className="max-w-3xl py-14"><div className="rail w-14" /><p className="eyebrow text-signal mt-6">STUDIO WORKFLOW</p><h1 className="font-display text-4xl font-bold mt-3">Your publishing calendar starts with Studio.</h1><p className="text-muted mt-4 max-w-xl">Schedule, move, preview and monitor every connected channel from one rail.</p><div className="mt-7 flex flex-wrap gap-3"><a href="/dashboard?checkout=studio&return=%2Fcalendar" className="btn">Start Studio →</a><a href="/help#plans" className="btn-ghost">Compare capabilities</a></div></section></main>;
}
