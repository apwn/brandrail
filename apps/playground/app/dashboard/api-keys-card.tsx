"use client";

import { useEffect, useState } from "react";

interface KeyRow {
  id: string;
  prefix: string;
  label: string;
  createdAt: string;
}

/** Self-serve API keys — the agent on-ramp. Mint a key, paste the MCP snippet
 * into your agent, done. The full key is shown exactly once. */
export function ApiKeysCard({ verified, mcpPath = "/api/mcp", keyLimit }: { verified: boolean; mcpPath?: string; keyLimit: number }) {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  async function load() {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(((await res.json()) as { keys: KeyRow[] }).keys);
  }
  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, []);

  async function mint() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label || "my agent" }),
      });
      const body = (await res.json()) as { key?: string; error?: string };
      if (!res.ok || !body.key) throw new Error(body.error ?? "couldn't create the key");
      setMinted(body.key);
      setLabel("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (minted) setMinted(null);
    await load();
  }

  async function copy(text: string, tag: string) {
    await navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  }

  const remoteUrl = `${origin}${mcpPath}`;
  const snippet = (key: string) => JSON.stringify({
    mcpServers: { brandrail: { type: "http", url: remoteUrl, headers: { Authorization: `Bearer ${key}` } } },
  }, null, 2);

  return (
    <section id="agent" className="relative overflow-hidden border border-signal/60 bg-panel p-5 mt-8 sm:p-7">
      <div className="surface-grid absolute inset-0 opacity-20" aria-hidden />
      <div className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow text-signal">AGENT CONNECTION · {keys.length}/{keyLimit}</p>
        <h2 className="font-display text-2xl font-bold mt-2">Give your agent a brand it cannot break.</h2>
        <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">Connect ChatGPT, Claude, Codex, Cursor or any MCP client to the same BrandSpec, renderer, approvals, calendar and audit rail. Free includes one durable connection.</p></div>
        <span className={`font-mono text-[10px] border px-2.5 py-1.5 ${keys.length ? "border-green/40 text-green" : "border-hairline text-muted"}`}>{keys.length ? "● CONNECTED" : "○ NOT CONNECTED"}</span>
      </div>

      {!verified ? (
        <p className="font-mono text-xs text-muted mt-3">Verify your email first — a key is a durable credential.</p>
      ) : (
        <>
          {minted && (
            <div className="border border-signal/50 bg-ink/60 p-3 mt-4">
              <p className="font-mono text-[11px] text-signal mb-2">Copy it now — this is the only time it&rsquo;s shown.</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs text-bone break-all flex-1">{minted}</code>
                <button className="btn-ghost !py-1 !px-2 text-xs whitespace-nowrap" onClick={() => copy(minted, "key")}>
                  {copied === "key" ? "copied ✓" : "copy key"}
                </button>
              </div>
              <p className="font-mono text-[11px] text-muted mt-3 mb-1">Remote MCP config · works from any MCP client:</p>
              <div className="flex items-start gap-2">
                <code className="font-mono text-[11px] text-muted break-all flex-1">{snippet(minted)}</code>
                <button className="btn-ghost !py-1 !px-2 text-xs whitespace-nowrap" onClick={() => copy(snippet(minted), "snippet")}>
                  {copied === "snippet" ? "copied ✓" : "copy"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-3 mt-5 md:grid-cols-[1fr_auto]">
            <input className="field !py-2" placeholder="connection name (e.g. Claude Desktop)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <button className="btn !py-2 whitespace-nowrap" onClick={mint} disabled={busy || keys.length >= keyLimit}>
              {busy ? "Connecting…" : keys.length >= keyLimit ? "Connection limit reached" : "+ Connect an agent"}
            </button>
          </div>
          {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}

          {keys.length > 0 && (
            <ul className="mt-4 divide-y divide-hairline">
              {keys.map((k) => (
                <li key={k.id} className="py-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-bone">{k.prefix}…</span>
                  <span className="text-muted text-xs flex-1">{k.label}</span>
                  <span className="font-mono text-[11px] text-muted">{k.createdAt.slice(0, 10)}</span>
                  <button className="font-mono text-[11px] text-muted hover:text-signal" onClick={() => revoke(k.id)}>revoke</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 grid gap-2 border-t border-hairline pt-4 sm:grid-cols-3">
            {["List my brands and tell me what is ready.", "Dry-run a five-post launch campaign.", "Show me what is waiting for human approval."].map((prompt) => <button key={prompt} onClick={() => copy(prompt, prompt)} className="border border-hairline bg-ink/40 p-3 text-left text-xs text-muted hover:border-signal hover:text-bone"><span className="font-mono text-[9px] text-signal block mb-1">TRY THIS ↗</span>{copied === prompt ? "Copied ✓" : prompt}</button>)}
          </div>
        </>
      )}
      </div>
    </section>
  );
}
