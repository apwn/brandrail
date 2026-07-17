import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { WorkspaceHeader } from "../components/workspace-header";

type Event = { id: string; action: string; actor: "agent" | "user" | "reviewer" | "system"; actorId: string; path: string; method: string; status: number; createdAt: string };
type Operations = {
  attentionRequired: number;
  checkedAt?: string;
  deliveries: { failedRecent?: number; overdue?: number; stuckPublishing?: number; disconnected?: number };
  runs: { failedRecent?: number; waitingForHuman?: number };
  credentials: { expired?: number; expiringWithinSevenDays?: number };
  webhooks: { dead?: number; retrying?: number };
};

const EMPTY_OPERATIONS: Operations = { attentionRequired: 0, deliveries: {}, runs: {}, credentials: {}, webhooks: {} };

export const metadata = { title: "Activity · Brandrail" };

export default async function ActivityPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login?return=%2Factivity");
  const [auditResponse, operationsResponse] = await Promise.all([
    engine("/v0/me/audit?limit=100", {}, uid).catch(() => null),
    engine("/v0/me/operations", {}, uid).catch(() => null),
  ]);
  const events = auditResponse?.ok ? ((await auditResponse.json()) as { events: Event[] }).events : [];
  const operations = operationsResponse?.ok ? (await operationsResponse.json()) as Operations : EMPTY_OPERATIONS;
  const operationalSignals = [
    ["Failed delivery", operations.deliveries.failedRecent ?? 0, "/calendar"],
    ["Overdue / stuck", (operations.deliveries.overdue ?? 0) + (operations.deliveries.stuckPublishing ?? 0), "/calendar"],
    ["Disconnected", operations.deliveries.disconnected ?? 0, "/dashboard#channels"],
    ["Failed run", operations.runs.failedRecent ?? 0, "/runs"],
    ["Credential", (operations.credentials.expired ?? 0) + (operations.credentials.expiringWithinSevenDays ?? 0), "/dashboard#agent"],
    ["Webhook", (operations.webhooks.dead ?? 0) + (operations.webhooks.retrying ?? 0), "/dashboard#webhooks"],
  ] as const;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <WorkspaceHeader context="Activity" active="activity" />
      <div className="mt-12 max-w-2xl"><p className="eyebrow text-signal">HUMAN OVERSIGHT</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Every agent action leaves a rail.</h1><p className="mt-3 text-muted">Recent workspace mutations, who initiated them, and whether the engine accepted them. Read-only requests are intentionally excluded.</p></div>
      <section className={`mt-8 border p-5 ${operations.attentionRequired ? "border-signal/60 bg-signal/[.04]" : "border-green/40 bg-green/[.03]"}`} aria-labelledby="operations-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow text-bone">OPERATIONS</p><h2 id="operations-heading" className="mt-2 font-display text-xl font-bold">{operations.attentionRequired ? `${operations.attentionRequired} issue${operations.attentionRequired === 1 ? "" : "s"} need attention` : "Delivery systems are clear"}</h2></div><span className={`font-mono text-[10px] ${operations.attentionRequired ? "text-signal" : "text-green"}`}>{operations.attentionRequired ? "RECOVERY NEEDED" : "NO ACTIVE ALERTS"}</span></div>
        <div className="mt-5 grid gap-px border border-hairline bg-hairline sm:grid-cols-3 lg:grid-cols-6">{operationalSignals.map(([label, value, href]) => <a key={label} href={href} className="bg-panel p-3 hover:bg-white/[.025]"><span className={`font-display text-xl font-bold ${value ? "text-signal" : "text-bone"}`}>{value}</span><span className="mt-1 block font-mono text-[8px] uppercase text-muted">{label}</span></a>)}</div>
        <p className="mt-3 font-mono text-[9px] leading-relaxed text-muted">Failed counts cover the last seven days. Overdue work, disconnected destinations, expired credentials and exhausted webhooks remain visible until resolved.</p>
      </section>
      <section className="mt-9 overflow-hidden border border-hairline">
        {events.length === 0 ? <p className="p-6 text-sm text-muted">No mutations yet. Compile a brand, connect an agent, or render an asset and it will appear here.</p> : events.map((event) => (
          <article key={event.id} className="grid gap-2 border-b border-hairline-soft bg-panel px-4 py-4 last:border-0 sm:grid-cols-[110px_1fr_auto] sm:items-center">
            <span className={`w-fit border px-2 py-1 font-mono text-[9px] uppercase ${event.actor === "agent" ? "border-signal/50 text-signal" : "border-hairline text-muted"}`}>{event.actor}</span>
            <div><p className="text-sm text-bone">{event.action.replaceAll(".", " ")}</p><p className="mt-1 font-mono text-[10px] text-muted">{event.method} {event.path} · HTTP {event.status}</p></div>
            <time className="font-mono text-[10px] text-muted" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</time>
          </article>
        ))}
      </section>
      <p className="mt-4 font-mono text-[10px] text-muted">Latest 100 events · workspace-scoped · retained locally in this release</p>
    </main>
  );
}
