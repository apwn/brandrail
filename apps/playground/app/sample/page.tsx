import { JourneyRail } from "../components/journey-rail";
import { WorkspaceHeader } from "../components/workspace-header";

const plan = [
  ["Mon · Educate", "Why washed coffee tastes brighter", "Instagram + LinkedIn"],
  ["Wed · Prove", "From farm lot to roast profile", "Carousel + Bluesky"],
  ["Fri · Convert", "Meet the July subscription box", "Instagram + Facebook"],
] as const;

export const metadata = { title: "Sample workspace · Brandrail" };

export default function SampleWorkspacePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
      <WorkspaceHeader context="Guided sample" active="sample" />
      <JourneyRail active="review" completed={["brand", "plan"]} />

      <section className="mt-10 grid gap-8 border border-signal/50 bg-panel p-6 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="eyebrow text-signal">SAFE SAMPLE · NOTHING HERE PUBLISHES</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">See the whole product before setting anything up.</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">Northstar Coffee is a complete example: one enforced brand, a focused plan, a human decision, a scheduled set, and a performance signal that improves the next brief.</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <a href="/" className="btn">Use my own brand →</a>
          <a href="/dashboard?welcome=agent#agent" className="btn-ghost">Connect an agent</a>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3" aria-label="Sample workflow">
        <article className="panel p-5">
          <p className="eyebrow text-signal">01 / BRAND</p>
          <h2 className="mt-3 font-display text-2xl font-bold">Northstar Coffee</h2>
          <p className="mt-2 text-sm text-muted">Warm, precise, origin-led. Never use false scarcity or generic luxury language.</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline pt-4 font-mono text-[9px]">
            <div><dt className="text-muted">VOICE RULES</dt><dd className="mt-1 text-bone">12 enforced</dd></div>
            <div><dt className="text-muted">VISUAL CHECKS</dt><dd className="mt-1 text-green">18 passing</dd></div>
          </dl>
        </article>

        <article className="panel p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-signal">02 / FOUR-WEEK PLAN</p><h2 className="mt-3 font-display text-2xl font-bold">Make origin expertise commercially useful.</h2></div><span className="font-mono text-[9px] text-green">DRY PLAN APPROVED</span></div>
          <div className="mt-5 divide-y divide-hairline border-y border-hairline">
            {plan.map(([slot, idea, channels]) => <div key={slot} className="grid gap-2 py-3 sm:grid-cols-[120px_1fr_150px]"><span className="font-mono text-[9px] text-muted">{slot}</span><span className="text-sm text-bone">{idea}</span><span className="font-mono text-[9px] text-muted sm:text-right">{channels}</span></div>)}
          </div>
        </article>

        <article className="panel border-signal/50 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-signal">03 / DECISION</p><h2 className="mt-3 font-display text-2xl font-bold">One item needs a human.</h2><p className="mt-2 text-sm text-muted">The agent can produce drafts, but this exact copy and destination require approval.</p></div><span className="border border-signal/50 px-2 py-1 font-mono text-[9px] text-signal">REVIEW DUE TODAY</span></div>
          <div className="mt-5 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-semibold text-bone">July subscription launch · 5 assets</p><p className="mt-1 font-mono text-[9px] text-muted">Estimated impact: 5 finished assets · 3 destinations · no immediate publishing</p></div><a href="/inbox" className="btn !px-4 !py-2 text-xs">Open real inbox →</a></div>
        </article>

        <article className="panel p-5">
          <p className="eyebrow text-signal">04 / SCHEDULE</p>
          <h2 className="mt-3 font-display text-2xl font-bold">Three approved slots</h2>
          <p className="mt-2 text-sm text-muted">Every destination keeps the approval and render references.</p>
          <p className="mt-5 font-mono text-[9px] text-green">NEXT · MON 10:00 AM</p>
        </article>

        <article className="panel p-5 lg:col-span-3">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="eyebrow text-signal">05 / LEARN</p><h2 className="mt-3 font-display text-2xl font-bold">Origin stories earn 1.8× more saves.</h2><p className="mt-2 max-w-3xl text-sm text-muted">Recommendation: keep the educational opening, test a product-specific call to action, and require human confirmation before it changes the next plan.</p></div><a href="/analytics" className="btn-ghost whitespace-nowrap">Open performance →</a></div>
        </article>
      </section>
    </main>
  );
}
