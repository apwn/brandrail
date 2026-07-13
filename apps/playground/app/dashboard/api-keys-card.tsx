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
export function ApiKeysCard({ verified }: { verified: boolean }) {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(((await res.json()) as { keys: KeyRow[] }).keys);
  }
  useEffect(() => {
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

  const engineUrl = typeof window !== "undefined" ? `${location.protocol}//${location.host}` : "https://api.brandrail.dev";
  const snippet = (key: string) =>
    `claude mcp add brandrail -e BRANDRAIL_API_URL=${engineUrl} -e BRANDRAIL_API_KEY=${key} -- npx -y @brandrail/mcp`;

  return (
    <section id="api-keys" className="panel p-5 mt-4">
      <p className="eyebrow text-bone">API KEYS · GIVE THIS TO YOUR AGENT</p>
      <p className="text-muted text-sm mt-2">
        A key lets any agent — Claude, Cursor, n8n, your own — compile and render through <b className="text-bone">your</b> workspace via MCP, CLI or the REST API.
      </p>

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
              <p className="font-mono text-[11px] text-muted mt-3 mb-1">Point Claude at it:</p>
              <div className="flex items-start gap-2">
                <code className="font-mono text-[11px] text-muted break-all flex-1">{snippet(minted)}</code>
                <button className="btn-ghost !py-1 !px-2 text-xs whitespace-nowrap" onClick={() => copy(snippet(minted), "snippet")}>
                  {copied === "snippet" ? "copied ✓" : "copy"}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <input className="field !py-2" placeholder="key label (e.g. n8n prod)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <button className="btn !py-2 whitespace-nowrap" onClick={mint} disabled={busy}>
              {busy ? "Creating…" : "+ New key"}
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
        </>
      )}
    </section>
  );
}
