"use client";

import { useState } from "react";

export function LoginForm({ plan, agent }: { plan?: "studio" | "agency"; agent?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: plan ? `/dashboard?checkout=${plan}` : agent ? "/dashboard?welcome=agent#agent" : "/dashboard" }),
      });
      const body = (await res.json()) as { error?: string; devLink?: string };
      if (!res.ok) throw new Error(body.error ?? "Couldn't send the link");
      setDevLink(body.devLink ?? null);
      setMessage("Check your inbox — your secure link is on the way.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7">
      <label className="eyebrow text-bone" htmlFor="login-email">WORK EMAIL</label>
      <input id="login-email" type="email" required autoComplete="email" autoFocus className="field mt-2" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn w-full mt-3" disabled={busy}>{busy ? "Sending…" : selectedLabel(plan, agent)}</button>
      {message && <p className={`font-mono text-xs mt-4 ${devLink ? "text-green" : "text-muted"}`}>{message}</p>}
      {devLink && <a href={devLink} className="btn-ghost w-full mt-3 text-xs">Open local development link →</a>}
    </form>
  );
}

function selectedLabel(plan?: "studio" | "agency", agent?: boolean) {
  return plan ? `Email my link and continue →` : agent ? "Email my connection link →" : "Email my sign-in link →";
}
