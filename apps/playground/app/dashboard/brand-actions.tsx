"use client";

import { useState } from "react";

export function BrandActions({ brand, canReport, canDelete }: { brand: string; canReport: boolean; canDelete: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Delete ${brand} and all saved BrandSpec versions? Render history is kept.`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/spec", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand }) });
    if (res.ok) location.reload();
    else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
      <a href={`/api/spec?brand=${encodeURIComponent(brand)}`} className="eyebrow hover:text-bone">EXPORT</a>
      {canReport && <a href={`/api/report/${encodeURIComponent(brand)}`} target="_blank" rel="noreferrer" className="eyebrow hover:text-bone">REPORT</a>}
      <a href="/review" className="eyebrow hover:text-bone">USE →</a>
      {canDelete && <button disabled={busy} onClick={remove} className="eyebrow text-muted hover:text-signal">{busy ? "DELETING…" : "DELETE"}</button>}
      {error && <span className="font-mono text-[10px] text-signal">{error}</span>}
    </div>
  );
}
