"use client";

import { useState } from "react";

/** Account card: sign in with a magic link (verified email — the identity your
 * workspace and plan hang off), or sign out. */
export function AccountBar({ email, verified, plan, role = "owner" }: { email: string | null; verified?: boolean; plan: string; role?: "owner" | "reviewer" }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestLink(emailTo?: string) {
    const target = emailTo ?? value;
    if (!target.includes("@")) return setError("enter a valid email");
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const body = (await res.json()) as { devLink?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "couldn't send the link");
      setDevLink(body.devLink ?? null);
      setState("sent");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    location.href = "/";
  }

  if (email && verified) {
    return (
      <div className="panel p-5 flex flex-col justify-between">
        <div>
          <p className="eyebrow text-bone">ACCOUNT</p>
          <p className="text-bone mt-2">{email} <span className="text-green font-mono text-[11px]">✓ verified</span></p>
          <p className="font-mono text-xs text-muted mt-1">{plan} workspace · {role}</p>
        </div>
        <div className="flex gap-4 mt-4">
          <a href="/settings" className="eyebrow text-muted hover:text-bone">SETTINGS</a>
          <button onClick={signOut} className="eyebrow text-muted hover:text-signal">SIGN OUT</button>
        </div>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="panel p-5">
        <p className="eyebrow text-bone">CHECK YOUR INBOX</p>
        <p className="text-muted text-sm mt-2">
          We sent a sign-in link{value ? <> to <b className="text-bone">{value}</b></> : null}. Click it and this workspace is yours on any device.
        </p>
        {devLink && (
          <a className="btn !py-2 mt-3 inline-block" href={devLink}>Dev mode: open the link →</a>
        )}
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <p className="eyebrow text-bone">{email ? "VERIFY YOUR EMAIL" : "SIGN IN / SAVE YOUR WORKSPACE"}</p>
      <p className="text-muted text-sm mt-2 mb-3">
        {email
          ? `${email} isn't verified yet — verify to unlock downloads, publishing and billing.`
          : "You're working anonymously. One emailed link signs you in — no password — and keeps your brands on every device."}
      </p>
      <div className="flex gap-2">
        <input
          className="field !py-2"
          placeholder="you@agency.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && requestLink()}
        />
        <button onClick={() => requestLink()} disabled={state === "sending"} className="btn !py-2 whitespace-nowrap">
          {state === "sending" ? "Sending…" : "Email my link"}
        </button>
      </div>
      {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}
    </div>
  );
}
