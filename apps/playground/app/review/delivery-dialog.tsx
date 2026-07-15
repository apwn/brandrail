"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = Record<string, string>;
type DeliveryItem = {
  id: string;
  brand: string;
  brief: string;
  renderId: string;
  copy: { formats: Record<string, Slide[]> };
  assets: Array<{ format: string; filename: string }>;
};
type Channel = { id: string; platform: string; handle: string };

const FORMAT_BY_PLATFORM: Record<string, string> = {
  instagram: "ig-carousel",
  meta: "og-image",
  linkedin: "li-image",
  x: "x-graphic",
  tiktok: "story",
  bluesky: "x-graphic",
  mastodon: "x-graphic",
};

function localInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultStart(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return localInput(tomorrow);
}

function filesFor(item: DeliveryItem, platform: string): string[] {
  const desired = FORMAT_BY_PLATFORM[platform] ?? "og-image";
  const matched = item.assets.filter((asset) => asset.format === desired).map((asset) => asset.filename);
  if (matched.length) return desired === "ig-carousel" ? matched : matched.slice(0, 1);
  return item.assets.slice(0, 1).map((asset) => asset.filename);
}

function captionFor(item: DeliveryItem, platform: string): string {
  const desired = FORMAT_BY_PLATFORM[platform] ?? "og-image";
  const slides = item.copy.formats[desired] ?? Object.values(item.copy.formats)[0] ?? [];
  const first = slides[0];
  if (!first) return item.brief;
  return [first.hook, first.body, first.cta].filter(Boolean).join("\n\n") || item.brief;
}

export function DeliveryDialog({
  batchId,
  batchTitle,
  items,
  onClose,
}: {
  batchId: string;
  batchTitle: string;
  items: DeliveryItem[];
  onClose: () => void;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startAt, setStartAt] = useState(defaultStart);
  const [gapDays, setGapDays] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "scheduling" | "done">("loading");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState({ scheduled: 0, failed: 0 });

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/channels", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { channels?: Channel[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Could not load publishing channels");
        const available = body.channels ?? [];
        setChannels(available);
        setSelectedIds(available.map((channel) => channel.id));
        setState("ready");
      })
      .catch((reason: Error) => {
        if (reason.name === "AbortError") return;
        setError(reason.message);
        setState("ready");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && state !== "scheduling") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, state]);

  const selectedChannels = useMemo(
    () => channels.filter((channel) => selectedIds.includes(channel.id)),
    [channels, selectedIds],
  );
  const postCount = items.length * selectedChannels.length;

  async function schedule() {
    const firstSlot = new Date(startAt);
    if (!Number.isFinite(firstSlot.getTime()) || firstSlot.getTime() <= Date.now()) {
      setError("Choose a future date and time.");
      return;
    }
    if (!postCount) {
      setError("Select at least one channel.");
      return;
    }
    setState("scheduling");
    setError(null);
    let scheduled = 0;
    let failed = 0;
    for (const [itemIndex, item] of items.entries()) {
      const slot = new Date(firstSlot);
      slot.setDate(slot.getDate() + itemIndex * gapDays);
      for (const channel of selectedChannels) {
        try {
          const response = await fetch("/api/publish", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              text: captionFor(item, channel.platform),
              channelIds: [channel.id],
              renderId: item.renderId,
              imageFiles: filesFor(item, channel.platform),
              scheduledAt: slot.toISOString(),
              approval: { batchId, itemId: item.id },
              idempotencyKey: `review:${batchId}:${item.id}:${channel.id}:${slot.toISOString()}`,
            }),
          });
          if (response.ok) scheduled++;
          else failed++;
        } catch {
          failed++;
        }
      }
    }
    setResult({ scheduled, failed });
    setState("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-labelledby="delivery-title">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow text-signal">APPROVED → CALENDAR</p>
            <h2 id="delivery-title" className="mt-2 font-display text-2xl font-bold">Schedule the approved set</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">Each channel gets its native creative shape. Every calendar item keeps the approval reference and exact render.</p>
          </div>
          <button className="text-muted hover:text-bone disabled:opacity-40" onClick={onClose} disabled={state === "scheduling"} aria-label="Close scheduling dialog">✕</button>
        </div>

        {state === "loading" && <p className="mt-8 font-mono text-xs text-muted">LOADING CHANNELS…</p>}

        {state === "done" && (
          <div className="mt-8 border border-green/50 bg-green/10 p-5">
            <p className={`eyebrow ${result.scheduled ? "text-green" : "text-signal"}`}>{result.scheduled ? "DELIVERY RAIL READY" : "DELIVERY NEEDS ATTENTION"}</p>
            <h3 className="mt-2 font-display text-xl font-bold">{result.scheduled} calendar {result.scheduled === 1 ? "item" : "items"} scheduled.</h3>
            <p className="mt-2 text-sm text-muted">{batchTitle}{result.failed ? ` · ${result.failed} could not be scheduled.` : " · every approved item is accounted for."}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn" onClick={() => window.location.assign("/calendar")}>Open calendar →</button>
              <button className="btn-ghost" onClick={onClose}>Stay in review</button>
            </div>
          </div>
        )}

        {state !== "loading" && state !== "done" && channels.length === 0 && (
          <div className="mt-8 border border-hairline p-5">
            <p className="eyebrow text-bone">NO CHANNELS CONNECTED</p>
            <p className="mt-2 text-sm text-muted">Connect a publishing account first. Your approved set will stay here when you return.</p>
            {error && <p className="mt-3 font-mono text-xs text-signal" role="alert">ERR {error}</p>}
            <a className="btn mt-5 inline-flex" href="/dashboard#channels">Connect a channel →</a>
          </div>
        )}

        {state !== "loading" && state !== "done" && channels.length > 0 && (
          <>
            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-bone">CHANNELS</p>
                <span className="font-mono text-[10px] text-muted">{postCount} CALENDAR {postCount === 1 ? "ITEM" : "ITEMS"}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {channels.map((channel) => {
                  const selected = selectedIds.includes(channel.id);
                  return (
                    <label key={channel.id} className={`cursor-pointer border p-3 text-sm ${selected ? "border-signal bg-signal/5 text-bone" : "border-hairline text-muted"}`}>
                      <input
                        className="sr-only"
                        type="checkbox"
                        checked={selected}
                        disabled={state === "scheduling"}
                        onChange={() => setSelectedIds((ids) => selected ? ids.filter((id) => id !== channel.id) : [...ids, channel.id])}
                      />
                      <span className="font-mono text-[10px] uppercase text-signal">{channel.platform}</span>
                      <span className="ml-2">{channel.handle}</span>
                      <span className="mt-1 block font-mono text-[9px] text-muted">{FORMAT_BY_PLATFORM[channel.platform] ?? "og-image"}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted">
                <span className="eyebrow text-bone">FIRST SLOT</span>
                <input className="field mt-2" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} disabled={state === "scheduling"} />
              </label>
              <label className="text-xs text-muted">
                <span className="eyebrow text-bone">CADENCE</span>
                <select className="field mt-2" value={gapDays} onChange={(event) => setGapDays(Number(event.target.value))} disabled={state === "scheduling"}>
                  <option value={1}>One approved item per day</option>
                  <option value={2}>Every two days</option>
                  <option value={7}>Weekly</option>
                </select>
              </label>
            </div>

            <div className="mt-6 border border-hairline bg-ink/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-bone">DELIVERY SUMMARY</p>
                  <p className="mt-2 text-sm text-muted">{items.length} approved {items.length === 1 ? "item" : "items"} × {selectedChannels.length} {selectedChannels.length === 1 ? "channel" : "channels"}</p>
                </div>
                <span className="font-display text-3xl font-bold text-bone">{postCount}</span>
              </div>
            </div>

            {error && <p className="mt-3 font-mono text-xs text-signal" role="alert">ERR {error}</p>}
            <button className="btn mt-5 w-full" onClick={() => void schedule()} disabled={state === "scheduling" || postCount === 0}>
              {state === "scheduling" ? `Scheduling ${postCount} items…` : `Add ${postCount} to calendar →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
