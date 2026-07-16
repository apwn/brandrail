import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { RunComposer } from "./run-composer";
import { WorkspaceLockup } from "../components/workspace-lockup";

type Run = {
  id: string;
  objective: string;
  brand?: string;
  status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled";
  progress: number;
  currentStep: string;
  updatedAt: string;
};

export const metadata = { title: "Agent runs · Brandrail" };

export default async function AgentRunsPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const [usageResponse, runsResponse, specsResponse] = await Promise.all([
    engine("/v0/me/usage", {}, uid).catch(() => null),
    engine("/v0/agent/runs?limit=100", {}, uid).catch(() => null),
    engine("/v0/specs", {}, uid).catch(() => null),
  ]);
  const usage = usageResponse?.ok ? await usageResponse.json() as { role: "owner" | "reviewer" } : null;
  if (usage?.role !== "owner") redirect("/dashboard");
  const runs = runsResponse?.ok ? (await runsResponse.json() as { runs: Run[] }).runs : [];
  const brands = specsResponse?.ok ? (await specsResponse.json() as { specs: Array<{ name: string; active?: boolean }> }).specs.filter((spec) => spec.active !== false).map((spec) => spec.name) : [];
  const active = runs.filter((run) => ["planning", "working", "input_required"].includes(run.status)).length;
  const waiting = runs.filter((run) => run.status === "input_required").length;
  const failed = runs.filter((run) => run.status === "failed").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <WorkspaceLockup context="Agent runs" />
        <a href="/dashboard" className="btn-ghost !px-3 !py-2 text-xs">← Control room</a>
      </header>

      <section className="mt-12 flex flex-col justify-between gap-8 border-b border-hairline pb-9 sm:flex-row sm:items-end">
        <div className="max-w-2xl"><p className="eyebrow text-signal">DURABLE EXECUTION</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Every agent job. Still on the rail.</h1><p className="mt-4 max-w-xl text-muted">Open a run to see what the agent produced, where a human decision is needed, and whether delivery actually reached the platform.</p></div>
        <div className="grid min-w-72 grid-cols-3 border border-hairline bg-panel">
          <Stat value={active} label="ACTIVE" />
          <Stat value={waiting} label="WAITING" />
          <Stat value={failed} label="FAILED" signal={failed > 0} />
        </div>
      </section>

      <RunComposer brands={brands} openByDefault={runs.length === 0} />

      <section className="mt-8 border border-hairline bg-panel">
        {runs.length === 0 ? <div className="p-8"><p className="font-display text-xl font-bold">No durable runs yet.</p><p className="mt-2 max-w-lg text-sm text-muted">Start one through MCP, the SDK, or <span className="font-mono text-bone">brandrail agent start</span>. It will appear here as soon as the plan is created.</p><a href="/agents" className="mt-5 inline-block font-mono text-[10px] text-signal hover:text-bone">OPEN AGENT SETUP →</a></div> : <div className="divide-y divide-hairline">
          {runs.map((run) => <a key={run.id} href={`/runs/${encodeURIComponent(run.id)}`} className="group grid gap-4 px-5 py-5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[1fr_130px_110px_110px_18px] sm:items-center">
            <div><p className="text-sm text-bone group-hover:text-white">{run.objective}</p><p className="mt-1 font-mono text-[10px] text-muted">{run.brand ?? "brand pending"} · {run.id}</p></div>
            <div><p className={`font-mono text-[10px] ${run.status === "failed" ? "text-signal" : run.status === "completed" ? "text-green" : "text-bone"}`}>{run.status.replace("_", " ").toUpperCase()}</p><p className="mt-1 font-mono text-[9px] text-muted">{run.currentStep.replaceAll("_", " ")}</p></div>
            <div><div className="h-1 bg-hairline"><div className={`h-full ${run.status === "completed" ? "bg-green" : "bg-signal"}`} style={{ width: `${Math.max(2, run.progress)}%` }} /></div><p className="mt-1 text-right font-mono text-[9px] text-muted">{run.progress}%</p></div>
            <time className="font-mono text-[9px] text-muted" dateTime={run.updatedAt}>{new Date(run.updatedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time>
            <span className="text-muted group-hover:text-signal" aria-hidden>→</span>
          </a>)}
        </div>}
      </section>
      <p className="mt-4 font-mono text-[10px] text-muted">Latest {runs.length} runs · workspace-scoped · owner-only controls</p>
    </main>
  );
}

function Stat({ value, label, signal }: { value: number; label: string; signal?: boolean }) {
  return <div className="border-r border-hairline px-4 py-4 text-center last:border-0"><p className={`font-display text-2xl font-bold ${signal ? "text-signal" : "text-bone"}`}>{value}</p><p className="mt-1 font-mono text-[8px] text-muted">{label}</p></div>;
}
