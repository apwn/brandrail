"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { trackConversion } from "@/lib/conversion";

export function RunComposer({ brands, openByDefault }: { brands: string[]; openByDefault: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(openByDefault);
  const [objective, setObjective] = useState("");
  const [brand, setBrand] = useState(brands[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (brands.length === 0) {
    return <section className="mt-8 flex flex-col justify-between gap-4 border border-hairline bg-panel p-5 sm:flex-row sm:items-center"><div><p className="eyebrow text-signal">FIRST, GIVE THE AGENT A RAIL</p><p className="mt-2 text-sm text-muted">Compile one brand before starting a durable asset run.</p></div><a href="/" className="btn !px-4 !py-2 text-xs">Compile a brand →</a></section>;
  }

  if (!open) {
    return <div className="mt-8 flex justify-end"><button className="btn !px-4 !py-2 text-xs" onClick={() => setOpen(true)}>+ Start an asset run</button></div>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (objective.trim().length < 3 || !brand) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/agent/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ objective: objective.trim(), brand }) });
      const data = await response.json().catch(() => ({})) as { run?: { id: string }; error?: string };
      if (!response.ok || !data.run?.id) throw new Error(data.error ?? "The run could not be created.");
      trackConversion("agent_run_created", { hasBrand: Boolean(brand) });
      router.push(`/runs/${encodeURIComponent(data.run.id)}`);
    } catch (cause) {
      trackConversion("agent_run_action_failed", { action: "create" });
      setError(cause instanceof Error ? cause.message : "The run could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 border border-signal/35 bg-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-signal">NEW ASSET RUN</p><h2 className="mt-2 font-display text-xl font-bold">Brief the outcome. Approve the plan. Produce.</h2><p className="mt-2 max-w-2xl text-sm text-muted">This starts a durable job, not a chat. Nothing renders until you approve its dry plan, and nothing publishes from this flow.</p></div>{!openByDefault && <button className="font-mono text-[10px] text-muted hover:text-bone" onClick={() => setOpen(false)} aria-label="Close new run form">CLOSE</button>}</div>
      <form className="mt-6 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end" onSubmit={submit}>
        <label><span className="eyebrow text-bone">WHAT SHOULD THE ASSETS ACHIEVE?</span><textarea className="input mt-2 min-h-24 w-full resize-y" required minLength={3} maxLength={500} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Launch our new analytics feature with a sharp five-format social set" /></label>
        <label><span className="eyebrow text-bone">BRAND</span><select className="input mt-2 h-11 w-full" value={brand} onChange={(event) => setBrand(event.target.value)}>{brands.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <button className="btn h-11 whitespace-nowrap !px-5 text-xs" disabled={busy || objective.trim().length < 3}>{busy ? "Creating plan…" : "Create dry plan →"}</button>
        {error && <p className="font-mono text-[10px] text-signal sm:col-span-3" role="alert">{error}</p>}
      </form>
    </section>
  );
}
