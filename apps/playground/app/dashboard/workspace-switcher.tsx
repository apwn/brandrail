"use client";

import { useState } from "react";

export function WorkspaceSwitcher({ workspaces }: { workspaces: Array<{ id: string; label: string; role: "owner" | "reviewer"; active: boolean }> }) {
  const [busy, setBusy] = useState(false);
  async function select(workspaceId: string) {
    setBusy(true);
    const res = await fetch("/api/workspaces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId }) });
    if (res.ok) location.assign("/dashboard");
    else setBusy(false);
  }
  return <select aria-label="Active workspace" disabled={busy} value={workspaces.find((workspace) => workspace.active)?.id} onChange={(event) => void select(event.target.value)} className="border border-hairline bg-panel px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-bone"><option disabled>Workspace</option>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.label} · {workspace.role}</option>)}</select>;
}
