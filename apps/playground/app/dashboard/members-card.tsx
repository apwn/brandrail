"use client";

import { useState } from "react";

/** Agency reviewer seats: distinct identities with review-only access. */
export function MembersCard({ plan, members: initial }: { plan: string; members: string[] }) {
  const [members, setMembers] = useState(initial);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plan !== "agency") {
    return (
      <section className="panel p-5 mt-4">
        <p className="eyebrow text-bone">TEAM</p>
        <p className="text-muted text-sm mt-2">
          Invite teammates into this workspace on the <a href="/#pricing" className="text-signal">Agency plan</a>.
        </p>
      </section>
    );
  }

  async function invite() {
    if (!value.includes("@")) return setError("enter a valid email");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const body = (await res.json()) as { members?: string[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "invite failed");
      setMembers(body.members ?? members);
      setValue("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    await fetch(`/api/members/${encodeURIComponent(email)}`, { method: "DELETE" });
    setMembers((m) => m.filter((x) => x !== email));
  }

  return (
    <section className="panel p-5 mt-4">
      <p className="eyebrow text-bone">TEAM · REVIEWER SEATS</p>
      <p className="text-muted text-sm mt-2">
        Invited reviewers sign in with their own magic link and can inspect brands and work the review queue.
        <span className="font-mono text-[11px] block mt-1 text-muted">Billing, publishing credentials, automation, API keys and account settings stay owner-only.</span>
      </p>
      <div className="flex gap-2 mt-3">
        <input
          className="field !py-2"
          placeholder="designer@youragency.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && invite()}
        />
        <button className="btn !py-2 whitespace-nowrap" onClick={invite} disabled={busy}>
          {busy ? "Inviting…" : "+ Invite"}
        </button>
      </div>
      {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}
      {members.length > 0 && (
        <ul className="mt-4 divide-y divide-hairline">
          {members.map((m) => (
            <li key={m} className="py-2 flex items-center justify-between">
              <span className="text-sm text-bone">{m}</span>
              <button className="font-mono text-[11px] text-muted hover:text-signal" onClick={() => remove(m)}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
