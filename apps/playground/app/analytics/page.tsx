import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AnalyticsWorkspace, type AnalyticsData } from "./workspace";
import { WorkspaceHeader } from "../components/workspace-header";

export default async function AnalyticsPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?return=%2Fanalytics");
  const usageResponse = await engine("/v0/me/usage", {}, uid);
  if (!usageResponse.ok) redirect("/dashboard");
  const usage = await usageResponse.json() as { role: "owner" | "reviewer"; entitlements: { features: string[] } };
  if (usage.role !== "owner" || !usage.entitlements.features.includes("planner")) return <LockedAnalytics />;
  const response = await engine("/v0/analytics", {}, uid);
  const data = response.ok ? await response.json() as AnalyticsData : null;
  return <AnalyticsWorkspace initialData={data} />;
}

function LockedAnalytics() {
  return <main className="mx-auto max-w-5xl px-6 py-12"><WorkspaceHeader context="Analytics" active="analytics" plan="free" /><section className="max-w-3xl py-14"><div className="rail w-14" /><p className="eyebrow text-signal mt-6">STUDIO INTELLIGENCE</p><h1 className="font-display text-4xl font-bold mt-3">Know what earns attention, then make more of it.</h1><p className="text-muted mt-4 max-w-xl">Studio closes the loop from publishing to performance and feeds the signal back into your next plan.</p><div className="mt-7 flex flex-wrap gap-3"><a href="/dashboard?checkout=studio&return=%2Fanalytics" className="btn">Start Studio →</a><a href="/help#plans" className="btn-ghost">Compare capabilities</a></div></section></main>;
}
