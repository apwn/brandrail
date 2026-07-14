import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";

type Event = { id: string; action: string; actor: "agent" | "user" | "reviewer" | "system"; actorId: string; path: string; method: string; status: number; createdAt: string };

export const metadata = { title: "Activity · Brandrail" };

export default async function ActivityPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const res = await engine("/v0/me/audit?limit=100", {}, uid);
  const events = res.ok ? ((await res.json()) as { events: Event[] }).events : [];
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="rail w-10" aria-hidden /><a href="/" className="font-display font-bold text-lg">brandrail</a><span className="eyebrow">ACTIVITY</span></div>
        <a href="/dashboard" className="btn-ghost !px-3 !py-2 text-xs">← Control room</a>
      </header>
      <div className="mt-12 max-w-2xl"><p className="eyebrow text-signal">HUMAN OVERSIGHT</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Every agent action leaves a rail.</h1><p className="mt-3 text-muted">Recent workspace mutations, who initiated them, and whether the engine accepted them. Read-only requests are intentionally excluded.</p></div>
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
