import { notFound, redirect } from "next/navigation";
import { WorkspaceHeader } from "../../components/workspace-header";
import type { ReactNode } from "react";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AgentRunActions } from "./actions";
import { ConceptHelp } from "../../components/concept-help";

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
  plan?: {
    ready: boolean;
    blockers: string[];
    safeguards: { brandSpecEnforced: boolean; humanApproval: string; idempotentPublishing: boolean };
    estimate: { finishedAssets: number; monthlyRemaining: number };
    steps: Array<{ id: string; action: string; mutates: boolean; ready: boolean }>;
  };
  planHash?: string;
  planVersion?: number;
  planApproval?: { actorId: string; approvedAt: string; planHash: string };
  renderIds?: string[];
  batchId?: string;
  postIds?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type Render = { id: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string; width: number; height: number }> } };
type Batch = { id: string; title: string; createdAt?: string; items: Array<{ id: string; status: string; brand: string; brief: string; renderId: string; note?: string }> };
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

function resolutionFor(message: string, brand?: string) {
  const normalized = message.toLowerCase();
  if (/credential|api key|expired|unauthor|scope/.test(normalized)) return { why: "Credentials and scopes fail closed so an unknown client cannot mutate the workspace.", owner: "Workspace owner", href: "/dashboard#agent", action: "Replace or rescope credential" };
  if (/channel|oauth|destination|publish|disconnect/.test(normalized)) return { why: "Delivery pauses rather than guessing when a destination cannot prove its identity or availability.", owner: "Workspace owner", href: "/dashboard#channels", action: "Inspect destination" };
  if (/brand|spec|voice|contrast|logo|violation/.test(normalized)) return { why: "Brand checks stop production before a non-compliant asset becomes an approved deliverable.", owner: "Brand owner", href: brand ? `/brands/${encodeURIComponent(brand)}` : "/", action: brand ? "Inspect BrandSpec" : "Compile a brand" };
  if (/limit|allowance|quota/.test(normalized)) return { why: "Allowance checks happen before work begins so a run cannot create surprise usage.", owner: "Workspace owner", href: "/dashboard#account", action: "Review allowance" };
  if (/review|approval|flag/.test(normalized)) return { why: "The agent cannot substitute its own judgment for the human approval recorded on this work.", owner: "Assigned reviewer or owner", href: "/inbox", action: "Open decision inbox" };
  return { why: "The run stopped before the next mutation so finished work remains intact and nothing is delivered twice.", owner: "Workspace owner", href: "/help", action: "Open recovery guide" };
}

export const metadata = { title: "Agent run · Brandrail" };

export default async function AgentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = await getUserId();
  if (!uid) redirect(`/login?return=${encodeURIComponent(`/runs/${encodeURIComponent(id)}`)}`);
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
  const deliveryPlanned = Boolean(run.publishAt || run.channels.length);
  const failureResolution = run.error ? resolutionFor(run.error, run.brand) : null;
  const stages = [
    { label: "Plan", done: Boolean(run.plan) },
    { label: "Render", done: Boolean(run.renderIds?.length) },
    { label: deliveryPlanned ? "Review" : "Confirm", done: deliveryPlanned ? reviewReady || ["publish", "scheduled", "completed"].includes(run.currentStep) : run.status === "completed" },
    { label: deliveryPlanned ? "Deliver" : "Finish", done: run.status === "completed" },
  ];
  const timeline = [
    { key: "created", label: "Run created", detail: `Dry plan v${run.planVersion ?? 1} recorded`, at: run.createdAt },
    ...(run.planApproval ? [{ key: "approved", label: "Plan approved by a human", detail: `Plan ${run.planApproval.planHash.slice(0, 10)} locked`, at: run.planApproval.approvedAt }] : []),
    ...(renderRows.length ? [{ key: "rendered", label: "Assets linked", detail: `${renderRows.length} render${renderRows.length === 1 ? "" : "s"} present in the latest run state`, at: run.updatedAt }] : []),
    ...(batch ? [{ key: "review", label: "Human review opened", detail: batch.id, at: batch.createdAt ?? run.updatedAt }] : []),
    ...(posts.length ? [{ key: "delivery", label: "Delivery target", detail: `${posts.length} linked post${posts.length === 1 ? "" : "s"}`, at: posts[0]!.scheduledAt }] : []),
    ...(run.status === "failed" && run.error ? [{ key: "failed", label: "Run stopped safely", detail: run.error, at: run.updatedAt }] : []),
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <WorkspaceHeader context="Agent run" active="runs" />
      <a href="/runs" className="mt-5 inline-block font-mono text-[10px] text-muted hover:text-bone">← All agent runs</a>

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

        {run.error && failureResolution && <div className="mt-7 border border-signal/40 bg-signal/[0.04] p-4"><p className="eyebrow text-signal">RUN STOPPED SAFELY</p><h2 className="mt-2 text-base font-semibold text-bone">{run.error}</h2><p className="mt-2 text-sm text-muted">{failureResolution.why}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-signal/20 pt-4"><p className="font-mono text-[9px] text-muted">RESPONSIBLE · {failureResolution.owner}</p><a href={failureResolution.href} className="btn-ghost !px-3 !py-2 text-xs">{failureResolution.action} →</a></div></div>}

        {run.plan && (
          <section className="mt-7 border border-hairline bg-ink/35 p-5" aria-labelledby="run-plan-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="eyebrow text-signal">DRY PLAN · VERSION {run.planVersion ?? 1} <ConceptHelp concept="planApproval" className="ml-1" /></div><h2 id="run-plan-title" className="mt-2 font-display text-xl font-bold">Approve these exact actions.</h2></div>
              <div className="text-right font-mono text-[10px] text-muted"><p>up to {run.plan.estimate.finishedAssets} finished assets</p><p>{run.plan.estimate.monthlyRemaining} allowance remaining</p></div>
            </div>
            {run.plan.blockers.length > 0 && <ul className="mt-4 space-y-2 border-l-2 border-signal pl-4 text-sm text-signal">{run.plan.blockers.map((blocker) => { const resolution = resolutionFor(blocker, run.brand); return <li key={blocker} className="flex flex-wrap items-center justify-between gap-2"><span>{blocker}</span><a href={resolution.href} className="font-mono text-[9px] text-bone hover:text-signal">{resolution.action} →</a></li>; })}</ul>}
            <ol className="mt-5 divide-y divide-hairline border-y border-hairline">
              {run.plan.steps.map((step, index) => <li key={step.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3"><span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, "0")}</span><span className="text-sm text-bone">{step.action}</span><span className={`font-mono text-[9px] ${step.mutates ? "text-signal" : "text-green"}`}>{step.mutates ? "CHANGES WORKSPACE" : "READ ONLY"}</span></li>)}
            </ol>
            <div className="mt-4 grid gap-px border border-hairline bg-hairline sm:grid-cols-4" aria-label="Estimated plan impact">
              <div className="bg-panel p-3"><span className="font-display text-xl font-bold text-bone">{run.plan.estimate.finishedAssets}</span><span className="mt-1 block font-mono text-[8px] text-muted">MAX FINISHED ASSETS</span></div>
              <div className="bg-panel p-3"><span className="font-display text-xl font-bold text-bone">{run.channels.length}</span><span className="mt-1 block font-mono text-[8px] text-muted">PLANNED DESTINATIONS</span></div>
              <div className="bg-panel p-3"><span className="font-display text-xl font-bold text-bone">{run.plan.steps.filter((step) => step.mutates).length}</span><span className="mt-1 block font-mono text-[8px] text-muted">WORKSPACE CHANGES</span></div>
              <div className="bg-panel p-3"><span className="font-display text-xl font-bold text-green">0</span><span className="mt-1 block font-mono text-[8px] text-muted">UNAPPROVED PUBLISHES</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] text-muted"><span>✓ BRANDSPEC ENFORCED</span><span>✓ HUMAN DELIVERY APPROVAL</span><span>✓ IDEMPOTENT DELIVERY</span>{run.planHash && <span title={run.planHash}>PLAN {run.planHash.slice(0, 10)}</span>}</div>
            {run.planApproval && <p className="mt-4 border-l-2 border-green pl-3 text-xs text-muted">Approved in this workspace on {new Date(run.planApproval.approvedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}. Any plan change requires a new approval.</p>}
          </section>
        )}

        <div className="mt-7 flex flex-col justify-between gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center">
          <div className="font-mono text-[10px] text-muted"><p>{run.brand ?? "Brand pending"} · maximum {run.assetCount} assets · {run.channels.length || 0} channels</p><p className="mt-1">Updated {new Date(run.updatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p></div>
          <AgentRunActions runId={run.id} status={run.status} currentStep={run.currentStep} planHash={run.planHash} batchId={run.batchId} reviewReady={reviewReady} canReview={usage.entitlements.features.includes("batchReview")} hasDeliveryPlan={deliveryPlanned} />
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

      <section className="mt-10 border border-hairline bg-panel p-5 sm:p-6" aria-labelledby="run-record-title">
        <p className="eyebrow text-signal">AUDITABLE HANDOFFS</p>
        <h2 id="run-record-title" className="mt-2 font-display text-xl font-bold">Run record</h2>
        <ol className="mt-5 divide-y divide-hairline border-y border-hairline">
          {timeline.map((event) => <li key={event.key} className="grid gap-2 py-3 sm:grid-cols-[170px_1fr_auto] sm:items-center"><strong className="text-sm text-bone">{event.label}</strong><span className="font-mono text-[10px] text-muted">{event.detail}</span><time className="font-mono text-[9px] text-muted">{new Date(event.at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</time></li>)}
        </ol>
        <a href="/activity" className="mt-4 inline-block font-mono text-[10px] text-signal hover:text-bone">OPEN FULL ACTIVITY LOG →</a>
      </section>
    </main>
  );
}

function ArtifactPanel({ number, label, count, empty, children }: { number: string; label: string; count: number; empty: string; children: ReactNode }) {
  return <section className="border border-hairline bg-panel p-5"><div className="flex items-center justify-between"><p className="eyebrow text-signal">{number} / {label}</p><span className="font-mono text-[10px] text-muted">{count}</span></div><div className="mt-5 space-y-4">{count ? children : <p className="text-sm text-muted">{empty}</p>}</div></section>;
}
