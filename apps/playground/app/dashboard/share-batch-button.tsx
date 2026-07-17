"use client";

import { useEffect, useRef, useState } from "react";

function defaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export function ShareBatchButton({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueDate);
  const [state, setState] = useState("Create review link");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function share() {
    setState("Creating…");
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ batchId, reviewer: reviewer.trim() || undefined, dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : undefined }),
    });
    const body = await response.json() as { url?: string; error?: string };
    if (response.ok && body.url) {
      try {
        await navigator.clipboard.writeText(body.url);
        setState("Assigned link copied ✓");
        resetTimer.current = window.setTimeout(() => { setState("Create review link"); setOpen(false); }, 2200);
      } catch {
        setState("Link created—clipboard blocked");
      }
    } else {
      setState(body.error ?? "Could not share");
    }
  }

  return (
    <div className="relative mt-2">
      <button type="button" className="font-mono text-[10px] text-signal hover:text-bone" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }} aria-expanded={open}>
        Share for client approval
      </button>
      {open && <div className="relative z-10 mt-2 w-full border border-hairline bg-ink p-3 sm:w-80">
        <p className="text-xs font-semibold text-bone">Assign this review</p>
        <p className="mt-1 font-mono text-[9px] text-muted">The signed link records the reviewer label and due date. Do not enter private information.</p>
        <label className="mt-3 block"><span className="font-mono text-[9px] text-muted">REVIEWER OR TEAM</span><input className="field mt-1 !py-2" value={reviewer} maxLength={80} onChange={(event) => setReviewer(event.target.value)} placeholder="Client marketing team" /></label>
        <label className="mt-2 block"><span className="font-mono text-[9px] text-muted">DECISION DUE</span><input className="field mt-1 !py-2" type="date" value={dueAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDueAt(event.target.value)} /></label>
        <div className="mt-3 flex gap-2"><button type="button" className="btn !px-3 !py-2 text-xs" onClick={() => void share()}>{state}</button><button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={() => setOpen(false)}>Cancel</button></div>
      </div>}
    </div>
  );
}
