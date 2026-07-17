"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type ClientId = "openclaw" | "claude" | "http";

const CLIENTS: ReadonlyArray<{ id: ClientId; label: string; detail: string }> = [
  { id: "openclaw", label: "OpenClaw", detail: "Recommended for agent operators" },
  { id: "claude", label: "Claude Code", detail: "Add the hosted server from your terminal" },
  { id: "http", label: "HTTP", detail: "Probe any Streamable HTTP client" },
];

function setupText(client: ClientId, endpoint: string): string {
  const secretPrompt = `read -rsp 'Brandrail API key: ' BRANDRAIL_API_KEY
printf '\\n'
export BRANDRAIL_API_KEY`;
  if (client === "openclaw") {
    const config = JSON.stringify({
      url: endpoint,
      transport: "streamable-http",
      headers: { Authorization: "Bearer ${BRANDRAIL_API_KEY}" },
      connectTimeout: 10,
      timeout: 120,
    });
    return `${secretPrompt}

openclaw mcp set brandrail \\
  '${config}'

openclaw mcp doctor brandrail --probe`;
  }

  if (client === "claude") {
    return `${secretPrompt}

claude mcp add --transport http brandrail '${endpoint}' \\
  --header 'Authorization: Bearer \${BRANDRAIL_API_KEY}'

claude mcp get brandrail`;
  }

  return `${secretPrompt}

curl -X POST '${endpoint}' \\
  -H "Authorization: Bearer \${BRANDRAIL_API_KEY}" \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  --data '{"jsonrpc":"2.0","id":"probe","method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"brandrail-probe","version":"1.0.0"}}}'`;
}

export function McpSetupGuide({ endpoint, apiKey = "brk_…", compact = false }: { endpoint: string; apiKey?: string; compact?: boolean }) {
  const [client, setClient] = useState<ClientId>("openclaw");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<number | null>(null);
  const panelId = useId();
  const text = setupText(client, endpoint);
  const configured = !apiKey.includes("…");

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    if (!configured) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
    }
  }

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % CLIENTS.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + CLIENTS.length) % CLIENTS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = CLIENTS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextClient = CLIENTS[nextIndex]!;
    setClient(nextClient.id);
    setCopyStatus("idle");
    const tab = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-mcp-client="${nextClient.id}"]`);
    tab?.focus();
  }

  return (
    <div className={`overflow-hidden border border-hairline bg-panel ${compact ? "mt-3" : "mt-6"}`}>
      <div className="flex flex-col border-b border-hairline sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 overflow-x-auto" role="tablist" aria-label="MCP client setup">
          {CLIENTS.map((item, index) => (
            <button
              key={item.id}
              id={`${panelId}-${item.id}`}
              data-mcp-client={item.id}
              type="button"
              role="tab"
              tabIndex={client === item.id ? 0 : -1}
              aria-selected={client === item.id}
              aria-controls={panelId}
              onKeyDown={(event) => selectWithKeyboard(event, index)}
              onClick={() => { setClient(item.id); setCopyStatus("idle"); }}
              className={`min-h-12 shrink-0 border-r border-hairline px-4 text-left font-mono text-[10px] uppercase tracking-[0.1em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-bone ${client === item.id ? "bg-signal text-ink" : "text-muted hover:text-bone"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void copy()} disabled={!configured} className="min-h-12 border-t border-hairline px-4 font-mono text-[10px] text-bone hover:text-signal disabled:cursor-not-allowed disabled:text-muted sm:border-l sm:border-t-0">
          {!configured ? "CREATE KEY TO COPY" : copyStatus === "copied" ? "COPIED ✓" : copyStatus === "failed" ? "COPY FAILED" : "COPY SAFE SETUP"}
        </button>
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-${client}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline-soft px-4 py-2 font-mono text-[9px] text-muted">
          <span>{CLIENTS.find((item) => item.id === client)?.detail}</span>
          <span className="text-green">● STREAMABLE HTTP</span>
        </div>
        <pre className={`overflow-x-auto overscroll-x-contain font-mono text-[11px] leading-relaxed text-bone ${compact ? "max-h-72 p-4" : "p-5"}`}>
          <code>{text}</code>
        </pre>
        {!configured && <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-muted">This setup needs a workspace credential. <a href="/login?agent=1" className="text-signal hover:text-bone">Create a minimal key</a> to unlock copying and enter it at the hidden prompt.</p>}
        {configured && <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-muted">Copy the key shown above, run this setup, then paste the key at the hidden prompt. The literal secret stays out of your shell history and saved client configuration.</p>}
        {client === "openclaw" && (
          <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-muted">
            The saved OpenClaw config contains only the environment-variable reference; <span className="font-mono text-bone">doctor --probe</span> verifies the live handshake.
          </p>
        )}
        {client === "claude" && (
          <p className="border-t border-hairline px-4 py-3 text-xs leading-relaxed text-muted">
            This keeps the literal key out of the saved Claude Code connection. Run <span className="font-mono text-bone">claude mcp get brandrail</span> to inspect it.
          </p>
        )}
      </div>
    </div>
  );
}
