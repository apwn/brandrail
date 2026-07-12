import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { AccountBar } from "./account-bar";
import { BillingControls } from "./billing-controls";
import { ChannelsCard } from "./channels-card";

type Usage = {
  user: { id: string; email: string | null; plan: "free" | "studio" | "agency" };
  limit: number;
  counts: { brands: number; batches: number; rendersThisMonth: number };
};

async function load<T>(path: string, uid: string, fallback: T): Promise<T> {
  try {
    const res = await engine(path, {}, uid);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default async function Dashboard() {
  const uid = await getUserId();

  if (!uid) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20">
        <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
        <h1 className="font-display font-bold text-3xl mt-6">Your workspace</h1>
        <p className="text-muted mt-3">
          Nothing here yet. <a className="text-signal" href="/">Compile a brand →</a> and it&rsquo;ll show up in your workspace.
        </p>
      </main>
    );
  }

  const [usage, specs, batches] = await Promise.all([
    load<Usage>("/v0/me/usage", uid, { user: { id: uid, email: null, plan: "free" }, limit: 50, counts: { brands: 0, batches: 0, rendersThisMonth: 0 } }),
    load<{ specs: Array<{ name: string; version: number }> }>("/v0/specs", uid, { specs: [] }),
    load<{ batches: Array<{ id: string; title: string; createdAt: string; counts: { total: number; approved: number; flagged: number; pending: number } }> }>("/v0/batches", uid, { batches: [] }),
  ]);

  const used = usage.counts.rendersThisMonth;
  const pct = Math.min(100, Math.round((used / usage.limit) * 100));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rail w-10" aria-hidden />
          <a href="/" className="font-display font-bold text-lg tracking-tight">brandrail</a>
          <span className="eyebrow mt-[2px]">WORKSPACE</span>
        </div>
        <nav className="flex gap-5 eyebrow">
          <a href="/" className="hover:text-bone">COMPILE</a>
          <a href="/review" className="hover:text-bone">REVIEW</a>
        </nav>
      </header>

      {/* account + usage */}
      <section className="mt-10 grid md:grid-cols-[1fr_1fr] gap-4">
        <AccountBar email={usage.user.email} plan={usage.user.plan} />
        <div className="panel p-5">
          <p className="eyebrow text-bone">RENDERS THIS MONTH</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display font-bold text-3xl">{used}</span>
            <span className="text-muted font-mono text-sm">/ {usage.limit} · {usage.user.plan}</span>
          </div>
          <div className="h-1.5 bg-hairline mt-3 rounded-none overflow-hidden">
            <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 100 && <p className="text-signal font-mono text-xs mt-2">limit reached — resets next month</p>}
          <BillingControls plan={usage.user.plan} />
        </div>
      </section>

      <ChannelsCard />

      {/* brands */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">BRANDS ({specs.specs.length})</p>
          <a href="/" className="btn-ghost !py-1.5 !px-3 text-xs">+ Compile a brand</a>
        </div>
        {specs.specs.length === 0 ? (
          <p className="text-muted text-sm">No brands yet — <a className="text-signal" href="/">compile your first →</a></p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {specs.specs.map((s) => (
              <div key={s.name} className="panel px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-bone">{s.name}</p>
                  <p className="font-mono text-[11px] text-muted">v{s.version}</p>
                </div>
                <a href="/review" className="eyebrow hover:text-bone">USE →</a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* batches */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow text-bone">REVIEW BATCHES ({batches.batches.length})</p>
          <a href="/review" className="btn-ghost !py-1.5 !px-3 text-xs">+ New batch</a>
        </div>
        {batches.batches.length === 0 ? (
          <p className="text-muted text-sm">No batches yet — <a className="text-signal" href="/review">start a review queue →</a></p>
        ) : (
          <div className="flex flex-col gap-2">
            {batches.batches.map((b) => (
              <a key={b.id} href={`/review?batch=${encodeURIComponent(b.id)}`} className="panel px-4 py-3 flex items-center justify-between hover:border-bone transition-colors duration-mech">
                <div>
                  <p className="text-bone">{b.title}</p>
                  <p className="font-mono text-[11px] text-muted">{b.createdAt.slice(0, 10)}</p>
                </div>
                <p className="font-mono text-xs text-muted">
                  <span className="text-signal">{b.counts.approved}</span> approved · {b.counts.pending} pending · {b.counts.flagged} flagged
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
