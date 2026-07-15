"use client";

import { useEffect, useState } from "react";

type Hook = { id: string; url: string; events: string[]; active: boolean; createdAt: string };
type Delivery = { id: string; webhookId: string; event: string; status: "pending" | "delivering" | "dead"; attempts: number; nextAttemptAt: string; lastError?: string; updatedAt: string };

export function WebhooksCard() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  async function load() { const res = await fetch("/api/webhooks"); if (res.ok) { const body = await res.json() as { webhooks: Hook[]; events: string[]; deliveries?: Delivery[] }; setHooks(body.webhooks); setEvents(body.events); setDeliveries(body.deliveries ?? []); } }
  useEffect(() => { void load(); }, []);
  async function add() {
    setError(null); setSecret(null);
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, events }) });
    const body = await res.json() as { webhook?: Hook & { secret?: string }; error?: string };
    if (!res.ok) { setError(body.error ?? "Could not add webhook"); return; }
    setSecret(body.webhook?.secret ?? null); setUrl(""); await load();
  }
  async function remove(id: string) { await fetch(`/api/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }
  async function retry(id: string) {
    setRetrying(id); setError(null);
    try {
      const res = await fetch(`/api/webhooks/deliveries/${encodeURIComponent(id)}/retry`, { method: "POST" });
      const body = await res.json() as { error?: string };
      if (!res.ok) setError(body.error ?? "Could not retry delivery");
      await load();
    } catch {
      setError("Could not reach the delivery service. Please retry.");
    } finally {
      setRetrying(null);
    }
  }
  const dead = deliveries.filter((delivery) => delivery.status === "dead").length;
  const active = deliveries.length - dead;
  return <section className="panel p-5 mt-4">
    <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-bone">AGENT EVENTS · SIGNED WEBHOOKS</p><p className="mt-2 text-sm text-muted">Resume external workflows when review, publishing, analytics or workspace state changes. Events are signed, persisted and retried automatically.</p></div><span className={`font-mono text-[10px] whitespace-nowrap ${dead ? "text-signal" : active ? "text-bone" : "text-green"}`}>{dead ? `${dead} NEED ATTENTION` : active ? `${active} RETRYING` : "DELIVERY CLEAR"}</span></div>
    {secret && <div className="mt-4 border border-signal/50 bg-ink p-3"><p className="font-mono text-[10px] text-signal">COPY THE SIGNING SECRET NOW</p><code className="mt-2 block break-all font-mono text-xs text-bone">{secret}</code></div>}
    <div className="mt-4 flex gap-2"><input className="field !py-2" type="url" placeholder="https://automation.example.com/brandrail" value={url} onChange={(event) => setUrl(event.target.value)} /><button className="btn !py-2 whitespace-nowrap" onClick={add} disabled={!url || events.length === 0}>+ Add endpoint</button></div>
    {error && <p className="mt-2 font-mono text-xs text-signal">{error}</p>}
    {hooks.length > 0 && <ul className="mt-4 divide-y divide-hairline">{hooks.map((hook) => <li key={hook.id} className="flex items-center gap-3 py-3"><span className="h-2 w-2 bg-green" /><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs text-bone">{hook.url}</p><p className="mt-1 font-mono text-[9px] text-muted">{hook.events.join(" · ")}</p></div><button className="font-mono text-[10px] text-muted hover:text-signal" onClick={() => remove(hook.id)}>remove</button></li>)}</ul>}
    {deliveries.length > 0 && <div className="mt-4 border-t border-hairline pt-4"><div className="flex items-center justify-between"><p className="eyebrow text-bone">DELIVERY HEALTH</p><span className="font-mono text-[9px] text-muted">LAST {deliveries.length}</span></div><ul className="mt-2 divide-y divide-hairline">{deliveries.slice(0, 5).map((delivery) => <li key={delivery.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><p className={`font-mono text-[10px] ${delivery.status === "dead" ? "text-signal" : "text-bone"}`}>{delivery.event} · {delivery.status === "dead" ? "exhausted" : `attempt ${delivery.attempts + 1}`}</p><p className="mt-1 truncate font-mono text-[9px] text-muted">{delivery.lastError ?? `Next attempt ${delivery.nextAttemptAt.slice(0, 16).replace("T", " ")} UTC`}</p></div>{delivery.status === "dead" ? <button className="btn-ghost !px-3 !py-1.5 text-[10px]" onClick={() => retry(delivery.id)} disabled={retrying === delivery.id}>{retrying === delivery.id ? "Retrying…" : "Retry now"}</button> : <span className="font-mono text-[9px] text-muted">AUTO</span>}</li>)}</ul></div>}
  </section>;
}
