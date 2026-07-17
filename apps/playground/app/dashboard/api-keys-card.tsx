"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { McpSetupGuide } from "../components/mcp-setup-guide";
import { ConceptHelp } from "../components/concept-help";
import { MCP_PROTOCOL_VERSION } from "@/lib/mcp-meta";
import { trackConversion } from "@/lib/conversion";

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

type MintedCredential = {
  key: string;
  id: string;
  scopes: string[];
};

type RpcResponse<T> = {
  result?: T;
  error?: { code?: number; message?: string };
};

const SCOPE_GROUPS = [
  { id: "observe", label: "Observe", scopes: ["brands:read", "assets:read", "campaigns:read"], detail: "Read brands, renders, and run state." },
  { id: "prepare", label: "Plan & render", scopes: ["plans:write", "assets:read", "assets:render", "campaigns:read"], detail: "Create dry plans, resume runs, and read produced assets." },
  { id: "brands", label: "Manage brands", scopes: ["brands:read", "brands:write"], detail: "Read, compile, and change BrandSpecs." },
  { id: "workflow", label: "Manage workflow", scopes: ["campaigns:read", "campaigns:write", "reviews:read", "reviews:write"], detail: "Read and change campaigns and review queues.", minPlan: "studio" },
  { id: "delivery", label: "Schedule delivery", scopes: ["channels:read", "calendar:read", "publish:schedule"], detail: "Schedule human-approved work.", minPlan: "studio" },
  { id: "analytics", label: "Read analytics", scopes: ["analytics:read"], detail: "Read performance and campaign outcomes.", minPlan: "studio" },
  { id: "audit", label: "Read audit", scopes: ["audit:read"], detail: "Inspect human and agent mutations." },
  { id: "webhooks", label: "Manage hooks", scopes: ["webhooks:read", "webhooks:write"], detail: "Create callbacks and retry deliveries.", warning: true, minPlan: "agency" },
  { id: "publish", label: "Publish now", scopes: ["publish:immediate"], detail: "Add immediate delivery to the approved scheduling permission.", warning: true, minPlan: "studio" },
] as const;
const SAFE_SCOPES = ["brands:read", "assets:read", "campaigns:read", "plans:write", "assets:render"];
const PROBE_TOOLS: ReadonlyArray<{ name: string; scope?: string }> = [
  { name: "get_usage" },
  { name: "list_brands", scope: "brands:read" },
  { name: "list_renders", scope: "assets:read" },
  { name: "render_assets", scope: "assets:render" },
  { name: "start_campaign_run", scope: "plans:write" },
  { name: "list_agent_runs", scope: "campaigns:read" },
];
const DELIVERY_SCOPES = ["channels:read", "calendar:read", "publish:schedule"];
const TRUST_PRESETS = [
  { id: "observe", label: "Observe", detail: "Read the workspace and audit trail. No plans or assets are created.", scopes: ["brands:read", "assets:read", "campaigns:read", "audit:read"] },
  { id: "recommend", label: "Recommend", detail: "Inspect context and create dry plans that still require approval.", scopes: ["brands:read", "assets:read", "campaigns:read", "audit:read", "plans:write"] },
  { id: "draft", label: "Produce drafts", detail: "Create approved assets, but never schedule or publish them.", scopes: ["brands:read", "assets:read", "campaigns:read", "audit:read", "plans:write", "assets:render"] },
  { id: "schedule", label: "Schedule approved", detail: "Manage review and schedule only work carrying a human approval.", scopes: ["brands:read", "assets:read", "assets:render", "campaigns:read", "campaigns:write", "reviews:read", "reviews:write", "plans:write", "channels:read", "calendar:read", "publish:schedule"], minPlan: "studio" },
  { id: "operate", label: "Operate automatically", detail: "May deliver immediately after every other Brandrail safeguard passes.", scopes: ["brands:read", "assets:read", "assets:render", "campaigns:read", "campaigns:write", "reviews:read", "reviews:write", "plans:write", "channels:read", "calendar:read", "publish:schedule", "publish:immediate", "analytics:read", "audit:read"], minPlan: "studio", warning: true },
] as const;

function sameScopes(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((scope) => right.includes(scope));
}

/** Self-serve API keys — the agent on-ramp. Mint a key, paste the MCP snippet
 * into your agent, done. The full key is shown exactly once. */
export function ApiKeysCard({ verified, mcpPath = "/api/mcp", keyLimit, plan }: { verified: boolean; mcpPath?: string; keyLimit: number; plan: "free" | "studio" | "agency" }) {
  const router = useRouter();
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<MintedCredential | null>(null);
  const [keysLoading, setKeysLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [check, setCheck] = useState<"idle" | "running" | "ok" | "failed">("idle");
  const [checkMessage, setCheckMessage] = useState("");
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [scopes, setScopes] = useState<string[]>(SAFE_SCOPES);
  const [expiresInDays, setExpiresInDays] = useState("90");
  const copyResetTimer = useRef<number | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/keys");
      const body = await res.json().catch(() => ({})) as { keys?: KeyRow[]; error?: string };
      if (!res.ok || !body.keys) throw new Error(body.error ?? "Agent connections could not be loaded.");
      setKeys(body.keys);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agent connections could not be loaded.");
    } finally {
      setKeysLoading(false);
    }
  }
  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
    return () => {
      if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
    };
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
      const body = (await res.json()) as { key?: string; id?: string; scopes?: string[]; error?: string };
      if (!res.ok || !body.key || !body.id || !body.scopes) throw new Error(body.error ?? "couldn't create the key");
      setMinted({ key: body.key, id: body.id, scopes: body.scopes });
      setCheck("idle");
      setProbe(null);
      setCheckMessage("");
      setLabel("");
      await load();
      trackConversion("agent_key_created", { scopeCount: body.scopes.length, expiresInDays: expiresInDays ? Number(expiresInDays) : 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const key = keys.find((item) => item.id === id);
    if (!window.confirm(`Revoke ${key?.label ?? "this agent connection"}? The client will stop working immediately.`)) return;
    setRevokingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "The connection could not be revoked.");
      if (minted?.id === id) setMinted(null);
      await load();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The connection could not be revoked.");
    } finally {
      setRevokingId(null);
    }
  }

  async function copy(text: string, tag: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Clipboard access failed. Select and copy the text manually.");
    }
  }

  function toggleScopeGroup(group: (typeof SCOPE_GROUPS)[number], enabled: boolean) {
    setScopes((current) => {
      if (group.id === "publish") {
        return enabled
          ? current.filter((scope) => scope !== "publish:immediate")
          : [...new Set([...current, ...DELIVERY_SCOPES, "publish:immediate"])];
      }
      if (group.id === "delivery" && enabled) {
        return current.filter((scope) => !group.scopes.includes(scope as never) && scope !== "publish:immediate");
      }
      if (!enabled) return [...new Set([...current, ...group.scopes])];
      const stillEnabledGroups = SCOPE_GROUPS.filter((candidate) => candidate.id !== group.id && candidate.scopes.every((scope) => current.includes(scope)));
      return [...new Set([
        ...current.filter((scope) => !group.scopes.includes(scope as never)),
        ...stillEnabledGroups.flatMap((candidate) => candidate.scopes),
      ])];
    });
  }

  function applyTrustPreset(preset: (typeof TRUST_PRESETS)[number]) {
    setScopes([...preset.scopes]);
    trackConversion("agent_trust_preset_selected", { preset: preset.id });
  }

  async function testConnection() {
    if (!minted) return;
    const credential = minted;
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
            authorization: `Bearer ${credential.key}`,
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
          authorization: `Bearer ${credential.key}`,
          "mcp-protocol-version": initialized.protocolVersion,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      });
      const toolsResult = await call<{ tools?: Array<{ name: string }> }>("dashboard-tools", "tools/list", undefined, initialized.protocolVersion);
      const tools = toolsResult.tools ?? [];
      const names = new Set(tools.map((tool) => tool.name));
      const expectedTools = PROBE_TOOLS.filter((entry) => !entry.scope || credential.scopes.includes(entry.scope)).map((entry) => entry.name);
      const missing = expectedTools.filter((name) => !names.has(name));
      if (missing.length) throw new Error(`Connection is missing required tools: ${missing.join(", ")}`);
      await call("dashboard-read", "tools/call", { name: credential.scopes.includes("brands:read") ? "list_brands" : "get_usage", arguments: {} }, initialized.protocolVersion);
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
      trackConversion("agent_probe_completed", { toolCount: tools.length, resourcesEnabled: resourceCount !== null });
      await load();
      router.refresh();
    } catch (cause) {
      setCheck("failed");
      trackConversion("agent_probe_failed");
      setCheckMessage(cause instanceof Error ? cause.message : "Connection probe failed");
    }
  }

  const remoteUrl = `${origin}${mcpPath}`;
  const currentTime = Date.now();
  const activeKeys = keys.filter((key) => !key.expiresAt || Date.parse(key.expiresAt) > currentTime);
  const credentialUsed = activeKeys.some((key) => Boolean(key.lastUsedAt));
  const verifiedConnection = check === "ok" || credentialUsed;
  const connectionLabel = check === "ok" ? "● MCP VERIFIED" : credentialUsed ? "● CREDENTIAL ACTIVE" : activeKeys.length ? "◐ CREDENTIAL READY" : "○ NOT CONNECTED";
  const selectedPreset = TRUST_PRESETS.find((preset) => sameScopes(preset.scopes, scopes));

  return (
    <section id="agent" className="relative overflow-hidden border border-signal/60 bg-panel p-5 mt-8 sm:p-7">
      <div className="surface-grid absolute inset-0 opacity-20" aria-hidden />
      <div className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="eyebrow text-signal">AGENT CONNECTION · {keys.length}/{keyLimit}</p>
        <h2 className="font-display text-2xl font-bold mt-2">Give your agent a brand it cannot break.</h2>
        <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">Connect an MCP client to the same BrandSpec, renderer, durable runs, approvals, calendar and audit rail. Every connection gets only the permissions you choose.</p></div>
        <span aria-live="polite" className={`font-mono text-[10px] border px-2.5 py-1.5 ${verifiedConnection ? "border-green/40 text-green" : activeKeys.length ? "border-signal/50 text-signal" : "border-hairline text-muted"}`}>{connectionLabel}</span>
      </div>

      {!verified ? (
        <p className="font-mono text-xs text-muted mt-3">Verify your email first — a key is a durable credential.</p>
      ) : (
        <>
          {minted && (
            <div className="border border-signal/50 bg-ink/60 p-3 mt-4">
              <p className="font-mono text-[11px] text-signal mb-2">Copy it now — this is the only time it&rsquo;s shown.</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs text-bone break-all flex-1">{minted.key}</code>
                <button type="button" className="btn-ghost !py-1 !px-2 text-xs whitespace-nowrap" onClick={() => copy(minted.key, "key")}>
                  {copied === "key" ? "copied ✓" : "copy key"}
                </button>
              </div>
              <p className="mt-2 font-mono text-[9px] text-muted">Created with {minted.scopes.length} exact permissions. The probe will test this saved set even if you change the next-key selections below.</p>
              <McpSetupGuide endpoint={remoteUrl} apiKey={minted.key} compact />
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-hairline pt-3">
                <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={testConnection} disabled={check === "running"}>{check === "running" ? "Running MCP handshake…" : check === "ok" ? "Probe again" : "Test hosted connection"}</button>
                {check === "failed" && <span role="alert" className="font-mono text-[10px] text-signal">{checkMessage}. Check the endpoint, expiry, and selected scopes, then retry.</span>}
                {check === "ok" && probe && <span role="status" className="font-mono text-[10px] text-green">✓ {probe.server} · protocol {probe.protocol} · {probe.toolCount} tools · {probe.resourceCount === null ? "resources scoped off" : `${probe.resourceCount} resources`}</span>}
              </div>
            </div>
          )}

          {keys.length > 0 && !minted && <p className="mt-4 border-l-2 border-hairline pl-3 font-mono text-[10px] leading-relaxed text-muted">A credential exists, but the secret cannot be shown again. “MCP verified” appears only after a client successfully uses it. If you lost the configuration, revoke it below and create a replacement.</p>}

          <fieldset className="mt-5 border border-hairline bg-ink/35 p-4">
            <legend className="px-1 eyebrow text-bone">HOW MUCH MAY THIS AGENT DO?</legend>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">Choose the closest trust level. Brandrail translates it into exact, revocable permissions below; you can still customize them.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {TRUST_PRESETS.map((preset) => {
                const locked = "minPlan" in preset && preset.minPlan === "studio" && plan === "free";
                const selected = selectedPreset?.id === preset.id;
                const warning = "warning" in preset && preset.warning;
                return <button type="button" key={preset.id} disabled={locked} aria-pressed={selected} onClick={() => applyTrustPreset(preset)} className={`min-h-28 border p-3 text-left disabled:cursor-not-allowed disabled:opacity-45 ${selected ? warning ? "border-signal bg-signal/10" : "border-green/60 bg-green/5" : "border-hairline hover:border-bone/50"}`}>
                  <span className="flex items-start justify-between gap-2 text-xs font-semibold text-bone"><span>{preset.label}</span>{locked && <span className="font-mono text-[8px] text-signal">STUDIO</span>}</span>
                  <span className="mt-2 block font-mono text-[9px] leading-relaxed text-muted">{preset.detail}</span>
                </button>;
              })}
            </div>
            {!selectedPreset && <p className="mt-3 font-mono text-[9px] text-signal">CUSTOM TRUST LEVEL · review the exact permissions below</p>}
          </fieldset>

          <details className="mt-3 border border-hairline bg-ink/35 p-4">
            <summary className="cursor-pointer text-xs font-semibold text-bone">Customize exact permissions <span className="ml-1 font-normal text-muted">· {scopes.length} selected</span></summary>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="eyebrow text-bone">EXACT CONNECTION PERMISSIONS <ConceptHelp concept="scopedKey" /></div><span className="font-mono text-[10px] text-muted">least privilege · editable by replacement</span></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCOPE_GROUPS.map((group) => {
                const enabled = group.scopes.every((scope) => scopes.includes(scope));
                const warning = "warning" in group && group.warning;
                const requiredPlan = "minPlan" in group ? group.minPlan : null;
                const locked = requiredPlan ? (requiredPlan === "agency" ? plan !== "agency" : plan === "free") : false;
                return <label key={group.id} className={`border p-3 ${locked ? "cursor-not-allowed border-hairline opacity-50" : `cursor-pointer ${enabled ? warning ? "border-signal bg-signal/5" : "border-green/50 bg-green/5" : "border-hairline"}`}`}>
                  <span className="flex items-center gap-2 text-xs text-bone"><input type="checkbox" checked={enabled} disabled={locked} onChange={() => toggleScopeGroup(group, enabled)} />{group.label}{locked && requiredPlan && <span className="ml-auto font-mono text-[8px] text-signal">{requiredPlan.toUpperCase()}</span>}</span>
                  <span className="mt-1 block font-mono text-[9px] leading-relaxed text-muted">{group.detail}</span>
                </label>;
              })}
            </div>
          </details>
          <div className="grid gap-3 mt-3 md:grid-cols-[1fr_150px_auto]">
            <input aria-label="Connection name" className="field !py-2" placeholder="connection name (e.g. Claude Desktop)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <select className="field !py-2" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} aria-label="Credential expiry"><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option><option value="">No expiry</option></select>
            <button type="button" className="btn !py-2 whitespace-nowrap" onClick={mint} disabled={keysLoading || busy || scopes.length === 0 || keys.length >= keyLimit}>
              {keysLoading ? "Loading connections…" : busy ? "Connecting…" : keys.length >= keyLimit ? "Connection limit reached" : scopes.length === 0 ? "Select a permission" : "+ Connect an agent"}
            </button>
          </div>
          {error && <p role="alert" className="text-signal font-mono text-xs mt-2">{error}</p>}

          {keys.length > 0 && (
            <ul className="mt-4 divide-y divide-hairline">
              {keys.map((k) => (
                <li key={k.id} className="py-3 grid items-center gap-2 sm:grid-cols-[110px_1fr_auto_auto]">
                  <span className="font-mono text-xs text-bone">{k.prefix}…</span>
                  <span><span className="text-muted text-xs block">{k.label}</span><span className="font-mono text-[9px] text-muted">{k.lastUsedAt ? "credential active" : "credential only"}{k.scopes.includes("publish:immediate") ? " · immediate delivery" : " · no unreviewed delivery"}</span><details className="mt-1"><summary className="cursor-pointer font-mono text-[9px] text-signal">{k.scopes.length} exact scopes</summary><span className="mt-1 block break-words font-mono text-[9px] leading-relaxed text-muted">{k.scopes.join(" · ")}</span></details></span>
                  <span className="font-mono text-[10px] text-muted text-right">{k.lastUsedAt ? `used ${k.lastUsedAt.slice(0, 10)}` : "never used"}<br />{k.expiresAt ? `expires ${k.expiresAt.slice(0, 10)}` : "no expiry"}</span>
                  <button type="button" disabled={revokingId === k.id} className="font-mono text-[11px] text-muted hover:text-signal disabled:opacity-50" onClick={() => revoke(k.id)}>{revokingId === k.id ? "revoking…" : "revoke"}</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-hairline pt-4"><div className="mb-2 font-mono text-[9px] uppercase text-muted">Safe starting prompts <ConceptHelp concept="dryPlan" /></div><div className="grid gap-2 sm:grid-cols-3">
            {["List my brands and tell me what is ready.", "Dry-run a five-post launch campaign.", "Show me what is waiting for human approval."].map((prompt) => <button type="button" key={prompt} onClick={() => copy(prompt, prompt)} className="border border-hairline bg-ink/40 p-3 text-left text-xs text-muted hover:border-signal hover:text-bone"><span className="font-mono text-[9px] text-signal block mb-1">TRY THIS ↗</span>{copied === prompt ? "Copied ✓" : prompt}</button>)}
          </div>
          </div>
        </>
      )}
      </div>
    </section>
  );
}
