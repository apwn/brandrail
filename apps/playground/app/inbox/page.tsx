import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { JourneyRail } from "../components/journey-rail";
import { WorkspaceHeader } from "../components/workspace-header";

type Usage = {
  role: "owner" | "reviewer";
  user: { plan: "free" | "studio" | "agency" };
  entitlements: { features: string[] };
};
type Batch = { id: string; title: string; createdAt: string; counts: { total: number; approved: number; flagged: number; pending: number } };
type Run = { id: string; objective: string; brand?: string; status: string; currentStep: string; updatedAt: string; error?: string };
type Operations = {
  attentionRequired: number;
  deliveries: { failedRecent?: number; overdue?: number; stuckPublishing?: number; disconnected?: number };
  runs: { failedRecent?: number; waitingForHuman?: number };
  credentials: { expired?: number; expiringWithinSevenDays?: number };
  webhooks: { dead?: number; retrying?: number };
};
type Key = { id: string; label: string; expiresAt?: string | null; lastUsedAt?: string | null };

type Decision = {
  id: string;
  urgency: "now" | "review" | "soon";
  kind: string;
  title: string;
  reason: string;
  owner: string;
  href: string;
  action: string;
};

const EMPTY_OPERATIONS: Operations = { attentionRequired: 0, deliveries: {}, runs: {}, credentials: {}, webhooks: {} };

async function read<T>(path: string, uid: string, fallback: T): Promise<T> {
  try {
    const response = await engine(path, {}, uid);
    return response.ok ? await response.json() as T : fallback;
  } catch {
    return fallback;
  }
}

function operationalDecisions(operations: Operations): Decision[] {
  const deliveryFailures = (operations.deliveries.failedRecent ?? 0) + (operations.deliveries.overdue ?? 0) + (operations.deliveries.stuckPublishing ?? 0);
  const disconnected = operations.deliveries.disconnected ?? 0;
  const webhooks = (operations.webhooks.dead ?? 0) + (operations.webhooks.retrying ?? 0);
  return [
    ...(deliveryFailures ? [{ id: "delivery-recovery", urgency: "now" as const, kind: "Delivery", title: `${deliveryFailures} delivery ${deliveryFailures === 1 ? "issue" : "issues"}`, reason: "A destination did not confirm delivery or a scheduled item is overdue.", owner: "Workspace owner", href: "/calendar", action: "Recover delivery" }] : []),
    ...(disconnected ? [{ id: "channel-recovery", urgency: "now" as const, kind: "Connection", title: `${disconnected} disconnected ${disconnected === 1 ? "destination" : "destinations"}`, reason: "Publishing is paused so Brandrail does not send work to an invalid credential.", owner: "Workspace owner", href: "/dashboard#channels", action: "Reconnect" }] : []),
    ...(webhooks ? [{ id: "webhook-recovery", urgency: "soon" as const, kind: "Automation", title: `${webhooks} webhook ${webhooks === 1 ? "issue" : "issues"}`, reason: "An external agent may not receive lifecycle updates until delivery recovers.", owner: "Workspace owner", href: "/dashboard#webhooks", action: "Inspect webhooks" }] : []),
  ];
}

export const metadata = { title: "Decision inbox · Brandrail" };

export default async function InboxPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?return=%2Finbox");
  const usage = await read<Usage | null>("/v0/me/usage", uid, null);
  if (!usage) redirect("/dashboard");

  const [batchData, runData, operations, keyData] = await Promise.all([
    read<{ batches: Batch[] }>("/v0/batches", uid, { batches: [] }),
    usage.role === "owner" ? read<{ runs: Run[] }>("/v0/agent/runs?limit=50", uid, { runs: [] }) : Promise.resolve({ runs: [] }),
    usage.role === "owner" ? read<Operations>("/v0/me/operations", uid, EMPTY_OPERATIONS) : Promise.resolve(EMPTY_OPERATIONS),
    usage.role === "owner" ? read<{ keys: Key[] }>("/v0/me/keys", uid, { keys: [] }) : Promise.resolve({ keys: [] }),
  ]);

  const now = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;
  const decisions: Decision[] = [
    ...operationalDecisions(operations),
    ...runData.runs.filter((run) => run.status === "failed").map((run) => ({ id: `run-${run.id}`, urgency: "now" as const, kind: "Agent run", title: run.objective, reason: run.error ?? "The run stopped safely before the next workspace mutation.", owner: "Workspace owner", href: `/runs/${encodeURIComponent(run.id)}`, action: "Resolve and retry" })),
    ...batchData.batches.filter((batch) => batch.counts.flagged > 0).map((batch) => ({ id: `flags-${batch.id}`, urgency: "review" as const, kind: "Changes requested", title: batch.title, reason: `${batch.counts.flagged} item${batch.counts.flagged === 1 ? "" : "s"} need revision before approval can continue.`, owner: "Assigned reviewer or owner", href: `/review?batch=${encodeURIComponent(batch.id)}`, action: "Resolve feedback" })),
    ...batchData.batches.filter((batch) => batch.counts.pending > 0 && batch.counts.flagged === 0).map((batch) => ({ id: `review-${batch.id}`, urgency: "review" as const, kind: "Approval", title: batch.title, reason: `${batch.counts.pending} of ${batch.counts.total} items still need a human decision.`, owner: usage.role === "reviewer" ? "You" : "Owner or reviewer", href: `/review?batch=${encodeURIComponent(batch.id)}`, action: "Review items" })),
    ...runData.runs.filter((run) => run.status === "input_required" && !["human_review", "resolve_review_flags"].includes(run.currentStep)).map((run) => ({ id: `input-${run.id}`, urgency: "review" as const, kind: "Agent approval", title: run.objective, reason: run.currentStep === "confirm_plan" ? "Production is paused until a human approves the exact dry plan." : "The agent needs a human decision before it can continue.", owner: "Workspace owner", href: `/runs/${encodeURIComponent(run.id)}`, action: "Open decision" })),
    ...keyData.keys.filter((key) => key.expiresAt && Date.parse(key.expiresAt) <= sevenDays).map((key) => {
      const expired = Date.parse(key.expiresAt!) <= now;
      return { id: `key-${key.id}`, urgency: expired ? "now" as const : "soon" as const, kind: "Credential", title: `${key.label} ${expired ? "expired" : "expires soon"}`, reason: expired ? "The client is blocked until you create a replacement credential." : `This connection expires ${key.expiresAt!.slice(0, 10)}. Rotate it before the attached client stops.`, owner: "Workspace owner", href: "/dashboard#agent", action: expired ? "Replace credential" : "Rotate credential" };
    }),
  ];
  const urgencyOrder = { now: 0, review: 1, soon: 2 } as const;
  decisions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <WorkspaceHeader context="Decision inbox" active="inbox" plan={usage.user.plan} />
      <JourneyRail active="review" />
      <section className="mt-10 flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow text-signal">ONE PLACE FOR HUMAN ATTENTION</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight">What needs me?</h1><p className="mt-3 max-w-2xl text-muted">Approvals, stopped runs, delivery recovery, and expiring credentials—ordered by consequence, with the person and next action made explicit.</p></div>
        <span className={`border px-3 py-2 font-mono text-[10px] ${decisions.length ? "border-signal/50 text-signal" : "border-green/50 text-green"}`}>{decisions.length ? `${decisions.length} OPEN DECISION${decisions.length === 1 ? "" : "S"}` : "ALL CLEAR"}</span>
      </section>

      {decisions.length === 0 ? (
        <section className="mt-8 border border-green/40 bg-green/[.03] p-6 sm:p-8"><p className="eyebrow text-green">NO DECISIONS WAITING</p><h2 className="mt-3 font-display text-2xl font-bold">The workspace can keep moving.</h2><p className="mt-2 text-sm text-muted">There are no pending approvals or active recovery tasks. Start the next plan, or inspect the audit trail.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/program" className="btn">Plan the next cycle →</a><a href="/activity" className="btn-ghost">Open activity</a></div></section>
      ) : (
        <section className="mt-8 divide-y divide-hairline border border-hairline" aria-label="Open decisions">
          {decisions.map((decision) => (
            <article key={decision.id} className="grid gap-4 bg-panel p-5 sm:grid-cols-[110px_1fr_auto] sm:items-center">
              <div><span className={`inline-block border px-2 py-1 font-mono text-[9px] uppercase ${decision.urgency === "now" ? "border-signal/60 text-signal" : decision.urgency === "review" ? "border-bone/30 text-bone" : "border-hairline text-muted"}`}>{decision.urgency === "now" ? "Fix now" : decision.urgency === "review" ? "Decide" : "Soon"}</span><p className="mt-2 font-mono text-[9px] text-muted">{decision.kind}</p></div>
              <div><h2 className="text-base font-semibold text-bone">{decision.title}</h2><p className="mt-1 text-sm text-muted">{decision.reason}</p><p className="mt-2 font-mono text-[9px] text-muted">RESPONSIBLE · {decision.owner}</p></div>
              <a href={decision.href} className="btn-ghost whitespace-nowrap !px-4 !py-2 text-xs">{decision.action} →</a>
            </article>
          ))}
        </section>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] text-muted"><a href="/review" className="hover:text-bone">FULL REVIEW WORKSPACE →</a><a href="/activity" className="hover:text-bone">AUDIT & OPERATIONS →</a><a href="/sample" className="hover:text-bone">SEE A COMPLETE SAMPLE →</a></div>
    </main>
  );
}
