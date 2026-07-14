"use client";

import { useMemo, useState } from "react";

export type Campaign = { id: string; name: string; objective: string; status: "draft" | "active" | "complete"; startAt?: string; endAt?: string; brandIds: string[]; batchIds: string[]; postIds: string[]; createdAt: string; updatedAt: string; progress: { batches: number; assets: number; approved: number; posts: number; scheduled: number; published: number; impressions: number; engagements: number } };
export type BatchOption = { id: string; title: string; createdAt: string; counts: { total: number; approved: number; pending: number; flagged: number } };
export type PostOption = { id: string; text: string; scheduledAt: string; status: string };
type Draft = { name: string; objective: string; status: Campaign["status"]; startAt: string; endAt: string; brandIds: string[]; batchIds: string[]; postIds: string[] };
const BLANK: Draft = { name: "", objective: "", status: "draft", startAt: "", endAt: "", brandIds: [], batchIds: [], postIds: [] };

export function CampaignsWorkspace({ initialCampaigns, brands, batches, posts, owner }: { initialCampaigns: Campaign[]; brands: string[]; batches: BatchOption[]; posts: PostOption[]; owner: boolean }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedId, setSelectedId] = useState(initialCampaigns[0]?.id ?? "new");
  const selected = campaigns.find((campaign) => campaign.id === selectedId);
  const [draft, setDraft] = useState<Draft>(selected ? fromCampaign(selected) : BLANK);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const approvalRate = selected?.progress.assets ? Math.round(selected.progress.approved / selected.progress.assets * 100) : 0;
  const availablePosts = useMemo(() => posts.filter((post) => post.status !== "cancelled"), [posts]);

  function select(id: string) {
    setSelectedId(id); setNotice(null);
    const campaign = campaigns.find((candidate) => candidate.id === id);
    setDraft(campaign ? fromCampaign(campaign) : BLANK);
  }
  function toggle(field: "brandIds" | "batchIds" | "postIds", value: string) { setDraft((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] })); }
  async function save() {
    if (!draft.name.trim() || !draft.objective.trim()) return setNotice("Name and objective are required.");
    setBusy(true); setNotice(null);
    try {
      const body = { ...draft, startAt: draft.startAt ? new Date(`${draft.startAt}T00:00:00Z`).toISOString() : undefined, endAt: draft.endAt ? new Date(`${draft.endAt}T23:59:59Z`).toISOString() : undefined };
      const response = await fetch(selected ? `/api/campaigns/${encodeURIComponent(selected.id)}` : "/api/campaigns", { method: selected ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { campaign?: Campaign; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "campaign could not be saved");
      setCampaigns((current) => selected ? current.map((campaign) => campaign.id === result.campaign!.id ? result.campaign! : campaign) : [result.campaign!, ...current]);
      setSelectedId(result.campaign.id); setDraft(fromCampaign(result.campaign)); setNotice(selected ? "Campaign updated." : "Campaign created.");
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || !confirm(`Delete “${selected.name}”? The linked assets and posts stay intact.`)) return;
    setBusy(true);
    const response = await fetch(`/api/campaigns/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) return setNotice("Campaign could not be deleted.");
    const next = campaigns.filter((campaign) => campaign.id !== selected.id); setCampaigns(next); select(next[0]?.id ?? "new");
  }

  return <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><a href="/dashboard" className="eyebrow hover:text-bone">← WORKSPACE</a><div className="rail w-12 mt-5" /><h1 className="font-display text-4xl font-bold mt-4">Campaigns</h1><p className="text-muted mt-2 max-w-2xl">Keep the objective, production rail, approvals and outcomes connected.</p></div><div className="flex gap-2"><a href="/analytics" className="btn-ghost !py-2">Performance</a>{owner && <button className="btn !py-2" onClick={() => select("new")}>+ New campaign</button>}</div></header>
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 mt-10">
      <aside className="panel p-2 h-fit"><p className="eyebrow text-bone px-3 pt-3 pb-2">INITIATIVES ({campaigns.length})</p>{campaigns.length ? campaigns.map((campaign) => <button key={campaign.id} onClick={() => select(campaign.id)} className={`w-full text-left p-3 border mt-1 transition-colors ${selectedId === campaign.id ? "border-signal bg-signal/5" : "border-transparent hover:border-hairline"}`}><div className="flex justify-between gap-2"><p className="text-sm text-bone truncate">{campaign.name}</p><span className={`font-mono text-[9px] uppercase ${campaign.status === "active" ? "text-green" : "text-muted"}`}>{campaign.status}</span></div><p className="font-mono text-[9px] text-muted mt-2">{campaign.progress.approved}/{campaign.progress.assets} APPROVED · {campaign.progress.published} LIVE</p></button>) : <p className="text-sm text-muted p-3">Create the first campaign to connect the workflow.</p>}</aside>

      <section>
        {selected && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"><Mini label="ASSETS" value={String(selected.progress.assets)} /><Mini label="APPROVED" value={`${approvalRate}%`} /><Mini label="PUBLISHED" value={String(selected.progress.published)} /><Mini label="ENGAGEMENTS" value={String(selected.progress.engagements)} /></div>}
        <div className="panel p-5 sm:p-7"><div className="flex items-center justify-between"><p className="eyebrow text-signal">{selected ? "CAMPAIGN CONTROL" : "NEW CAMPAIGN"}</p>{selected && owner && <button className="font-mono text-[10px] text-muted hover:text-signal" onClick={remove} disabled={busy}>DELETE</button>}</div>
          {!owner && <p className="panel px-3 py-2 mt-4 font-mono text-[10px] text-muted">REVIEWER VIEW · CAMPAIGN SETTINGS ARE OWNER-ONLY</p>}
          <div className="grid sm:grid-cols-[1fr_180px] gap-3 mt-6"><label><span className="eyebrow">NAME</span><input className="field mt-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} disabled={!owner} placeholder="Q3 category launch" /></label><label><span className="eyebrow">STATUS</span><select className="field mt-2" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Campaign["status"] })} disabled={!owner}><option value="draft">Draft</option><option value="active">Active</option><option value="complete">Complete</option></select></label></div>
          <label className="block mt-4"><span className="eyebrow">OBJECTIVE + SUCCESS CONDITION</span><textarea className="field mt-2 min-h-28 resize-y" value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} disabled={!owner} placeholder="Generate qualified demand for the new offer. Success = 40 demo requests from organic social." /></label>
          <div className="grid sm:grid-cols-2 gap-3 mt-4"><label><span className="eyebrow">START</span><input className="field mt-2" type="date" value={draft.startAt} onChange={(event) => setDraft({ ...draft, startAt: event.target.value })} disabled={!owner} /></label><label><span className="eyebrow">END</span><input className="field mt-2" type="date" value={draft.endAt} onChange={(event) => setDraft({ ...draft, endAt: event.target.value })} disabled={!owner} /></label></div>

          <LinkGroup title="BRANDS" empty="Compile a brand first." items={brands.map((brand) => ({ id: brand, label: brand, meta: "BRAND SYSTEM" }))} selected={draft.brandIds} onToggle={(id) => toggle("brandIds", id)} disabled={!owner} />
          <LinkGroup title="PRODUCTION BATCHES" empty="Create a review batch first." items={batches.map((batch) => ({ id: batch.id, label: batch.title, meta: `${batch.counts.approved}/${batch.counts.total} APPROVED` }))} selected={draft.batchIds} onToggle={(id) => toggle("batchIds", id)} disabled={!owner} />
          <LinkGroup title="CALENDAR POSTS" empty="Schedule a post first." items={availablePosts.slice(0, 30).map((post) => ({ id: post.id, label: post.text || "Untitled post", meta: `${post.status.toUpperCase()} · ${post.scheduledAt.slice(0, 10)}` }))} selected={draft.postIds} onToggle={(id) => toggle("postIds", id)} disabled={!owner} />
          {notice && <p className="font-mono text-xs text-signal mt-5">{notice}</p>}
          {owner && <div className="flex justify-end mt-6"><button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : selected ? "Save campaign" : "Create campaign"}</button></div>}
        </div>
      </section>
    </div>
  </main>;
}

function fromCampaign(campaign: Campaign): Draft { return { name: campaign.name, objective: campaign.objective, status: campaign.status, startAt: campaign.startAt?.slice(0, 10) ?? "", endAt: campaign.endAt?.slice(0, 10) ?? "", brandIds: campaign.brandIds, batchIds: campaign.batchIds, postIds: campaign.postIds }; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="panel p-3"><p className="eyebrow">{label}</p><p className="font-display text-2xl font-bold mt-2">{value}</p></div>; }
function LinkGroup({ title, empty, items, selected, onToggle, disabled }: { title: string; empty: string; items: Array<{ id: string; label: string; meta: string }>; selected: string[]; onToggle: (id: string) => void; disabled: boolean }) { return <fieldset className="mt-6"><legend className="eyebrow text-bone">{title} <span className="text-signal">({selected.length})</span></legend>{items.length ? <div className="grid sm:grid-cols-2 gap-2 mt-3 max-h-52 overflow-y-auto pr-1">{items.map((item) => <label key={item.id} className={`border p-3 flex gap-3 cursor-pointer ${selected.includes(item.id) ? "border-signal bg-signal/5" : "border-hairline"}`}><input type="checkbox" className="accent-[#ff4d00]" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} disabled={disabled} /><span className="min-w-0"><span className="block text-sm text-bone truncate">{item.label}</span><span className="block font-mono text-[9px] text-muted mt-1">{item.meta}</span></span></label>)}</div> : <p className="text-muted text-sm mt-3">{empty}</p>}</fieldset>; }
