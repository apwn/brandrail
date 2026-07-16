"use client";

import { useEffect, useState } from "react";

interface Cadence {
  brand: string;
  perWeek: number;
  paused?: boolean;
  lastRunAt?: string;
}

const PER_WEEK_OPTIONS = [0, 1, 2, 3, 5, 7];

/** The autopilot: per brand, "N posts a week". The weekly tick plans
 * (performance-fed), renders (brand-locked), and queues — review-trust sends
 * the week to the review queue, auto-trust spreads it onto the schedule. */
export function AutopilotCard({ verified }: { verified: boolean }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [trust, setTrust] = useState<"review" | "auto">("review");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "run" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/cadences");
      if (!res.ok) return;
      const data = (await res.json()) as { cadences: Cadence[]; brands: string[]; trust: "review" | "auto" };
      setBrands(data.brands);
      setCadences(data.cadences);
      setTrust(data.trust);
    })();
  }, []);

  function perWeekFor(brand: string): number {
    return cadences.find((c) => c.brand === brand)?.perWeek ?? 0;
  }
  function setPerWeek(brand: string, perWeek: number) {
    setCadences((prev) => {
      const rest = prev.filter((c) => c.brand !== brand);
      return perWeek === 0 ? rest : [...rest, { ...(prev.find((c) => c.brand === brand) ?? { brand }), brand, perWeek }];
    });
    setDirty(true);
    setNote(null);
  }

  async function save() {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/api/cadences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cadences: cadences.map(({ brand, perWeek, paused }) => ({ brand, perWeek, paused })) }),
      });
      const data = (await res.json()) as { cadences?: Cadence[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "save failed");
      setCadences(data.cadences ?? []);
      setDirty(false);
      setNote("saved ✓ — the weekly tick takes it from here");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runNow() {
    setBusy("run");
    setError(null);
    setNote("planning + rendering the week — this takes a minute…");
    try {
      const res = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = (await res.json()) as { batches?: number; rendered?: number; queued?: number; skipped?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "run failed");
      const bits = [
        `${data.batches ?? 0} week${(data.batches ?? 0) === 1 ? "" : "s"} generated`,
        `${data.rendered ?? 0} assets rendered`,
        data.queued ? `${data.queued} posts queued to the schedule` : trust === "review" ? "waiting in your review queue" : "",
        ...(data.skipped ?? []),
      ].filter(Boolean);
      setNote(bits.join(" · "));
    } catch (e) {
      setError((e as Error).message);
      setNote(null);
    } finally {
      setBusy(null);
    }
  }

  const active = cadences.filter((c) => c.perWeek > 0);

  return (
    <section className="panel p-5 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow text-bone">CONTENT PROGRAM · ROLLING WEEKLY PRODUCTION</p><a href="/program" className="mt-2 inline-block text-sm font-semibold text-signal hover:text-bone">Plan the next 30 days →</a></div>
        {active.length > 0 && (
          <span className="font-mono text-[11px] text-green">
            {active.reduce((n, c) => n + c.perWeek, 0)} posts/wk across {active.length} brand{active.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <p className="text-muted text-sm mt-2">
        Pick a weekly cadence per brand. Each week the planner proposes posts from your BrandSpec (weighted by what performed),
        renders them brand-locked, and {trust === "auto" ? <b className="text-bone">queues them straight onto your schedule</b> : <b className="text-bone">drops them in your review queue to approve</b>}
        {" "}— switch behavior with the trust slider in channels.
      </p>

      {!verified ? (
        <p className="font-mono text-xs text-muted mt-3">Verify your email to turn on autopilot.</p>
      ) : brands.length === 0 ? (
        <p className="font-mono text-xs text-muted mt-3">
          No brands yet — <a className="text-signal" href="/">compile one first →</a>
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-hairline">
            {brands.map((b) => {
              const cd = cadences.find((c) => c.brand === b);
              return (
                <li key={b} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-bone">{b}</span>
                  <span className="flex items-center gap-3">
                    {cd?.lastRunAt && <span className="font-mono text-[11px] text-muted">last run {cd.lastRunAt.slice(0, 10)}</span>}
                    <select
                      className="field !py-1.5 !px-2 !w-auto font-mono text-xs"
                      value={perWeekFor(b)}
                      onChange={(e) => setPerWeek(b, Number(e.target.value))}
                    >
                      {PER_WEEK_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n === 0 ? "off" : `${n}/week`}</option>
                      ))}
                    </select>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-3 mt-4">
            <button className="btn !py-2" onClick={save} disabled={!dirty || busy !== null}>
              {busy === "save" ? "Saving…" : "Save cadences"}
            </button>
            {active.length > 0 && !dirty && (
              <button className="btn-ghost !py-2" onClick={runNow} disabled={busy !== null}>
                {busy === "run" ? "Running…" : "Run this week now →"}
              </button>
            )}
          </div>
          {note && <p className="font-mono text-[11px] text-green mt-3">{note}</p>}
          {error && <p className="font-mono text-xs text-signal mt-3">ERR {error}</p>}
        </>
      )}
    </section>
  );
}
