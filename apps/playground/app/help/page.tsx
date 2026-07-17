import type { Metadata } from "next";
import { PublicFooter } from "../components/public-footer";
import { PublicNav } from "../components/public-nav";

export const metadata: Metadata = {
  title: "Product help · Brandrail",
  description: "Learn the Brandrail workflow, plans, roles, approvals, publishing safeguards and core product concepts.",
};

const HELP_LINKS = [
  { href: "#start", label: "Start" },
  { href: "#workflow", label: "Workflow" },
  { href: "#plans", label: "Plans" },
  { href: "#destinations", label: "Destinations" },
  { href: "#glossary", label: "Glossary" },
] as const;

const GLOSSARY = [
  ["BrandSpec", "The versioned rules extracted from a website: identity, type, colors, imagery, voice and composition constraints."],
  ["Saved look", "A reusable set of template and approved-image decisions. New briefs still receive fresh copy."],
  ["Template family", "A safe custom layout with immutable published versions and named editable content areas."],
  ["Campaign", "The objective, assets, approval trail, delivery and results for one coordinated body of work."],
  ["Review batch", "One or more exact rendered items waiting for a human decision. Approval does not publish automatically."],
  ["Content plan", "A dated four-week calendar. The preview is free; Studio can produce the next week automatically."],
  ["Agent run", "A durable job with its own ID, exact plan, progress, artifacts, review state and delivery history."],
  ["Plan preview", "The exact proposed steps, blockers and allowance impact. Creating it records the run, but production remains paused."],
  ["Plan approval", "A browser-only decision tied to one immutable plan hash. A changed or retried plan must be approved again."],
  ["Scoped agent key", "A revocable connection. New keys can observe, dry-plan and render; workflow and delivery are separate opt-ins."],
  ["Agent trust level", "A plain-language preset—Observe, Recommend, Produce drafts, Schedule approved, or Operate automatically—that expands into exact scopes you can inspect."],
  ["Decision inbox", "The prioritized list of approvals, stopped runs, delivery recovery, and expiring credentials that need a person."],
  ["Idempotency key", "A retry key that prevents a repeated delivery request from creating a duplicate calendar item."],
  ["Approval mode", "Review mode pauses for a person. Automatic mode is an explicit setting and requires connected channels."],
] as const;

export default function HelpPage() {
  return (
    <main className="min-h-screen">
      <PublicNav context="Product help" links={HELP_LINKS} ctaHref="/dashboard" ctaLabel="Open workspace" />
      <section className="relative overflow-hidden border-b border-hairline-soft py-14 md:py-20">
        <div className="surface-grid absolute inset-0 opacity-35" aria-hidden />
        <div className="relative mx-auto max-w-[980px] px-5 sm:px-6">
          <p className="eyebrow text-signal">START SIMPLE</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(40px,6vw,64px)] font-bold leading-none tracking-[-.04em]">From website to approved content.</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">Brandrail turns your existing brand into enforceable rules, creates channel-ready assets inside those rules and keeps a person in control of delivery.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[980px] px-5 py-14 sm:px-6 md:py-20">
        <section id="start" className="scroll-mt-24">
          <p className="eyebrow text-signal">YOUR FIRST FIVE MINUTES</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Create value before configuring operations.</h2>
          <ol className="mt-7 grid gap-px border border-hairline bg-hairline md:grid-cols-5">
            {[
              ["01", "Scan", "Enter your website. No account is required."],
              ["02", "Confirm", "Review the detected identity, imagery and voice."],
              ["03", "Create", "Give one brief and render the channel set."],
              ["04", "Save", "Verify one email to recover and download the work."],
              ["05", "Continue", "Plan four weeks, connect an agent or set up review."],
            ].map(([number, title, body]) => <li key={number} className="bg-panel p-4"><span className="font-mono text-[9px] text-signal">{number}</span><h3 className="mt-3 font-display text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></li>)}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3"><a href="/#try" className="btn">Scan my website →</a><a href="/sample" className="btn-ghost">Explore a complete sample</a><a href="/dashboard" className="btn-ghost">Open my workspace</a></div>
        </section>

        <section id="workflow" className="scroll-mt-24 pt-16">
          <p className="eyebrow text-signal">THE OPERATING LOOP</p>
          <h2 className="mt-3 font-display text-3xl font-bold">What happens after the first campaign.</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[
              ["Plan", "Preview a dated four-week content calendar without spending finished-asset allowance."],
              ["Produce", "Create the next week or a one-off campaign through the same active BrandSpec."],
              ["Review", "Approve, edit, regenerate or request changes on the exact rendered work."],
              ["Decide", "Use Inbox as the single list of approvals, agent pauses, recovery work, and credentials that need attention."],
              ["Deliver", "Download freely, or schedule approved work to connected channels with Studio."],
              ["Learn", "Use publishing results to guide later unlocked ideas without rewriting committed dates."],
              ["Audit", "Inspect who changed what, whether it succeeded and which agent credential was used."],
              ["Recover", "Open Activity for failed deliveries, overdue work, disconnected channels, expiring credentials and exhausted webhooks."],
            ].map(([title, body]) => <article key={title} className="panel p-5"><h3 className="font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{body}</p></article>)}
          </div>
          <div className="mt-5 border-l-2 border-green pl-4 text-sm leading-relaxed text-muted"><b className="text-bone">Publishing safeguard:</b> approval records a decision but does not silently publish. Agent delivery requires the approved review item, exact channel copy and files, planned time, and appropriate scope. Once scheduled, an agent must cancel and request a new approval to change it; owners can still publish manually in the workspace.</div>
        </section>

        <section id="plans" className="scroll-mt-24 pt-16">
          <p className="eyebrow text-signal">CAPABILITIES</p>
          <h2 className="mt-3 font-display text-3xl font-bold">What each plan unlocks.</h2>
          <div className="mt-7 overflow-x-auto border border-hairline">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-panel"><tr><th className="p-4">Capability</th><th className="p-4">Free</th><th className="p-4">Studio</th><th className="p-4">Agency</th></tr></thead>
              <tbody className="divide-y divide-hairline text-muted">
                {[
                  ["Active brands", "1", "3", "25"],
                  ["Agent keys", "1", "5", "25"],
                  ["Create, templates, saved looks", "Included", "Included", "Included"],
                  ["Four-week preview + CSV", "Included", "Included", "Included"],
                  ["Rolling weekly production", "—", "Included", "Included"],
                  ["Batch review + publishing", "—", "Included", "Included"],
                  ["Campaign analytics", "—", "Included", "Included"],
                  ["Reviewer seats + reports", "—", "—", "Included"],
                ].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`p-4 ${index === 0 ? "text-bone" : "font-mono text-xs"}`}>{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">Locked destinations remain visible in the workspace so you can understand the complete workflow. They explain the required plan before any checkout begins.</p>
        </section>

        <section id="destinations" className="scroll-mt-24 pt-16">
          <p className="eyebrow text-signal">PUBLISHING DESTINATIONS</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Know what will be sent before connecting.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Availability depends on whether the deployment has approved provider credentials. The workspace connection screen shows the live status for each destination.</p>
          <div className="mt-7 overflow-x-auto border border-hairline">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-panel"><tr><th className="p-4">Destination</th><th className="p-4">Authentication</th><th className="p-4">Creative shape</th><th className="p-4">Connection requirement</th></tr></thead>
              <tbody className="divide-y divide-hairline text-muted">
                {[
                  ["Bluesky", "App password", "Text + one graphic", "User credential"],
                  ["Mastodon", "Access token", "Text + one graphic", "User credential + instance"],
                  ["LinkedIn", "OAuth", "Post + LinkedIn image", "Approved app keys"],
                  ["Facebook", "OAuth", "Post + open-graph image", "Approved app keys"],
                  ["Instagram", "OAuth", "Caption + carousel", "Approved app keys"],
                  ["X", "OAuth", "Post + X graphic", "Approved app keys"],
                  ["TikTok", "OAuth", "Caption + vertical story", "Approved app keys"],
                ].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`p-4 ${index === 0 ? "text-bone" : "font-mono text-xs"}`}>{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">A configured connection still does not bypass review, schedule, idempotency, credential-health, or provider-response checks.</p>
        </section>

        <section id="glossary" className="scroll-mt-24 pt-16">
          <p className="eyebrow text-signal">PLAIN LANGUAGE</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Product glossary.</h2>
          <dl className="mt-7 divide-y divide-hairline border-y border-hairline">
            {GLOSSARY.map(([term, meaning]) => <div key={term} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr]"><dt className="font-display font-bold">{term}</dt><dd className="text-sm leading-relaxed text-muted">{meaning}</dd></div>)}
          </dl>
        </section>

        <section className="mt-16 border border-signal/50 bg-panel p-6">
          <h2 className="font-display text-xl font-bold">Something looks missing?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">If a workspace area says information is unavailable, refresh before assuming it is empty. Brandrail keeps service errors separate from true empty states.</p>
          <div className="mt-4 flex flex-wrap gap-3"><a href="/dashboard" className="btn">Return to workspace →</a><a href="/docs" className="btn-ghost">Developer documentation</a></div>
        </section>
      </div>
      <PublicFooter note="Human workflow help · plans · roles · safety · glossary" />
    </main>
  );
}
