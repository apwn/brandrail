"use client";

import { useState } from "react";
import { trackConversion } from "@/lib/conversion";

export function LoginForm({ plan, agent, returnTo }: { plan?: "studio" | "agency"; agent?: boolean; returnTo?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"success" | "error" | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setMessageKind(null);
    setDevLink(null);
    trackConversion("login_submitted", { intent: plan ?? (agent ? "agent" : "workspace") });
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: plan ? `/dashboard?checkout=${plan}${returnTo ? `&return=${encodeURIComponent(returnTo)}` : ""}` : agent ? "/dashboard?welcome=agent#agent" : "/dashboard" }),
      });
      const body = (await res.json()) as { error?: string; devLink?: string };
      if (!res.ok) throw new Error(body.error ?? "Couldn't send the link");
      setDevLink(body.devLink ?? null);
      setMessage("Check your inbox — your secure link is on the way.");
      setMessageKind("success");
      trackConversion("login_link_sent", { intent: plan ?? (agent ? "agent" : "workspace") });
    } catch (error) {
      setMessage((error as Error).message);
      setMessageKind("error");
      trackConversion("login_failed", { intent: plan ?? (agent ? "agent" : "workspace") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7">
      <label className="eyebrow text-bone" htmlFor="login-email">EMAIL</label>
      <input id="login-email" type="email" required autoComplete="email" autoFocus className="field mt-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" className="btn mt-3 w-full" disabled={busy}>{busy ? "Sending…" : selectedLabel(plan, agent)}</button>
      {message && <p role={messageKind === "error" ? "alert" : "status"} className={`mt-4 font-mono text-xs ${messageKind === "error" ? "text-signal" : "text-green"}`}>{message}</p>}
      {devLink && <a href={devLink} className="btn-ghost w-full mt-3 text-xs">Open local development link →</a>}
    </form>
  );
}

function selectedLabel(plan?: "studio" | "agency", agent?: boolean) {
  return plan ? "Send my secure checkout link →" : agent ? "Send my agent setup link →" : "Send my sign-in link →";
}
