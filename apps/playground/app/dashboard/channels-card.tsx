"use client";

import { useEffect, useState } from "react";

type Channel = { id: string; platform: string; handle: string };

/** Connect publishing channels. Bluesky works today (app-password auth); the
 * managed platforms show as "needs OAuth app" until credentials are configured. */
export function ChannelsCard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({});
  const [trust, setTrust] = useState<"review" | "auto">("review");
  const [handle, setHandle] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [c, p] = await Promise.all([
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/channels/platforms").then((r) => r.json()),
    ]);
    setChannels(c.channels ?? []);
    setTrust(c.trust ?? "review");
    setPlatforms(p.platforms ?? {});
  }
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function connect() {
    if (!handle.includes(".")) return setError("enter your full Bluesky handle, e.g. acme.bsky.social");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform: "bluesky", handle, secret }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "connect failed");
      setHandle("");
      setSecret("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/channels/${id}`, { method: "DELETE" });
    await load();
  }

  async function setTrustMode(mode: "review" | "auto") {
    setTrust(mode);
    await fetch("/api/me/trust", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ trust: mode }) });
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow text-bone">CHANNELS ({channels.length})</p>
        {/* trust slider */}
        <div className="inline-flex border border-hairline text-[11px] font-mono">
          {(["review", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTrustMode(m)}
              className={`px-3 py-1.5 transition-colors duration-mech ${trust === m ? "bg-signal text-ink" : "text-muted hover:text-bone"}`}
            >
              {m === "review" ? "APPROVE EACH" : "AUTOPILOT"}
            </button>
          ))}
        </div>
      </div>

      {channels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {channels.map((ch) => (
            <span key={ch.id} className="panel px-3 py-1.5 flex items-center gap-2 text-sm font-mono">
              <span className="text-signal">◇</span> {ch.platform} · {ch.handle}
              <button onClick={() => remove(ch.id)} aria-label="disconnect" className="text-muted hover:text-signal">×</button>
            </span>
          ))}
        </div>
      )}

      {/* connect Bluesky (the one that works with no OAuth app) */}
      <div className="panel p-4">
        <p className="font-mono text-xs text-muted mb-2">
          Connect <b className="text-bone">Bluesky</b> — handle + an app password (Bluesky → Settings → App passwords).
          {Object.entries(platforms).filter(([, live]) => !live).length > 0 && (
            <> Others (LinkedIn, X, Meta, TikTok) need a registered app — coming.</>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <input className="field !py-2 flex-1 min-w-[180px]" placeholder="acme.bsky.social" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <input className="field !py-2 flex-1 min-w-[180px]" type="password" placeholder="app password" value={secret} onChange={(e) => setSecret(e.target.value)} />
          <button className="btn !py-2" onClick={connect} disabled={busy}>{busy ? "Connecting…" : "Connect"}</button>
        </div>
        {error && <p className="text-signal font-mono text-xs mt-2">{error}</p>}
      </div>
    </section>
  );
}
