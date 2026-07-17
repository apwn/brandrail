"use client";

import { useState } from "react";
import { BrandWordmark } from "../../components/brand-wordmark";

type SharedItem = { id: string; brand: string; brief: string; status: "pending" | "approved" | "edited" | "flagged"; renderId: string; assets: Array<{ format: string; filename: string }>; note?: string };
type Comment = { id: string; itemId?: string; author: string; text: string; createdAt: string };
export type SharedBatch = { id: string; title: string; createdAt: string; items: SharedItem[]; comments?: Comment[] };

export function ApprovalWorkspace({ token, initialBatch, reviewer, dueAt }: {
  token: string;
  initialBatch: SharedBatch;
  reviewer?: string;
  dueAt?: string;
}) {
  const [batch, setBatch] = useState(initialBatch);
  const [cursor, setCursor] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const item = batch.items[cursor];

  async function review(action: "approve" | "flag") {
    if (!item || !author.trim()) {
      setMessage("Add your name so the team knows who made this decision.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/share/${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id, action, author: author.trim(), note: comment.trim() || undefined }),
    });
    const next = await response.json() as SharedItem & { error?: string };
    if (response.ok) {
      setBatch((current) => ({ ...current, items: current.items.map((entry) => entry.id === next.id ? next : entry) }));
      setMessage(action === "approve" ? "Approved. The team can now schedule it." : "Changes requested. Your note is attached.");
      setComment("");
    } else {
      setMessage(next.error ?? "Action failed");
    }
    setBusy(false);
  }

  async function addComment() {
    if (!author.trim() || !comment.trim() || !item) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/share/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ author: author.trim(), text: comment.trim(), itemId: item.id }),
    });
    const body = await response.json() as { comments?: Comment[]; error?: string };
    if (response.ok) {
      setBatch((current) => ({ ...current, comments: body.comments ?? current.comments }));
      setComment("");
      setMessage("Comment added.");
    } else {
      setMessage(body.error ?? "Could not add comment");
    }
    setBusy(false);
  }

  if (!item) return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="font-display text-4xl font-bold">Nothing to review</h1></main>;

  const assets = item.assets.filter((asset) => asset.format === "og-image" || asset.format === "ig-carousel");
  const comments = (batch.comments ?? []).filter((entry) => entry.itemId === item.id);
  const decided = batch.items.filter((entry) => entry.status !== "pending").length;

  return (
    <main className="min-h-screen bg-[#F4F0E8] text-ink">
      <header className="border-b border-[#C9C4BA] bg-ink px-5 py-4 text-bone">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><BrandWordmark size="sm" /><span className="border-l border-hairline pl-3 font-mono text-[9px] text-muted">CLIENT REVIEW</span></div>
          <div className="text-right font-mono text-[9px] text-muted"><p>SECURE LINK · NO ACCOUNT REQUIRED</p>{reviewer && <p className="mt-1 text-bone">ASSIGNED · {reviewer}</p>}{dueAt && <p className="mt-1 text-bone">DUE · {new Date(dueAt).toLocaleDateString("en", { dateStyle: "medium" })}</p>}</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-6">
        <div className="flex items-center justify-between gap-4 font-mono text-[9px] text-[#6A655D]"><span>{decided} OF {batch.items.length} DECIDED</span><span>{batch.items.length - decided} REMAINING</span></div>
        <div className="mt-2 h-1 bg-[#D8D3CA]"><div className="h-full bg-[#A83200]" style={{ width: `${batch.items.length ? decided / batch.items.length * 100 : 0}%` }} /></div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="review-item-title">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#A83200]">{batch.title}</p>
          <h1 id="review-item-title" className="mt-3 font-display text-4xl font-bold">{item.brief}</h1>
          <div className="mt-3 flex items-center gap-3"><span className="border border-[#C9C4BA] px-2 py-1 font-mono text-[10px]">{item.brand}</span><span className="font-mono text-[10px] text-[#6A655D]">{cursor + 1} / {batch.items.length}</span><span className={`font-mono text-[10px] uppercase ${item.status === "approved" ? "text-green" : "text-[#A83200]"}`}>{item.status}</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{assets.map((asset) => <img key={asset.filename} src={`/api/share/${encodeURIComponent(token)}/asset/${encodeURIComponent(item.renderId)}/${encodeURIComponent(asset.filename)}`} alt={`${item.brand} ${asset.format}`} className="w-full border border-[#C9C4BA] bg-white object-contain" />)}</div>
          <div className="mt-5 flex justify-between"><button className="border border-ink px-4 py-2 text-sm disabled:opacity-30" disabled={cursor === 0} onClick={() => setCursor((value) => value - 1)}>← Previous</button><button className="border border-ink px-4 py-2 text-sm disabled:opacity-30" disabled={cursor === batch.items.length - 1} onClick={() => setCursor((value) => value + 1)}>Next →</button></div>
        </section>

        <aside className="h-fit border border-[#C9C4BA] bg-white p-5 lg:sticky lg:top-5" aria-labelledby="decision-title">
          <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#A83200]">Decision</p>
          <h2 id="decision-title" className="mt-2 font-display text-2xl font-bold">Ready to ship?</h2>
          <p className="mt-2 text-sm text-[#6A655D]">Approving records your decision. It does not publish automatically; the team still controls timing and channels.</p>
          <label className="mt-5 block text-xs font-semibold"><span>Your name</span><input className="mt-1 w-full border border-[#C9C4BA] px-3 py-2 text-sm" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Alex Morgan" /></label>
          <label className="mt-3 block text-xs font-semibold"><span>Comment or requested change</span><textarea className="mt-1 min-h-24 w-full border border-[#C9C4BA] px-3 py-2 text-sm" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional for approval; required when requesting changes" /></label>
          <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy || !author.trim() || !comment.trim()} onClick={() => void review("flag")} className="border border-ink px-3 py-3 text-sm disabled:opacity-40">Request changes</button><button disabled={busy || !author.trim()} onClick={() => void review("approve")} className="bg-[#A83200] px-3 py-3 text-sm font-semibold text-white disabled:opacity-40">Approve</button></div>
          <button disabled={busy || !author.trim() || !comment.trim()} onClick={() => void addComment()} className="mt-2 w-full border border-[#C9C4BA] px-3 py-2 text-xs disabled:opacity-40">Add comment only</button>
          {message && <p className="mt-3 text-xs text-[#A83200]" role="status">{message}</p>}
          <div className="mt-6 border-t border-[#E2DED6] pt-4"><p className="font-mono text-[10px] uppercase text-[#6A655D]">Comments ({comments.length})</p><div className="mt-3 space-y-3">{comments.length ? comments.map((entry) => <article key={entry.id}><div className="text-sm font-semibold">{entry.author}</div><p className="text-sm text-[#514D47]">{entry.text}</p><time className="mt-1 block font-mono text-[8px] text-[#6A655D]">{new Date(entry.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</time></article>) : <p className="text-sm text-[#6A655D]">No comments on this item yet.</p>}</div></div>
        </aside>
      </div>
    </main>
  );
}
