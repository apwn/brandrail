"use client";

import { useState } from "react";

/** Account card: claim an anonymous workspace with an email, or sign out. */
export function AccountBar({ email, plan }: { email: string | null; plan: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    if (!value.includes("@")) return setError("enter a valid email");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "sign-in failed");
      location.reload();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    location.href = "/";
  }

  if (email) {
    return (
      <div className="panel p-5 flex flex-col justify-between">
        <div>
          <p className="eyebrow text-bone">ACCOUNT</p>
          <p className="text-bone mt-2">{email}</p>
          <p className="font-mono text-xs text-muted mt-1">{plan} plan</p>
        </div>
        <button onClick={signOut} className="eyebrow text-muted hover:text-signal self-start mt-4">SIGN OUT</button>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <p className="eyebrow text-bone">SAVE YOUR WORKSPACE</p>
      <p className="text-muted text-sm mt-2 mb-3">
        You&rsquo;re working anonymously. Add an email to keep your brands and come back to them.
      </p>
      <div className="flex gap-2">
        <input
          className="field !py-2"
          placeholder="you@agency.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && claim()}
        />
        <button onClick={claim} disabled={busy} className="btn !py-2 whitespace-nowrap">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}
    </div>
  );
}
