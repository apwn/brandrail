"use client";

import { useEffect, useState } from "react";

interface QueuedPost {
  id: string;
  text: string;
  scheduledAt: string;
  status: "scheduled" | "publishing" | "published" | "failed" | "cancelled";
  results?: Array<{ ok: boolean; url?: string; error?: string }>;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** The content queue — what's going out when, and what already shipped. */
export function QueueCard() {
  const [posts, setPosts] = useState<QueuedPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/scheduled");
        if (res.ok) setPosts(((await res.json()) as { posts: QueuedPost[] }).posts ?? []);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const upcoming = posts.filter((p) => p.status === "scheduled").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 8);
  const shipped = posts.filter((p) => p.status !== "scheduled").sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).slice(0, 5);

  if (loaded && posts.length === 0) return null; // nothing queued yet — the checklist covers guidance

  return (
    <section className="panel p-5 mt-4">
      <div className="flex items-center justify-between"><p className="eyebrow text-bone">QUEUE</p><a href="/calendar" className="font-mono text-[10px] text-signal hover:text-bone">OPEN CALENDAR →</a></div>
      {upcoming.length > 0 && (
        <ul className="mt-3 divide-y divide-hairline">
          {upcoming.map((p) => (
            <li key={p.id} className="py-2 grid grid-cols-[150px_1fr] gap-3 items-baseline">
              <span className="font-mono text-[11px] text-signal">{fmt(p.scheduledAt)}</span>
              <span className="text-sm text-bone truncate">{p.text}</span>
            </li>
          ))}
        </ul>
      )}
      {shipped.length > 0 && (
        <>
          <p className="eyebrow text-muted mt-5">SHIPPED</p>
          <ul className="mt-2 divide-y divide-hairline">
            {shipped.map((p) => {
              const url = p.results?.find((r) => r.ok && r.url)?.url;
              return (
                <li key={p.id} className="py-2 grid grid-cols-[150px_1fr_auto] gap-3 items-baseline">
                  <span className="font-mono text-[11px] text-muted">{fmt(p.scheduledAt)}</span>
                  <span className="text-sm text-muted truncate">{p.text}</span>
                  {p.status === "published" && url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-green">live ↗</a>
                  ) : (
                    <span className={`font-mono text-[11px] ${p.status === "published" ? "text-green" : "text-signal"}`}>{p.status}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
