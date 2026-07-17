import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AccountBar } from "./account-bar";
import { BillingControls } from "./billing-controls";
import { ChannelsCard } from "./channels-card";
import { OnboardingChecklist } from "./onboarding";
import { ApiKeysCard } from "./api-keys-card";
import { MembersCard } from "./members-card";
import { QueueCard } from "./queue-card";
import { BrandActions } from "./brand-actions";
import { CheckoutIntent } from "./checkout-intent";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ShareBatchButton } from "./share-batch-button";
import { WebhooksCard } from "./webhooks-card";
import { WorkspaceHeader } from "../components/workspace-header";
import { JourneyRail } from "../components/journey-rail";
import { redirect } from "next/navigation";

type Usage = {
  user: { id: string; email: string | null; emailVerified?: boolean; plan: "free" | "studio" | "agency"; members?: string[] };
  role: "owner" | "reviewer";
  workspaceId: string;
  entitlements: { brands: number; apiKeys: number; features: string[] };
  limit: number;
  genLimit: number;
  counts: { brands: number; batches: number; rendersThisMonth: number; generativeThisMonth: number };
};

async function load<T>(path: string, uid: string, fallback: T, unavailable: string[], expectedDenied = false): Promise<T> {
  try {
    const res = await engine(path, {}, uid);
    if (res.ok) return (await res.json()) as T;
    if (expectedDenied && res.status === 403) return fallback;
    unavailable.push(path);
    return fallback;
  } catch {
    unavailable.push(path);
    return fallback;
  }
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; checkout?: string; upgraded?: string; connected?: string; channelError?: string; return?: string }> }) {
  const { welcome, checkout, upgraded, connected, channelError, return: requestedReturn } = await searchParams;
  const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : undefined;
  const uid = await getUserId();

  if (!uid) {
    redirect("/login?return=%2Fdashboard");
  }

  const unavailable: string[] = [];
  const [usage, specs, batches, channels, renders, workspaces, scheduled, keys, audit, runs, programs] = await Promise.all([
    load<Usage>("/v0/me/usage", uid, { user: { id: uid, email: null, plan: "free" }, role: "owner", workspaceId: uid, entitlements: { brands: 1, apiKeys: 1, features: ["agentAccess", "apiKeys"] }, limit: 50, genLimit: 5, counts: { brands: 0, batches: 0, rendersThisMonth: 0, generativeThisMonth: 0 } }, unavailable),
    load<{ specs: Array<{ name: string; version: number; active?: boolean }> }>("/v0/specs", uid, { specs: [] }, unavailable),
    load<{ batches: Array<{ id: string; title: string; createdAt: string; counts: { total: number; approved: number; flagged: number; pending: number } }> }>("/v0/batches", uid, { batches: [] }, unavailable, true),
    load<{ channels: Array<{ id: string }> }>("/v0/channels", uid, { channels: [] }, unavailable, true),
    load<{ renders: Array<{ id: string; createdAt: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string; width: number; height: number }> } }> }>("/v0/renders?limit=12", uid, { renders: [] }, unavailable),
    load<{ workspaces: Array<{ id: string; label: string; role: "owner" | "reviewer"; active: boolean }> }>("/v0/me/workspaces", uid, { workspaces: [] }, unavailable),
    load<{ posts: Array<{ status: string }> }>("/v0/scheduled", uid, { posts: [] }, unavailable, true),
    load<{ keys: Array<{ id: string; lastUsedAt?: string | null; expiresAt?: string | null }> }>("/v0/me/keys", uid, { keys: [] }, unavailable),
    load<{ events: Array<{ actor: string; path: string; status: number }> }>("/v0/me/audit?limit=25", uid, { events: [] }, unavailable),
    load<{ runs: Array<{ id: string; objective: string; brand?: string; status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled"; progress: number; currentStep: string; updatedAt: string }> }>("/v0/agent/runs?limit=6", uid, { runs: [] }, unavailable),
    load<{ programs: Array<{ brand: string; name: string; status: "active" | "paused" | "scheduled" | "complete"; perWeek: number; nextRunAt: string | null; timeZone?: string; plannedPosts?: Array<unknown> }> }>("/v0/content-programs", uid, { programs: [] }, unavailable, true),
  ]);

  const used = usage.counts.rendersThisMonth;
  const pct = Math.min(100, Math.round((used / usage.limit) * 100));
  const genUsed = usage.counts.generativeThisMonth ?? 0;
  const genPct = Math.min(100, Math.round((genUsed / (usage.genLimit || 1)) * 100));
  const owner = usage.role === "owner";
  const has = (feature: string) => usage.entitlements.features.includes(feature);
  const firstBrand = specs.specs.find((item) => item.active !== false)?.name;
  const createHref = firstBrand ? `/?brand=${encodeURIComponent(firstBrand)}` : "/";
  const agentIntent = welcome === "agent";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <WorkspaceHeader context="Workspace" active="home" plan={usage.user.plan} />
      <JourneyRail completed={[
        ...(specs.specs.length ? ["brand" as const] : []),
        ...(programs.programs.length ? ["plan" as const] : []),
        ...(batches.batches.some((batch) => batch.counts.approved > 0) ? ["review" as const] : []),
        ...(scheduled.posts.some((post) => post.status !== "cancelled") ? ["schedule" as const] : []),
      ]} />

      {workspaces.workspaces.length > 1 && <div className="mt-4 flex justify-end"><WorkspaceSwitcher workspaces={workspaces.workspaces} /></div>}

      {unavailable.length > 0 && (
        <div className="mt-6 border border-signal/60 bg-panel px-4 py-3" role="alert">
          <p className="text-sm text-bone"><span className="font-mono text-signal">WORKSPACE PARTIALLY UNAVAILABLE</span> · Some information could not be loaded. Nothing has been deleted.</p>
          <p className="mt-1 text-xs text-muted">Refresh to try again. Empty areas below may be unavailable rather than genuinely empty.</p>
        </div>
      )}

      {welcome && (
        <div className="panel border-green/50 mt-8 px-4 py-3 text-sm">
          <span className="font-mono text-green">✓</span>{" "}
          {welcome === "back" ? "Welcome back — your workspace followed you to this device." : welcome === "upgraded" ? "Plan active — the full production workflow is ready." : "You're in. This workspace is now yours on any device."}
        </div>
      )}

      {connected && <div className="panel border-green/50 mt-4 px-4 py-3 text-sm"><span className="font-mono text-green">✓</span> {connected} connected. It is ready in the calendar.</div>}
      {channelError && <div className="panel border-signal/50 mt-4 px-4 py-3 text-sm text-signal">Channel connection failed: {channelError}</div>}

      <CheckoutIntent checkout={checkout} upgraded={upgraded} currentPlan={usage.user.plan} returnTo={returnTo} />

      {!owner && (
        <div className="panel border-green/40 mt-8 px-4 py-3 text-sm">
          <span className="font-mono text-green">REVIEWER</span>{" "}
          You can inspect brands and approve, edit or flag queued work. Billing, credentials, automation and workspace settings remain owner-only.
        </div>
      )}

      {owner && <OnboardingChecklist
        verified={Boolean(usage.user.emailVerified)}
        hasBrand={specs.specs.length > 0}
        hasRender={renders.renders.length > 0}
        firstBrand={firstBrand}
        hasAgent={keys.keys.some((key) => Boolean(key.lastUsedAt) && (!key.expiresAt || Date.parse(key.expiresAt) > Date.now()))}
        hasAgentRun={runs.runs.length > 0 || audit.events.some((event) => event.actor === "agent" && event.status < 400 && (event.path.startsWith("/v0/agent/runs") || ["/v0/agent/plan", "/v0/render", "/v0/compile"].includes(event.path)))}
        hasChannel={channels.channels.length > 0}
        hasApproved={batches.batches.some((b) => b.counts.approved > 0)}
        hasScheduled={scheduled.posts.some((post) => post.status !== "cancelled")}
        canPublish={has("publishing")}
        canReview={has("batchReview")}
        canProgram={has("autopilot")}
        hasProgram={programs.programs.length > 0}
        intent={agentIntent ? "agent" : "studio"}
      />}

      {agentIntent && owner && has("agentAccess") && <ApiKeysCard verified={Boolean(usage.user.emailVerified)} keyLimit={usage.entitlements.apiKeys} plan={usage.user.plan} />}
      {owner && has("agentAccess") && runs.runs.length > 0 && <section id="agent-runs" className="mt-4 border border-hairline bg-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="eyebrow text-signal">DURABLE AGENT RUNS</p><h2 className="font-display text-xl font-bold mt-2">Work that survives the chat.</h2></div><a href="/runs" className="font-mono text-[10px] text-signal hover:text-bone">VIEW ALL →</a></div>
        <div className="mt-4 divide-y divide-hairline">
          {runs.runs.map((run) => <a href={`/runs/${encodeURIComponent(run.id)}`} key={run.id} className="group grid gap-3 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_120px_110px_18px] sm:items-center"><div><p className="text-sm text-bone group-hover:text-white">{run.objective}</p><p className="font-mono text-[10px] text-muted mt-1">{run.brand ?? "brand pending"} · {run.id}</p></div><div><p className={`font-mono text-[10px] ${run.status === "failed" ? "text-signal" : run.status === "completed" ? "text-green" : "text-bone"}`}>{run.status.replace("_", " ").toUpperCase()}</p><p className="font-mono text-[9px] text-muted mt-1">{run.currentStep}</p></div><div><div className="h-1 bg-hairline"><div className="h-full bg-signal" style={{ width: `${Math.max(2, run.progress)}%` }} /></div><p className="font-mono text-[9px] text-muted mt-1 text-right">{run.progress}%</p></div><span className="text-muted group-hover:text-signal" aria-hidden>→</span></a>)}
        </div>
      </section>}
      {owner && has("webhooks") && <WebhooksCard />}

      {/* account + usage */}
      <section id="account" className="mt-10 grid md:grid-cols-[1fr_1fr] gap-4">
        <AccountBar email={usage.user.email} verified={usage.user.emailVerified} plan={usage.user.plan} role={usage.role} />
        <div className="panel p-5">
          <p className="eyebrow text-bone">FINISHED ASSETS THIS MONTH</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display font-bold text-3xl">{used}</span>
            <span className="text-muted font-mono text-sm">/ {usage.limit} · {usage.user.plan}</span>
          </div>
          <div className="h-1.5 bg-hairline mt-3 rounded-none overflow-hidden">
            <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 100 && <p className="text-signal font-mono text-xs mt-2">limit reached — resets next month</p>}

          <div className="mt-4 pt-4 border-t border-hairline">
            <p className="eyebrow text-bone">GENERATIVE IMAGES <span className="text-muted">· metered separately (API cost)</span></p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display font-bold text-2xl">{genUsed}</span>
              <span className="text-muted font-mono text-sm">/ {usage.genLimit} this month</span>
            </div>
            <div className="h-1.5 bg-hairline mt-3 rounded-none overflow-hidden">
              <div className="h-full bg-signal" style={{ width: `${genPct}%` }} />
            </div>
            {genPct >= 100 && <p className="text-signal font-mono text-xs mt-2">generative cap reached — self-host with your own fal.ai key for uncapped</p>}
          </div>

          {owner && <BillingControls plan={usage.user.plan} />}
        </div>
      </section>

      {/* brands */}
      <section id="brands" className="mt-10 scroll-mt-24">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">ACTIVE BRANDS ({specs.specs.filter((s) => s.active !== false).length} / {usage.entitlements.brands})</p>
          {owner && specs.specs.filter((s) => s.active !== false).length < usage.entitlements.brands && <a href="/" className="btn-ghost !py-1.5 !px-3 text-xs">+ Compile a brand</a>}
        </div>
        {specs.specs.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-panel p-4"><p className="text-muted text-sm">No brands yet. Start with your own site, or explore a complete example first.</p><div className="flex flex-wrap gap-2"><a className="btn-ghost !px-3 !py-2 text-xs" href="/sample">Explore sample</a><a className="btn !px-3 !py-2 text-xs" href="/">Compile my brand →</a></div></div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {specs.specs.map((s) => (
              <div key={s.name} className="panel px-4 py-3">
                <div>
                  <a href={`/brands/${encodeURIComponent(s.name)}`} className="font-mono text-sm text-bone hover:text-signal">{s.name} →</a>
                  <p className="font-mono text-[11px] text-muted">v{s.version}{s.active === false ? " · archived by plan limit" : ""}</p>
                </div>
                <BrandActions brand={s.name} canReport={has("reports")} canDelete={owner} />
              </div>
            ))}
          </div>
        )}
      </section>

      {!agentIntent && owner && has("agentAccess") && <ApiKeysCard verified={Boolean(usage.user.emailVerified)} keyLimit={usage.entitlements.apiKeys} plan={usage.user.plan} />}

      {owner && <ProgramRail
        plan={usage.user.plan}
        verified={Boolean(usage.user.emailVerified)}
        hasBrand={Boolean(firstBrand)}
        programs={programs.programs}
      />}

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">RECENT ASSETS ({renders.renders.length})</p>
          <a href={createHref} className="btn-ghost !py-1.5 !px-3 text-xs">+ Create assets</a>
        </div>
        {renders.renders.length === 0 ? (
          <p className="text-muted text-sm">Your finished assets will stay here after the first render.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {renders.renders.map((render) => {
              const cover = render.manifest.assets[0];
              return (
                <article key={render.id} className="panel overflow-hidden">
                  {cover && <img src={`/api/asset/${encodeURIComponent(render.id)}/${encodeURIComponent(cover.filename)}`} alt={`${render.manifest.brand}: ${render.manifest.brief}`} className="aspect-[1.9/1] w-full object-cover border-b border-hairline" />}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3"><a href={`/brands/${encodeURIComponent(render.manifest.brand)}`} className="font-mono text-xs text-signal hover:text-bone">{render.manifest.brand}</a><span className="font-mono text-[10px] text-muted">{render.createdAt.slice(0, 10)}</span></div>
                    <p className="mt-2 line-clamp-2 text-sm text-bone">{render.manifest.brief}</p>
                    <div className="mt-3 flex items-center justify-between gap-3"><p className="font-mono text-[10px] text-muted">{render.manifest.assets.length} files · saved</p><a href={`/?brand=${encodeURIComponent(render.manifest.brand)}&brief=${encodeURIComponent(render.manifest.brief)}`} className="eyebrow text-signal hover:text-bone">CREATE AGAIN →</a></div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {owner && usage.user.plan === "free" ? <UpgradeRail verified={Boolean(usage.user.emailVerified)} /> : (
        <>
          {has("batchReview") ? <QueueCard /> : !owner ? <LockedFeature title="BATCH REVIEW" plan="Studio" /> : null}
          {owner && has("publishing") && <ChannelsCard />}
          {owner && <MembersCard plan={usage.user.plan} members={usage.user.members ?? []} />}
        </>
      )}

      {/* batches */}
      {has("batchReview") && <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">REVIEW BATCHES ({batches.batches.length})</p>
          <a href="/review" className="btn-ghost !py-1.5 !px-3 text-xs">+ New batch</a>
        </div>
        {batches.batches.length === 0 ? (
          <p className="text-muted text-sm">No batches yet — <a className="text-signal" href="/review">start a review queue →</a></p>
        ) : (
          <div className="flex flex-col gap-2">
            {batches.batches.map((b) => (
              <div key={b.id} className="panel px-4 py-3 flex items-center justify-between hover:border-bone transition-colors duration-mech">
                <div>
                  <a href={`/review?batch=${encodeURIComponent(b.id)}`} className="text-bone hover:text-signal">{b.title} →</a>
                  <p className="font-mono text-[11px] text-muted">{b.createdAt.slice(0, 10)}</p>
                  {owner && has("team") && <ShareBatchButton batchId={b.id} />}
                </div>
                <p className="font-mono text-xs text-muted">
                  <span className="text-signal">{b.counts.approved}</span> approved · {b.counts.pending} pending · {b.counts.flagged} flagged
                </p>
              </div>
            ))}
          </div>
        )}
      </section>}
    </main>
  );
}

function ProgramRail({ plan, verified, hasBrand, programs }: {
  plan: "free" | "studio" | "agency";
  verified: boolean;
  hasBrand: boolean;
  programs: Array<{ brand: string; name: string; status: "active" | "paused" | "scheduled" | "complete"; perWeek: number; nextRunAt: string | null; timeZone?: string; plannedPosts?: Array<unknown> }>;
}) {
  const active = programs[0];
  const next = active?.nextRunAt ? new Date(active.nextRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: active.timeZone ?? "UTC" }) : "—";
  return (
    <section className="mt-10 border border-signal/50 bg-panel p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3"><p className="eyebrow text-signal">YOUR CONTENT PROGRAM</p>{active && <span className={`font-mono text-[9px] uppercase ${active.status === "active" ? "text-green" : "text-muted"}`}>● {active.status}</span>}</div>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-bold">{active ? active.name : hasBrand ? "Stop planning from zero every week." : "One brand system unlocks the whole content engine."}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{active
            ? `${active.perWeek} posts each week · ${active.plannedPosts?.length ?? 0} ideas kept ahead · next production ${next}. Open the program to review the strategy, calendar and controls.`
            : hasBrand
              ? plan === "free" ? "Turn one outcome into a personalized, exportable four-week calendar. Previewing costs zero assets and needs no card." : "Set the outcome once. Brandrail plans four weeks, produces the next week and adapts what follows."
              : "Compile your website once so every future plan, caption and asset starts inside the same brand rules."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={hasBrand ? "/program" : "/"} className="btn whitespace-nowrap">{active ? "Open program →" : hasBrand ? "Plan my next 4 weeks →" : "Compile my brand →"}</a>
          {active && <a href="/review" className="btn-ghost whitespace-nowrap">Review queue →</a>}
          {!active && plan === "free" && hasBrand && <a href={verified ? "/dashboard?checkout=studio&return=%2Fprogram" : "/login?plan=studio&return=%2Fprogram"} className="btn-ghost whitespace-nowrap">See Studio →</a>}
        </div>
      </div>
    </section>
  );
}

function UpgradeRail({ verified }: { verified: boolean }) {
  return (
    <section className="mt-10 border border-signal/50 bg-panel p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="eyebrow text-signal">WHEN A CALENDAR SHOULD RUN ITSELF</p><h2 className="font-display text-2xl font-bold mt-3">Turn the free plan into finished content every week.</h2><p className="text-muted text-sm mt-3 max-w-2xl leading-relaxed">Studio keeps the next four weeks full, renders the next production week, pauses for approval and schedules the work you accept. Your agent can operate the same rail without bypassing you.</p><div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 font-mono text-[11px] text-bone"><span>✓ PLAN 4 WEEKS</span><span>✓ PRODUCE WEEK</span><span>✓ APPROVE</span><span>✓ PUBLISH</span><span>✓ LEARN</span></div></div>
        <a href={verified ? "/dashboard?checkout=studio&return=%2Fprogram" : "/login?plan=studio&return=%2Fprogram"} className="btn whitespace-nowrap">Activate my content program →</a>
      </div>
    </section>
  );
}

function LockedFeature({ title, plan }: { title: string; plan: string }) {
  return (
    <section className="panel p-5 mt-4 flex items-center justify-between gap-5">
      <div><p className="eyebrow text-bone">{title}</p><p className="text-muted text-sm mt-1">Included with {plan} when you need the production workflow.</p></div>
      <a href="/#pricing" className="btn-ghost !py-2 !px-3 text-xs whitespace-nowrap">Compare plans →</a>
    </section>
  );
}
