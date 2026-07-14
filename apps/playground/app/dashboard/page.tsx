import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AccountBar } from "./account-bar";
import { BillingControls } from "./billing-controls";
import { ChannelsCard } from "./channels-card";
import { OnboardingChecklist } from "./onboarding";
import { ApiKeysCard } from "./api-keys-card";
import { MembersCard } from "./members-card";
import { AutopilotCard } from "./autopilot-card";
import { QueueCard } from "./queue-card";
import { BrandActions } from "./brand-actions";
import { CheckoutIntent } from "./checkout-intent";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ShareBatchButton } from "./share-batch-button";
import { WebhooksCard } from "./webhooks-card";
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

async function load<T>(path: string, uid: string, fallback: T): Promise<T> {
  try {
    const res = await engine(path, {}, uid);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; checkout?: string; upgraded?: string; connected?: string; channelError?: string }> }) {
  const { welcome, checkout, upgraded, connected, channelError } = await searchParams;
  const uid = await getUserId();

  if (!uid) {
    redirect("/login");
  }

  const [usage, specs, batches, channels, renders, workspaces, scheduled, keys, audit] = await Promise.all([
    load<Usage>("/v0/me/usage", uid, { user: { id: uid, email: null, plan: "free" }, role: "owner", workspaceId: uid, entitlements: { brands: 1, apiKeys: 1, features: ["agentAccess", "apiKeys"] }, limit: 50, genLimit: 5, counts: { brands: 0, batches: 0, rendersThisMonth: 0, generativeThisMonth: 0 } }),
    load<{ specs: Array<{ name: string; version: number; active?: boolean }> }>("/v0/specs", uid, { specs: [] }),
    load<{ batches: Array<{ id: string; title: string; createdAt: string; counts: { total: number; approved: number; flagged: number; pending: number } }> }>("/v0/batches", uid, { batches: [] }),
    load<{ channels: Array<{ id: string }> }>("/v0/channels", uid, { channels: [] }),
    load<{ renders: Array<{ id: string; createdAt: string; manifest: { brand: string; brief: string; assets: Array<{ filename: string; format: string; width: number; height: number }> } }> }>("/v0/renders?limit=12", uid, { renders: [] }),
    load<{ workspaces: Array<{ id: string; label: string; role: "owner" | "reviewer"; active: boolean }> }>("/v0/me/workspaces", uid, { workspaces: [] }),
    load<{ posts: Array<{ status: string }> }>("/v0/scheduled", uid, { posts: [] }),
    load<{ keys: Array<{ id: string }> }>("/v0/me/keys", uid, { keys: [] }),
    load<{ events: Array<{ actor: string; path: string; status: number }> }>("/v0/me/audit?limit=25", uid, { events: [] }),
  ]);

  const used = usage.counts.rendersThisMonth;
  const pct = Math.min(100, Math.round((used / usage.limit) * 100));
  const genUsed = usage.counts.generativeThisMonth ?? 0;
  const genPct = Math.min(100, Math.round((genUsed / (usage.genLimit || 1)) * 100));
  const owner = usage.role === "owner";
  const has = (feature: string) => usage.entitlements.features.includes(feature);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rail w-10" aria-hidden />
          <a href="/" className="font-display font-bold text-lg tracking-tight">brandrail</a>
          <span className="eyebrow mt-[2px]">WORKSPACE</span>
        </div>
        <nav className="flex items-center gap-5 eyebrow">
          {workspaces.workspaces.length > 1 && <WorkspaceSwitcher workspaces={workspaces.workspaces} />}
          {owner && <a href="#agent" className="text-signal hover:text-bone">AGENT</a>}
          <a href="/" className="hover:text-bone">COMPILE</a>
          <a href="/review" className="hover:text-bone">REVIEW</a>
          {owner && has("publishing") && <a href="/calendar" className="hover:text-bone">CALENDAR</a>}
          {has("planner") && <a href="/campaigns" className="hover:text-bone">CAMPAIGNS</a>}
          {owner && has("planner") && <a href="/analytics" className="hover:text-bone">SIGNAL</a>}
          <a href="/activity" className="hover:text-bone">ACTIVITY</a>
        </nav>
      </header>

      {welcome && (
        <div className="panel border-green/50 mt-8 px-4 py-3 text-sm">
          <span className="font-mono text-green">✓</span>{" "}
          {welcome === "back" ? "Welcome back — your workspace followed you to this device." : welcome === "upgraded" ? "Plan active — the full production workflow is ready." : "You're in. This workspace is now yours on any device."}
        </div>
      )}

      {connected && <div className="panel border-green/50 mt-4 px-4 py-3 text-sm"><span className="font-mono text-green">✓</span> {connected} connected. It is ready in the calendar.</div>}
      {channelError && <div className="panel border-signal/50 mt-4 px-4 py-3 text-sm text-signal">Channel connection failed: {channelError}</div>}

      <CheckoutIntent checkout={checkout} upgraded={upgraded} currentPlan={usage.user.plan} />

      {!owner && (
        <div className="panel border-green/40 mt-8 px-4 py-3 text-sm">
          <span className="font-mono text-green">REVIEWER</span>{" "}
          You can inspect brands and approve, edit or flag queued work. Billing, credentials, automation and workspace settings remain owner-only.
        </div>
      )}

      {owner && <OnboardingChecklist
        verified={Boolean(usage.user.emailVerified)}
        hasBrand={specs.specs.length > 0}
        hasAgent={keys.keys.length > 0}
        hasAgentRun={audit.events.some((event) => event.actor === "agent" && event.status < 400 && ["/v0/agent/plan", "/v0/render", "/v0/compile"].includes(event.path))}
        hasChannel={channels.channels.length > 0}
        hasApproved={batches.batches.some((b) => b.counts.approved > 0)}
        hasScheduled={scheduled.posts.some((post) => post.status !== "cancelled")}
        canPublish={has("publishing")}
        canReview={has("batchReview")}
      />}

      {owner && has("agentAccess") && <ApiKeysCard verified={Boolean(usage.user.emailVerified)} keyLimit={usage.entitlements.apiKeys} />}
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
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">ACTIVE BRANDS ({specs.specs.filter((s) => s.active !== false).length} / {usage.entitlements.brands})</p>
          {owner && specs.specs.filter((s) => s.active !== false).length < usage.entitlements.brands && <a href="/" className="btn-ghost !py-1.5 !px-3 text-xs">+ Compile a brand</a>}
        </div>
        {specs.specs.length === 0 ? (
          <p className="text-muted text-sm">No brands yet — <a className="text-signal" href="/">compile your first →</a></p>
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

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">RECENT ASSETS ({renders.renders.length})</p>
          <a href="/" className="btn-ghost !py-1.5 !px-3 text-xs">+ Create assets</a>
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
                    <p className="font-mono text-[10px] text-muted mt-2">{render.manifest.assets.length} files · saved</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {owner && usage.user.plan === "free" ? <UpgradeRail verified={Boolean(usage.user.emailVerified)} /> : (
        <>
          {owner && has("autopilot") && <AutopilotCard verified={Boolean(usage.user.emailVerified)} />}
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

function UpgradeRail({ verified }: { verified: boolean }) {
  return (
    <section className="mt-10 border border-signal/50 bg-panel p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="eyebrow text-signal">WHEN THE AGENT NEEDS TO OPERATE</p><h2 className="font-display text-2xl font-bold mt-3">Turn a free agent connection into a production system.</h2><p className="text-muted text-sm mt-3 max-w-2xl leading-relaxed">Free lets one agent compile, inspect and render one brand. Studio unlocks the operational rail: campaign planning, human approval pauses, signed events, direct publishing and the performance loop.</p><div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 font-mono text-[11px] text-bone"><span>✓ PLAN</span><span>✓ APPROVE</span><span>✓ PUBLISH</span><span>✓ AUTOMATE</span><span>✓ WEBHOOKS</span></div></div>
        <a href={verified ? "/dashboard?checkout=studio" : "/login?plan=studio"} className="btn whitespace-nowrap">Start Studio →</a>
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
