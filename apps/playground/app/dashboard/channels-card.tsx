"use client";

import { useEffect, useState } from "react";

type Channel = { id: string; platform: string; handle: string };
const OAUTH = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "meta", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
] as const;
const PROVIDERS = [
  { id: "bluesky", label: "Bluesky", auth: "App password", creative: "Text + one graphic", setup: "direct" },
  { id: "mastodon", label: "Mastodon", auth: "Access token", creative: "Text + one graphic", setup: "direct" },
  { id: "linkedin", label: "LinkedIn", auth: "OAuth", creative: "Post + LinkedIn image", setup: "oauth" },
  { id: "meta", label: "Facebook", auth: "OAuth", creative: "Post + open-graph image", setup: "oauth" },
  { id: "instagram", label: "Instagram", auth: "OAuth", creative: "Caption + carousel", setup: "oauth" },
  { id: "x", label: "X", auth: "OAuth", creative: "Post + X graphic", setup: "oauth" },
  { id: "tiktok", label: "TikTok", auth: "OAuth", creative: "Caption + vertical story", setup: "oauth" },
] as const;

/** Connect publishing channels. Bluesky works today (app-password auth); the
 * managed platforms show as "needs OAuth app" until credentials are configured. */
export function ChannelsCard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({});
  const [trust, setTrust] = useState<"review" | "auto">("review");
  const [platform, setPlatform] = useState<"bluesky" | "mastodon">("bluesky");
  const [handle, setHandle] = useState("");
  const [secret, setSecret] = useState("");
  const [service, setService] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    const [c, p] = await Promise.all([
      fetch("/api/channels", { signal }).then((r) => r.json()),
      fetch("/api/channels/platforms", { signal }).then((r) => r.json()),
    ]);
    setChannels(c.channels ?? []);
    setTrust(c.trust ?? "review");
    setPlatforms(p.platforms ?? {});
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((cause: Error) => {
      if (cause.name !== "AbortError") setError("Channel status could not be loaded. Refresh to try again.");
    });
    return () => controller.abort();
  }, []);

  async function connect() {
    if (platform === "bluesky" && !handle.includes(".")) return setError("enter your full Bluesky handle, e.g. acme.bsky.social");
    if (platform === "mastodon" && !service.startsWith("http")) return setError("enter your Mastodon instance URL, e.g. https://mastodon.social");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, handle, secret, ...(platform === "mastodon" ? { service } : {}) }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "connect failed");
      setHandle("");
      setSecret("");
      setService("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const channel = channels.find((item) => item.id === id);
    if (!window.confirm(`Disconnect ${channel?.handle ?? "this destination"}? Scheduled work will remain visible but cannot publish there until you reconnect.`)) return;
    const response = await fetch(`/api/channels/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The destination could not be disconnected. Refresh its status and try again.");
      return;
    }
    await load();
  }

  async function setTrustMode(mode: "review" | "auto") {
    const previous = trust;
    setTrust(mode);
    setError(null);
    try {
      const response = await fetch("/api/me/trust", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ trust: mode }) });
      if (!response.ok) throw new Error("trust update failed");
    } catch {
      setTrust(previous);
      setError("The approval mode was not changed. Refresh and try again.");
    }
  }

  return (
    <section id="channels" className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow text-bone">CHANNELS ({channels.length})</p><p className="mt-1 text-xs text-muted">Approve each pauses before delivery. Autopilot applies only to work that already passed the configured review safeguards.</p></div>
        {/* trust slider */}
        <div className="inline-flex border border-hairline text-[11px] font-mono">
          {(["review", "auto"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={trust === m}
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

      {/* connect a live channel (Bluesky + Mastodon work with no OAuth app) */}
      <div className="panel p-4">
        <div className="inline-flex border border-hairline mb-3 text-[11px] font-mono">
          {(["bluesky", "mastodon"] as const).map((p) => (
            <button type="button" key={p} aria-pressed={platform === p} onClick={() => setPlatform(p)} className={`px-3 py-1.5 uppercase tracking-wide transition-colors duration-mech ${platform === p ? "bg-signal text-ink" : "text-muted hover:text-bone"}`}>
              {p}
            </button>
          ))}
        </div>
        <p className="font-mono text-xs text-muted mb-2">
          {platform === "bluesky" ? (
            <>Handle + an app password (Bluesky → Settings → App passwords).</>
          ) : (
            <>Instance URL + an access token (your instance → Settings → Development → new application).</>
          )}
          <> Use the OAuth connections below for LinkedIn, Instagram, Facebook, X and TikTok.</>
        </p>
        <div className="flex flex-wrap gap-2">
          {platform === "mastodon" && (
            <input aria-label="Mastodon instance URL" className="field !py-2 flex-1 min-w-[180px]" placeholder="https://mastodon.social" value={service} onChange={(e) => setService(e.target.value)} />
          )}
          <input aria-label={`${platform} account handle`} className="field !py-2 flex-1 min-w-[160px]" placeholder={platform === "bluesky" ? "acme.bsky.social" : "@acme"} value={handle} onChange={(e) => setHandle(e.target.value)} />
          <input aria-label={`${platform} credential`} className="field !py-2 flex-1 min-w-[160px]" type="password" placeholder={platform === "bluesky" ? "app password" : "access token"} value={secret} onChange={(e) => setSecret(e.target.value)} />
          <button className="btn !py-2" onClick={connect} disabled={busy}>{busy ? "Connecting…" : "Connect"}</button>
        </div>
        {error && <p role="alert" className="text-signal font-mono text-xs mt-2">{error}</p>}
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="eyebrow text-bone mb-3">OAUTH CHANNELS</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {OAUTH.map((item) => {
              const live = Boolean(platforms[item.id]);
              const connected = channels.some((channel) => channel.platform === item.id);
              return live ? <a key={item.id} href={`/api/channels/oauth/${item.id}/start`} className="btn-ghost !px-3 !py-2 text-xs">{connected ? `Reconnect ${item.label}` : `Connect ${item.label}`} →</a> : <div key={item.id} className="border border-hairline px-3 py-2 font-mono text-[10px] text-muted">{item.label} · ADD APP KEYS</div>;
            })}
          </div>
          <p className="font-mono text-[10px] text-muted mt-3">OAuth channels become available automatically when their approved platform app credentials are configured.</p>
        </div>
        <details className="mt-4 border-t border-hairline pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-bone">Compare destination capabilities and readiness</summary>
          <p className="mt-2 max-w-2xl text-xs text-muted">Brandrail selects the native creative shape shown below. “Needs app keys” means the product path exists, but this deployment has not configured that provider.</p>
          <div className="mt-3 overflow-x-auto border border-hairline">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-ink/60 font-mono text-[9px] uppercase text-muted"><tr><th className="p-3">Destination</th><th className="p-3">Authentication</th><th className="p-3">Creative sent</th><th className="p-3">Workspace status</th></tr></thead>
              <tbody className="divide-y divide-hairline">
                {PROVIDERS.map((provider) => {
                  const connected = channels.some((channel) => channel.platform === provider.id);
                  const configured = provider.setup === "direct" || Boolean(platforms[provider.id]);
                  return <tr key={provider.id}><td className="p-3 text-bone">{provider.label}</td><td className="p-3 font-mono text-[10px] text-muted">{provider.auth}</td><td className="p-3 text-muted">{provider.creative}</td><td className={`p-3 font-mono text-[9px] ${connected ? "text-green" : configured ? "text-bone" : "text-signal"}`}>{connected ? "CONNECTED" : configured ? "READY TO CONNECT" : "NEEDS APP KEYS"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[9px] text-muted">Publishing remains gated by destination credentials, human approval, scheduled idempotency, and the provider&rsquo;s live response.</p>
        </details>
      </div>
    </section>
  );
}
