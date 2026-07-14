import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { CampaignsWorkspace, type BatchOption, type Campaign, type PostOption } from "./workspace";

async function read<T>(path: string, uid: string, fallback: T): Promise<T> {
  try { const response = await engine(path, {}, uid); return response.ok ? await response.json() as T : fallback; } catch { return fallback; }
}

export default async function CampaignsPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const usage = await read<{ role: "owner" | "reviewer"; entitlements: { features: string[] } }>("/v0/me/usage", uid, { role: "owner", entitlements: { features: [] } });
  if (!usage.entitlements.features.includes("planner")) return <LockedCampaigns />;
  const [campaigns, specs, batches, posts] = await Promise.all([
    read<{ campaigns: Campaign[] }>("/v0/campaigns", uid, { campaigns: [] }),
    read<{ specs: Array<{ name: string }> }>("/v0/specs", uid, { specs: [] }),
    read<{ batches: BatchOption[] }>("/v0/batches", uid, { batches: [] }),
    read<{ posts: PostOption[] }>("/v0/scheduled", uid, { posts: [] }),
  ]);
  return <CampaignsWorkspace initialCampaigns={campaigns.campaigns} brands={specs.specs.map((spec) => spec.name)} batches={batches.batches} posts={posts.posts} owner={usage.role === "owner"} />;
}

function LockedCampaigns() { return <main className="mx-auto max-w-3xl px-6 py-20"><a href="/dashboard" className="eyebrow hover:text-bone">← WORKSPACE</a><div className="rail w-14 mt-16" /><p className="eyebrow text-signal mt-6">STUDIO WORKFLOW</p><h1 className="font-display text-4xl font-bold mt-3">One brief. Every asset, approval and result in one place.</h1><p className="text-muted mt-4 max-w-xl">Campaign workspaces keep the work connected from objective to outcome.</p><a href="/login?plan=studio" className="btn mt-7">Start Studio →</a></main>; }
