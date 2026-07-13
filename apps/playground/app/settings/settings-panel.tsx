"use client";

import { useState } from "react";

export function SettingsPanel({ email, verified, plan, uid }: { email: string | null; verified: boolean; plan: string; uid: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Changing email = verifying the new one. Same magic-link flow; on click the
   * new address becomes the verified identity for this workspace. */
  async function changeEmail() {
    if (!newEmail.includes("@")) return setError("enter a valid email");
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
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

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "deletion failed");
      location.href = "/?deleted=1";
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-4">
      <section className="panel p-5">
        <p className="eyebrow text-bone">IDENTITY</p>
        <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-muted font-mono text-xs pt-0.5">email</dt>
          <dd className="text-bone">
            {email ?? <span className="text-muted">none — anonymous workspace</span>}{" "}
            {email && (verified ? <span className="text-green font-mono text-[11px]">✓ verified</span> : <span className="text-signal font-mono text-[11px]">unverified</span>)}
          </dd>
          <dt className="text-muted font-mono text-xs pt-0.5">plan</dt>
          <dd className="text-bone">{plan}</dd>
          <dt className="text-muted font-mono text-xs pt-0.5">workspace id</dt>
          <dd className="font-mono text-xs text-muted pt-0.5">{uid}</dd>
        </dl>
      </section>

      <section className="panel p-5">
        <p className="eyebrow text-bone">{email ? "CHANGE EMAIL" : "ADD AN EMAIL"}</p>
        <p className="text-muted text-sm mt-2">
          We&rsquo;ll send a sign-in link to the new address; clicking it makes it the verified identity for this workspace.
        </p>
        {state === "sent" ? (
          <div className="mt-3">
            <p className="text-sm text-bone">Link sent to <b>{newEmail}</b> — click it to switch.</p>
            {devLink && <a className="btn !py-2 mt-3 inline-block" href={devLink}>Dev mode: open the link →</a>}
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <input className="field !py-2" placeholder="new@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button className="btn !py-2 whitespace-nowrap" onClick={changeEmail} disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send link"}
            </button>
          </div>
        )}
      </section>

      <section className="panel p-5 border-signal/40">
        <p className="eyebrow text-signal">DANGER ZONE</p>
        <p className="text-muted text-sm mt-2">
          Deleting your account purges your brands, renders, batches, API keys and channel connections. There is no undo.
          {plan !== "free" && <b className="text-bone"> Cancel your subscription in billing first.</b>}
        </p>
        {!confirming ? (
          <button className="btn-ghost !border-signal !text-signal mt-3" onClick={() => setConfirming(true)}>
            Delete account…
          </button>
        ) : (
          <div className="flex items-center gap-3 mt-3">
            <button className="btn !bg-signal mt-0" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes — delete everything"}
            </button>
            <button className="font-mono text-[11px] text-muted hover:text-bone" onClick={() => setConfirming(false)}>cancel</button>
          </div>
        )}
      </section>

      {error && <p className="text-signal font-mono text-xs">{error}</p>}
    </div>
  );
}
