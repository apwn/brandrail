import { notFound, redirect } from "next/navigation";
import { WorkspaceLockup } from "../../components/workspace-lockup";
import type { ReactNode } from "react";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AgentRunActions } from "./actions";

type AgentRun = {
  id: string;
  objective: string;
  brand?: string;
  channels: string[];
  assetCount: number;
  publishAt?: string;
  status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep: string;
  renderIds?: string[];
  batchId?: string;
  postIds?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type Render = { id: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string; width: number; height: number }> } };
type Batch = { id: string; title: string; items: Array<{ id: string; status: string; brand: string; brief: string; renderId: string; note?: string }> };
type Post = { id: string; text: string; scheduledAt: string; status: string; channelIds: string[]; results?: Array<{ channelId: string; ok: boolean; url?: string; error?: string }> };

async function read<T>(path: string, uid: string): Promise<T | null> {
  try {
    const response = await engine(path, {}, uid);
    return response.ok ? await response.json() as T : null;
  } catch {
    return null;
  }
}

function stepLabel(step: string) {
  return ({
    confirm_plan: "Plan approval",
    render: "Asset production",
    review_or_confirm: "Review handoff",
    human_review: "Human review",
    resolve_review_flags: "Review revisions",
    publish: "Publishing approval",
    scheduled: "Scheduled delivery",
    completed: "Completed",
    cancelled: "Cancelled",
  } as Record<string, string>)[step] ?? step.replaceAll("_", " ");
}

function nextAction(run: AgentRun) {
  if (run.status === "completed") return "Delivery is complete. The linked assets and posts remain available below for reuse and measurement.";
  if (run.status === "failed") return "The run stopped safely. Read the failure, correct the underlying connection or input, then retry without creating a second run.";
  if (run.status === "cancelled") return "This run is cancelled. Existing assets remain intact; retry only if you want the same objective to continue.";
  if (run.currentStep === "confirm_plan") return "A human must approve the dry plan before any production work begins.";
  if (run.currentStep === "render") return "The plan is approved. Produce the brand-locked set here, or let an attached MCP, SDK, or CLI agent advance it.";
  if (run.currentStep === "review_or_confirm") return "The finished render is ready to be attached to a review batch without regenerating it.";
  if (["human_review", "resolve_review_flags"].includes(run.currentStep)) return "The agent is paused. A human must approve, edit, or flag the work in the review queue.";
  if (run.currentStep === "publish") return "Review is clear. The attached agent may schedule the approved asset using the run ID and approval reference.";
  if (run.currentStep === "scheduled") return "Delivery is queued, not complete. This run will resolve only after the scheduler receives the real platform outcome.";
  return "The run is active. Its next mutation must come from an attached agent with the required scoped credential.";
}

export const metadata = { title: "Agent run · Brandrail" };

export default async function AgentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const { id } = await params;
  const [runResponse, usage] = await Promise.all([
    engine(`/v0/agent/runs/${encodeURIComponent(id)}`, {}, uid).catch(() => null),
    read<{ role: "owner" | "reviewer"; entitlements: { features: string[] } }>("/v0/me/usage", uid),
  ]);
  if (usage?.role !== "owner") redirect("/dashboard");
  if (!runResponse || runResponse.status === 404) notFound();
  if (!runResponse.ok) redirect("/dashboard");
  const { run } = await runResponse.json() as { run: AgentRun };

  const [renders, batch, scheduled] = await Promise.all([
    Promise.all((run.renderIds ?? []).map((renderId) => read<Render>(`/v0/renders/${encodeURIComponent(renderId)}`, uid))),
    run.batchId ? read<Batch>(`/v0/batches/${encodeURIComponent(run.batchId)}`, uid) : Promise.resolve(null),
    run.postIds?.length ? read<{ posts: Post[] }>("/v0/scheduled", uid) : Promise.resolve(null),
  ]);
  const posts = (scheduled?.posts ?? []).filter((post) => run.postIds?.includes(post.id));
  const renderRows = renders.filter((render): render is Render => Boolean(render));
  const reviewReady = Boolean(batch && batch.items.some((item) => ["approved", "edited"].includes(item.status)) && batch.items.every((item) => ["approved", "edited"].includes(item.status)));
  const stages = [
    { label: "Plan", done: run.progress >= 10 },
    { label: "Render", done: Boolean(run.renderIds?.length) },
    { label: "Review", done: run.progress >= 80 },
    { label: "Deliver", done: run.status === "completed" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <WorkspaceLockup context="Agent run" />
        <a href="/runs" className="btn-ghost !px-3 !py-2 text-xs">← All agent runs</a>
      </header>

      <section className="mt-12 border border-hairline bg-panel p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`border px-2 py-1 font-mono text-[9px] ${run.status === "failed" ? "border-signal/60 text-signal" : run.status === "completed" ? "border-green/60 text-green" : "border-hairline text-bone"}`}>{run.status.replace("_", " ").toUpperCase()}</span>
              <span className="font-mono text-[10px] text-muted">{run.id}</span>
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">{run.objective}</h1>
            <p className="mt-4 max-w-xl text-muted">{nextAction(run)}</p>
          </div>
          <div className="min-w-36 border-l border-hairline pl-5">
            <p className="eyebrow text-muted">CURRENT STEP</p>
            <p className="mt-2 font-display text-lg font-bold text-bone">{stepLabel(run.currentStep)}</p>
            <p className="mt-1 font-mono text-xs text-signal">{run.progress}% complete</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-1" aria-label="Run progress">
          {stages.map((stage, index) => <div key={stage.label}><div className={`h-1 ${stage.done ? "bg-green" : run.progress >= [0, 10, 45, 80][index]! ? "bg-signal" : "bg-hairline"}`} /><p className={`mt-2 font-mono text-[9px] ${stage.done ? "text-bone" : "text-muted"}`}>{String(index + 1).padStart(2, "0")} {stage.label.toUpperCase()}</p></div>)}
        </div>

        {run.error && <div className="mt-7 border border-signal/40 bg-signal/[0.04] p-4"><p className="eyebrow text-signal">WHY IT STOPPED</p><p className="mt-2 text-sm text-bone">{run.error}</p></div>}

        <div className="mt-7 flex flex-col justify-between gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center">
          <div className="font-mono text-[10px] text-muted"><p>{run.brand ?? "Brand pending"} · {run.assetCount} planned assets · {run.channels.length || 0} channels</p><p className="mt-1">Updated {new Date(run.updatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p></div>
          <AgentRunActions runId={run.id} status={run.status} currentStep={run.currentStep} batchId={run.batchId} reviewReady={reviewReady} canReview={usage.entitlements.features.includes("batchReview")} />
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <ArtifactPanel number="01" label="RENDERS" count={renderRows.length} empty="No render has been linked yet.">
          {renderRows.map((render) => {
            const preview = render.manifest.assets[0];
            return <article key={render.id} className="border-t border-hairline pt-4 first:border-0 first:pt-0">{preview && <img src={`/api/asset/${encodeURIComponent(render.id)}/${encodeURIComponent(preview.filename)}`} alt={`${render.manifest.brand} ${preview.format} preview`} className="aspect-[4/3] w-full border border-hairline object-cover" />}<p className="mt-3 text-sm text-bone">{render.manifest.brief}</p><p className="mt-1 font-mono text-[9px] text-muted">{render.id} · {render.manifest.assets.length} assets</p></article>;
          })}
        </ArtifactPanel>

        <ArtifactPanel number="02" label="HUMAN REVIEW" count={batch ? 1 : 0} empty="No approval batch has been created yet.">
          {batch && <article><p className="font-display text-lg font-bold">{batch.title}</p><p className="mt-2 text-sm text-muted">{batch.items.filter((item) => ["approved", "edited"].includes(item.status)).length} approved · {batch.items.filter((item) => item.status === "pending").length} pending · {batch.items.filter((item) => item.status === "flagged").length} flagged</p><a href={`/review?batch=${encodeURIComponent(batch.id)}`} className="mt-4 inline-block font-mono text-[10px] text-signal hover:text-bone">OPEN THIS REVIEW →</a></article>}
        </ArtifactPanel>

        <ArtifactPanel number="03" label="DELIVERIES" count={posts.length} empty="No delivery has been linked yet.">
          {posts.map((post) => <article key={post.id} className="border-t border-hairline pt-4 first:border-0 first:pt-0"><div className="flex items-center justify-between gap-3"><span className={`font-mono text-[9px] ${post.status === "failed" ? "text-signal" : post.status === "published" ? "text-green" : "text-bone"}`}>{post.status.toUpperCase()}</span><time className="font-mono text-[9px] text-muted">{new Date(post.scheduledAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div><p className="mt-2 text-sm text-bone">{post.text}</p>{post.results?.find((result) => !result.ok)?.error && <p className="mt-2 text-xs text-signal">{post.results.find((result) => !result.ok)?.error}</p>}</article>)}
          {posts.length > 0 && <a href="/calendar" className="mt-4 inline-block font-mono text-[10px] text-signal hover:text-bone">OPEN CALENDAR →</a>}
        </ArtifactPanel>
      </section>
    </main>
  );
}

function ArtifactPanel({ number, label, count, empty, children }: { number: string; label: string; count: number; empty: string; children: ReactNode }) {
  return <section className="border border-hairline bg-panel p-5"><div className="flex items-center justify-between"><p className="eyebrow text-signal">{number} / {label}</p><span className="font-mono text-[10px] text-muted">{count}</span></div><div className="mt-5 space-y-4">{count ? children : <p className="text-sm text-muted">{empty}</p>}</div></section>;
}
