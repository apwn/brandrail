"use client";

import { useEffect, useState } from "react";

type Hook = { id: string; url: string; events: string[]; active: boolean; createdAt: string };

export function WebhooksCard() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() { const res = await fetch("/api/webhooks"); if (res.ok) { const body = await res.json() as { webhooks: Hook[]; events: string[] }; setHooks(body.webhooks); setEvents(body.events); } }
  useEffect(() => { void load(); }, []);
  async function add() {
    setError(null); setSecret(null);
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, events }) });
    const body = await res.json() as { webhook?: Hook & { secret?: string }; error?: string };
    if (!res.ok) { setError(body.error ?? "Could not add webhook"); return; }
    setSecret(body.webhook?.secret ?? null); setUrl(""); await load();
  }
  async function remove(id: string) { await fetch(`/api/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }
  return <section className="panel p-5 mt-4">
    <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-bone">AGENT EVENTS · SIGNED WEBHOOKS</p><p className="mt-2 text-sm text-muted">Resume external workflows when review, publishing, analytics or workspace state changes. Payloads are HMAC-SHA256 signed.</p></div><span className="font-mono text-[10px] text-green">STUDIO</span></div>
    {secret && <div className="mt-4 border border-signal/50 bg-ink p-3"><p className="font-mono text-[10px] text-signal">COPY THE SIGNING SECRET NOW</p><code className="mt-2 block break-all font-mono text-xs text-bone">{secret}</code></div>}
    <div className="mt-4 flex gap-2"><input className="field !py-2" type="url" placeholder="https://automation.example.com/brandrail" value={url} onChange={(event) => setUrl(event.target.value)} /><button className="btn !py-2 whitespace-nowrap" onClick={add} disabled={!url || events.length === 0}>+ Add endpoint</button></div>
    {error && <p className="mt-2 font-mono text-xs text-signal">{error}</p>}
    {hooks.length > 0 && <ul className="mt-4 divide-y divide-hairline">{hooks.map((hook) => <li key={hook.id} className="flex items-center gap-3 py-3"><span className="h-2 w-2 bg-green" /><div className="min-w-0 flex-1"><p className="truncate font-mono text-xs text-bone">{hook.url}</p><p className="mt-1 font-mono text-[9px] text-muted">{hook.events.join(" · ")}</p></div><button className="font-mono text-[10px] text-muted hover:text-signal" onClick={() => remove(hook.id)}>remove</button></li>)}</ul>}
  </section>;
}
