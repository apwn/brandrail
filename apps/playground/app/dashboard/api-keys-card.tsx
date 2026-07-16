"use client";

import { useEffect, useState } from "react";
import { McpSetupGuide } from "../components/mcp-setup-guide";
import { MCP_PROTOCOL_VERSION, MCP_REQUIRED_TOOLS } from "@/lib/mcp-meta";

interface KeyRow {
  id: string;
  prefix: string;
  label: string;
  createdAt: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
}

type ProbeResult = {
  protocol: string;
  server: string;
  toolCount: number;
  resourceCount: number | null;
};

type RpcResponse<T> = {
  result?: T;
  error?: { code?: number; message?: string };
};

const SCOPE_GROUPS = [
  { id: "create", label: "Create", scopes: ["brands:read", "brands:write", "assets:read", "assets:render"] },
  { id: "operate", label: "Operate", scopes: ["reviews:read", "reviews:write", "campaigns:read", "campaigns:write", "calendar:read", "publish:schedule"] },
  { id: "measure", label: "Measure", scopes: ["analytics:read", "audit:read"] },
  { id: "webhooks", label: "Manage hooks", scopes: ["webhooks:read", "webhooks:write"], warning: true },
  { id: "publish", label: "Publish now", scopes: ["publish:immediate"], warning: true },
] as const;
const SAFE_SCOPES = SCOPE_GROUPS.flatMap((group) => [...group.scopes]).filter((scope) => scope !== "publish:immediate" && scope !== "webhooks:write");

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
  const [check, setCheck] = useState<"idle" | "running" | "ok" | "failed">("idle");
  const [checkMessage, setCheckMessage] = useState("");
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [scopes, setScopes] = useState<string[]>(SAFE_SCOPES);
  const [expiresInDays, setExpiresInDays] = useState("90");

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
        body: JSON.stringify({ label: label || "my agent", scopes, ...(expiresInDays ? { expiresInDays: Number(expiresInDays) } : {}) }),
      });
      const body = (await res.json()) as { key?: string; error?: string };
      if (!res.ok || !body.key) throw new Error(body.error ?? "couldn't create the key");
      setMinted(body.key);
      setCheck("idle");
      setProbe(null);
      setCheckMessage("");
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

  async function testConnection() {
    if (!minted) return;
    setCheck("running");
    setCheckMessage("");
    setProbe(null);
    try {
      async function call<T>(id: string, method: string, params?: Record<string, unknown>, protocolVersion?: string): Promise<T> {
        const response = await fetch(mcpPath, {
          method: "POST",
          headers: {
            accept: "application/json, text/event-stream",
            "content-type": "application/json",
            authorization: `Bearer ${minted}`,
            ...(protocolVersion ? { "mcp-protocol-version": protocolVersion } : {}),
          },
          body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }),
        });
        const body = await response.json().catch(() => ({})) as RpcResponse<T>;
        if (!response.ok || body.error || !body.result) {
          throw new Error(body.error?.message ?? `MCP returned HTTP ${response.status}`);
        }
        return body.result;
      }

      const initialized = await call<{ protocolVersion: string; serverInfo?: { title?: string; name?: string; version?: string } }>("dashboard-init", "initialize", {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "brandrail-dashboard", version: "1.0.0" },
      });
      await fetch(mcpPath, {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          authorization: `Bearer ${minted}`,
          "mcp-protocol-version": initialized.protocolVersion,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      });
      const toolsResult = await call<{ tools?: Array<{ name: string }> }>("dashboard-tools", "tools/list", undefined, initialized.protocolVersion);
      const tools = toolsResult.tools ?? [];
      const names = new Set(tools.map((tool) => tool.name));
      const missing = MCP_REQUIRED_TOOLS.filter((name) => !names.has(name));
      if (missing.length) throw new Error(`Connection is missing required tools: ${missing.join(", ")}`);
      let resourceCount: number | null = null;
      try {
        const resourcesResult = await call<{ resources?: unknown[] }>("dashboard-resources", "resources/list", undefined, initialized.protocolVersion);
        resourceCount = resourcesResult.resources?.length ?? 0;
      } catch {
        // A deliberately narrow key may omit assets:read while remaining a valid MCP connection.
      }
      setProbe({
        protocol: initialized.protocolVersion,
        server: initialized.serverInfo?.title ?? initialized.serverInfo?.name ?? "Brandrail",
        toolCount: tools.length,
        resourceCount,
      });
      setCheck("ok");
    } catch (cause) {
      setCheck("failed");
      setCheckMessage(cause instanceof Error ? cause.message : "Connection probe failed");
    }
  }

  const remoteUrl = `${origin}${mcpPath}`;

  return (
    <section id="agent" className="relative overflow-hidden border border-signal/60 bg-panel p-5 mt-8 sm:p-7">
      <div className="surface-grid absolute inset-0 opacity-20" aria-hidden />
      <div className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow text-signal">AGENT CONNECTION · {keys.length}/{keyLimit}</p>
        <h2 className="font-display text-2xl font-bold mt-2">Give your agent a brand it cannot break.</h2>
        <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">Connect an MCP client to the same BrandSpec, renderer, durable runs, approvals, calendar and audit rail. Every connection gets only the permissions you choose.</p></div>
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
              <McpSetupGuide endpoint={remoteUrl} apiKey={minted} compact />
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
                <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={testConnection} disabled={check === "running"}>{check === "running" ? "Running MCP handshake…" : check === "ok" ? "Probe again" : "Test hosted connection"}</button>
                {check === "failed" && <span className="font-mono text-[10px] text-signal">{checkMessage}. Check the endpoint, expiry, and selected scopes, then retry.</span>}
                {check === "ok" && probe && <span className="font-mono text-[10px] text-green">✓ {probe.server} · protocol {probe.protocol} · {probe.toolCount} tools · {probe.resourceCount === null ? "resources scoped off" : `${probe.resourceCount} resources`}</span>}
              </div>
            </div>
          )}

          {keys.length > 0 && !minted && <p className="mt-4 border-l-2 border-hairline pl-3 font-mono text-[10px] leading-relaxed text-muted">This connection is active, but its credential is write-only and cannot be shown again. If you lost the configuration, revoke it below and create a replacement.</p>}

          <div className="mt-5 border border-hairline bg-ink/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow text-bone">CONNECTION PERMISSIONS</p><span className="font-mono text-[10px] text-muted">least privilege · editable by replacement</span></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SCOPE_GROUPS.map((group) => {
                const enabled = group.scopes.every((scope) => scopes.includes(scope));
                const warning = "warning" in group && group.warning;
                return <label key={group.id} className={`cursor-pointer border p-3 ${enabled ? warning ? "border-signal bg-signal/5" : "border-green/50 bg-green/5" : "border-hairline"}`}>
                  <span className="flex items-center gap-2 text-xs text-bone"><input type="checkbox" checked={enabled} onChange={() => setScopes((current) => enabled ? current.filter((scope) => !group.scopes.includes(scope as never)) : [...new Set([...current, ...group.scopes])])} />{group.label}</span>
                  <span className="mt-1 block font-mono text-[9px] leading-relaxed text-muted">{group.id === "publish" ? "Can publish immediately after explicit confirmation." : group.id === "webhooks" ? "Can create callbacks and retry failed events." : `${group.scopes.length} scoped capabilities`}</span>
                </label>;
              })}
            </div>
          </div>
          <div className="grid gap-3 mt-3 md:grid-cols-[1fr_150px_auto]">
            <input className="field !py-2" placeholder="connection name (e.g. Claude Desktop)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <select className="field !py-2" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} aria-label="Credential expiry"><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option><option value="">No expiry</option></select>
            <button className="btn !py-2 whitespace-nowrap" onClick={mint} disabled={busy || keys.length >= keyLimit}>
              {busy ? "Connecting…" : keys.length >= keyLimit ? "Connection limit reached" : "+ Connect an agent"}
            </button>
          </div>
          {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}

          {keys.length > 0 && (
            <ul className="mt-4 divide-y divide-hairline">
              {keys.map((k) => (
                <li key={k.id} className="py-3 grid items-center gap-2 sm:grid-cols-[110px_1fr_auto_auto]">
                  <span className="font-mono text-xs text-bone">{k.prefix}…</span>
                  <span><span className="text-muted text-xs block">{k.label}</span><span className="font-mono text-[9px] text-muted">{k.scopes.length} scopes{k.scopes.includes("publish:immediate") ? " · publish now" : " · approval-safe"}</span></span>
                  <span className="font-mono text-[10px] text-muted text-right">{k.lastUsedAt ? `used ${k.lastUsedAt.slice(0, 10)}` : "never used"}<br />{k.expiresAt ? `expires ${k.expiresAt.slice(0, 10)}` : "no expiry"}</span>
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
