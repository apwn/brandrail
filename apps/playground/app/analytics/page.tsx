import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AnalyticsWorkspace, type AnalyticsData } from "./workspace";

export default async function AnalyticsPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const usageResponse = await engine("/v0/me/usage", {}, uid);
  if (!usageResponse.ok) redirect("/dashboard");
  const usage = await usageResponse.json() as { role: "owner" | "reviewer"; entitlements: { features: string[] } };
  if (usage.role !== "owner" || !usage.entitlements.features.includes("planner")) return <LockedAnalytics />;
  const response = await engine("/v0/analytics", {}, uid);
  const data = response.ok ? await response.json() as AnalyticsData : null;
  return <AnalyticsWorkspace initialData={data} />;
}

function LockedAnalytics() {
  return <main className="mx-auto max-w-3xl px-6 py-20"><a href="/dashboard" className="eyebrow hover:text-bone">← WORKSPACE</a><div className="rail w-14 mt-16" /><p className="eyebrow text-signal mt-6">STUDIO INTELLIGENCE</p><h1 className="font-display text-4xl font-bold mt-3">Know what earns attention, then make more of it.</h1><p className="text-muted mt-4 max-w-xl">Studio closes the loop from publishing to performance and feeds the signal back into your next plan.</p><a href="/login?plan=studio" className="btn mt-7">Start Studio →</a></main>;
}
