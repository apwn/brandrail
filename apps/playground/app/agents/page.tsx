import type { Metadata } from "next";
import Image from "next/image";
import { McpSetupGuide } from "../components/mcp-setup-guide";
import { PublicFooter } from "../components/public-footer";
import { PublicNav } from "../components/public-nav";
import { MCP_TOOL_COUNT } from "@/lib/mcp-meta";

const AGENT_NAV_LINKS = [
  { href: "#connect", label: "Quickstart" },
  { href: "#tools", label: "Tools" },
  { href: "#safety", label: "Safety" },
  { href: "/docs", label: "Docs" },
] as const;

const AGENT_MOBILE_LINK = { href: "/docs", label: "Docs" } as const;

export const metadata: Metadata = {
  title: "Connect your AI agent · Brandrail",
  description: "Give OpenClaw, Claude or any compatible MCP client a brand-safe rail for ongoing content planning, rendering, approval, publishing, analytics, and audit.",
  alternates: { canonical: "/agents" },
  openGraph: {
    title: "Your agent can write. Now it can operate safely.",
    description: `${MCP_TOOL_COUNT} lifecycle tools, durable runs, visible assets, scoped authority, and human approval before publishing.`,
    url: "/agents",
    images: [{ url: "/og-agent.png", width: 1731, height: 909, alt: "Brandrail agent execution rail" }],
  },
};

const TOOL_GROUPS = [
  ["UNDERSTAND", "list_brands · compile_brand · get_brand · diff_brand_spec"],
  ["SAVED LOOKS", "list_recipes · save_recipe · rename_recipe · delete_recipe"],
  ["TEMPLATES", "list_templates · list_template_families · list_template_family_versions · duplicate_template_family · preflight_template_family · publish_template_family · archive_template_family"],
  ["PLAN & PROGRAM", "plan_campaign · list_content_programs · preview_content_program · create_content_program · run_content_program · pause_content_program · delete_content_program"],
  ["RUN", "start_campaign_run · list_agent_runs · get_agent_run · complete_agent_run · retry_agent_run · cancel_agent_run"],
  ["CREATE", "render_assets · list_renders · get_render"],
  ["CAMPAIGNS", "list_campaigns · create_campaign · update_campaign"],
  ["REVIEW", "create_review_batch · get_review_status · add_review_comment"],
  ["OPERATE", "list_channels · schedule_post · cancel_post · list_calendar"],
  ["LEARN", "get_analytics · get_usage · get_audit_log"],
] as const;

export default function AgentsPage() {
  return (
    <main>
      <AgentNav />
      <AgentHero />
      <CompatibilityBar />
      <ConnectionSection />
      <ToolSection />
      <SafetySection />
      <AgentCta />
      <AgentFooter />
    </main>
  );
}

function AgentNav() {
  return (
    <PublicNav
      context="Agent platform"
      links={AGENT_NAV_LINKS}
      ctaLabel="Connect your agent"
      mobileLink={AGENT_MOBILE_LINK}
    />
  );
}

function AgentHero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline-soft py-12 md:py-16">
      <div className="surface-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-14">
        <div className="min-w-0">
          <p className="eyebrow text-signal">THE SAFE EXECUTION RAIL FOR BRANDED CONTENT</p>
          <h1 className="mt-4 max-w-[620px] font-display text-[clamp(42px,5.7vw,66px)] font-bold leading-[.98] tracking-[-.045em]">
            Your agent can write.<br /><span className="text-signal">Now it can operate.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted">
            Give OpenClaw, Claude, or any compatible MCP client the ability to plan four weeks, produce each week, route approval, publish and learn—without letting it break the brand or bypass your judgment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn min-h-12" href="/login?agent=1">Connect your agent free →</a>
            <a className="btn-ghost min-h-12" href="#connect">View the 2-minute setup ↓</a>
          </div>
          <p className="mt-4 font-mono text-[10px] text-muted sm:text-[11px]">1 free minimal key · read, plan &amp; render by default · {MCP_TOOL_COUNT} tools across plans</p>
        </div>
        <AgentRunProof />
      </div>
    </section>
  );
}

function AgentRunProof() {
  const steps = [
    ["01", "BrandSpec loaded", "northstar@12", "done"],
    ["02", "Execution plan", "0 blockers", "done"],
    ["03", "Plan approval", "hash locked", "done"],
    ["04", "Assets rendered", "8 · 0 violations", "done"],
    ["05", "Human review", "paused", "wait"],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[620px]">
      <div className="border border-hairline bg-panel shadow-[12px_12px_0_#0A0A0B,12px_12px_0_1px_#2E2E32]">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3 font-mono text-[10px] text-muted">
          <span>AGENT / CAMPAIGN RUN</span><span className="text-green">● CONTROLLED</span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="font-mono text-[11px] leading-relaxed text-bone"><span className="text-signal">you ›</span> Keep the next four weeks full. Produce three posts a week and get my approval before scheduling.</p>
          <div className="mt-4 border border-hairline">
            {steps.map(([number, label, status, state]) => (
              <div key={number} className="grid grid-cols-[28px_1fr_auto] gap-2 border-b border-hairline-soft px-3 py-2.5 font-mono text-[9px] last:border-b-0 sm:text-[10px]">
                <span className="text-muted">{number}</span><span>{label}</span><span className={state === "done" ? "text-green" : "text-signal"}>{state === "done" ? "✓ " : "◷ "}{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-hairline bg-hairline">
          <ProofAsset src="/proof/carousel.png" alt="Rendered Instagram carousel" label="IG CAROUSEL" width={1080} height={1350} />
          <ProofAsset src="/proof/og-image.png" alt="Rendered Open Graph graphic" label="LINK PREVIEW" width={1200} height={630} />
        </div>
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3 font-mono text-[9px] text-muted">
          <span className="text-green">✓ OUTPUT RETURNED</span><span className="text-signal">PUBLISHING PAUSED</span>
        </div>
      </div>
    </div>
  );
}

function ProofAsset({ src, alt, label, width, height }: { src: string; alt: string; label: string; width: number; height: number }) {
  return (
    <figure className="relative overflow-hidden bg-[#F4F2EE] p-2">
      <Image src={src} alt={alt} width={width} height={height} className="aspect-[16/7] w-full border border-[#C9C4BA] object-cover object-center" sizes="(max-width: 1024px) 45vw, 270px" />
      <figcaption className="mt-1.5 font-mono text-[8px] text-ink">{label}</figcaption>
    </figure>
  );
}

function CompatibilityBar() {
  return (
    <section className="border-b border-hairline bg-panel" aria-label="Compatible agent clients">
      <div className="mx-auto grid max-w-[1180px] sm:grid-cols-3">
        {[
          ["01", "OpenClaw", "REMOTE MCP"],
          ["02", "Claude", "REMOTE + LOCAL"],
          ["03", "Compatible clients", "STREAMABLE HTTP"],
        ].map(([number, client, transport]) => (
          <div key={client} className="flex items-center gap-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
            <span className="font-mono text-[10px] text-signal">{number}</span>
            <strong className="font-display text-sm">{client}</strong>
            <span className="ml-auto font-mono text-[8px] text-green">● {transport}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConnectionSection() {
  return (
    <section id="connect" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
        <div className="min-w-0">
          <p className="eyebrow text-signal">ONE REMOTE CONNECTION</p>
          <h2 className="mt-3 font-display text-[clamp(32px,4vw,46px)] font-bold leading-[1.05] tracking-[-.035em]">Connect in under two minutes.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted">Mint one expiring, workspace-scoped credential and add the hosted endpoint to your client. The agent can discover Brandrail immediately; your permissions decide what it may change.</p>
          <ol className="mt-7 border-y border-hairline-soft">
            {[
              ["01", "Mint a scoped key", "Open Workspace → Agent connection after verifying your email."],
              ["02", "Add the MCP endpoint", "Paste the configuration into a supported client."],
              ["03", "Ask for the outcome", "Start with: “Plan the next four weeks, three posts a week. Show me the plan before producing.”"],
            ].map(([number, title, body]) => (
              <li key={number} className="grid grid-cols-[30px_1fr] gap-3 border-b border-hairline-soft py-4 last:border-b-0">
                <span className="font-mono text-[10px] text-signal">{number}</span>
                <div><strong className="font-display text-sm">{title}</strong><p className="mt-1 text-sm leading-relaxed text-muted">{body}</p></div>
              </li>
            ))}
          </ol>
          <a href="/login?agent=1" className="mt-6 inline-flex text-sm font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">Create the free agent key →</a>
        </div>
        <div className="min-w-0">
          <McpSetupGuide endpoint="https://playground.brandrail.dev/api/mcp" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] text-muted">
            <span>EXPIRING KEY · WORKSPACE SCOPED · REVOCABLE</span>
            <a href="/docs#mcp" className="text-signal hover:text-bone">OPEN MCP DOCS →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolSection() {
  return (
    <section id="tools" className="scroll-mt-20 border-b border-hairline-soft bg-panel py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="eyebrow text-signal">THE FULL LOOP</p><h2 className="mt-3 font-display text-[clamp(32px,4vw,46px)] font-bold leading-tight">Tools organized around outcomes, not endpoints.</h2><p className="mt-3 max-w-2xl text-muted">{MCP_TOOL_COUNT} focused tools cover the lifecycle from observed brand to measured campaign. Rendering can stay on agent-directed auto, or use a selected visual template with named dynamic fields while brand objects remain locked.</p></div>
          <a href="/docs" className="font-mono text-[10px] text-signal hover:text-bone">READ THE REFERENCE →</a>
        </div>
        <div className="mt-8 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {TOOL_GROUPS.map(([phase, tools]) => <article key={phase} className="bg-ink p-5"><span className="font-mono text-[10px] text-signal">{phase}</span><p className="mt-3 font-mono text-xs leading-relaxed text-muted">{tools}</p></article>)}
        </div>
        <div className="mt-6 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
          {[
            ["1 · PREVIEW", "The agent plans the whole horizon without rendering or spending asset allowance."],
            ["2 · PRODUCE", "Brandrail renders only the next week so content stays current and coherent."],
            ["3 · CONTROL", "Review is the default. Auto mode must be explicit and have connected channels."],
          ].map(([title, body]) => <div key={title} className="bg-panel p-4"><span className="font-mono text-[9px] text-green">{title}</span><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></div>)}
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section id="safety" className="scroll-mt-20 border-b border-[#C9C4BA] bg-bone py-16 text-ink md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <p className="eyebrow !text-[#A83200]">AUTHORITY YOU CAN INSPECT</p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(32px,4vw,46px)] font-bold leading-tight">Autonomy for the reversible work. A human gate for the rest.</h2>
        <div className="mt-9 grid gap-8 md:grid-cols-3">
          {[
            ["Brand-locked", "The agent cannot improvise fonts, colors, logos or composition outside the active BrandSpec."],
            ["Human-controlled", "Plan approval happens in the workspace. Agent delivery requires the exact reviewed copy and files, planned time, and right scope; changes require a new approval."],
            ["Reconnect-safe", "Runs and outputs survive disconnects. Every PNG stays retrievable and every mutation remains auditable."],
          ].map(([title, body]) => <article key={title} className="border-t-2 border-[#A83200] pt-5"><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#514D47]">{body}</p></article>)}
        </div>
      </div>
    </section>
  );
}

function AgentCta() {
  return (
    <section className="relative overflow-hidden py-20 text-center md:py-24">
      <div className="surface-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-5 sm:px-6">
        <p className="eyebrow text-signal">START WITH THE AGENT YOU ALREADY USE</p>
        <h2 className="mt-4 font-display text-[clamp(36px,5vw,54px)] font-bold leading-tight">Give it the outcome. Keep the final say.</h2>
        <p className="mt-4 text-muted">Preview one or four weeks through MCP. Studio activates the rolling program; review remains the default.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><a href="/login?agent=1" className="btn">Connect free →</a><a href="/docs#quickstart" className="btn-ghost">Read the quickstart</a><a href="https://github.com/apwn/brandrail/tree/main/skills/brandrail" className="btn-ghost">Install the skill</a></div>
      </div>
    </section>
  );
}

function AgentFooter() {
  return <PublicFooter note={`${MCP_TOOL_COUNT} lifecycle tools · hosted MCP · human-controlled publishing`} />;
}
