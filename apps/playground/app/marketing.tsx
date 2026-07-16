"use client";

import { PublicFooter } from "./components/public-footer";
import { PublicNav } from "./components/public-nav";
import { MCP_TOOL_COUNT } from "@/lib/mcp-meta";

const LANDING_NAV_LINKS = [
  { href: "/agents", label: "For agents" },
  { href: "#agent-workflow", label: "How it works" },
  { href: "#examples", label: "Output" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

const LANDING_MOBILE_LINK = { href: "/agents", label: "Agents" } as const;

type LandingProps = {
  url: string;
  setUrl: (value: string) => void;
  onSubmit: () => void;
  error: string | null;
};

export function MarketingLanding({ url, setUrl, onSubmit, error }: LandingProps) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Announcement />
      <Nav />
      <Hero />
      <CompileBar url={url} setUrl={setUrl} onSubmit={onSubmit} error={error} />
      <AudiencePaths />
      <main>
        <AgentWorkflowSection />
        <OutputSection />
        <MechanismSection />
        <UseCasesSection />
        <ComparisonSection />
        <PricingSection />
        <FaqSection />
      </main>
      <FinalCta url={url} setUrl={setUrl} onSubmit={onSubmit} />
      <Footer />
    </div>
  );
}

function Announcement() {
  return (
    <div className="border-b border-hairline bg-panel px-4 py-2 text-center font-mono text-[11px] text-muted sm:text-xs">
      <span className="text-bone">NEW · Hosted MCP.</span><span className="hidden sm:inline"> One free, scoped agent connection with durable runs and human approval built in.</span>{" "}
      <a className="text-signal underline decoration-signal/50 underline-offset-4 hover:text-bone" href="/agents">
        Connect free →
      </a>
    </div>
  );
}

function Nav() {
  return (
    <PublicNav
      links={LANDING_NAV_LINKS}
      mobileLink={LANDING_MOBILE_LINK}
    />
  );
}

function Hero() {
  return (
    <header id="top" className="relative overflow-hidden border-b border-hairline-soft py-10 sm:py-12 md:py-14">
      <div className="surface-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-9 px-5 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-12 xl:gap-16">
        <div>
          <div className="mb-5 flex w-fit items-center gap-2 border border-hairline bg-panel px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px]">
            <span className="h-2 w-2 bg-signal" aria-hidden />
            Agent-native content operations
          </div>
          <h1 className="max-w-[690px] font-display text-[clamp(40px,5.4vw,64px)] font-bold leading-[0.98] tracking-[-0.045em]">
            Your agent can write.<br /><span className="text-signal">Brandrail makes it publish on-brand.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-muted sm:text-[17px]">
            Connect the agent you already use to a brand system it cannot break. One brief becomes planned, rendered, reviewed and scheduled content—with your approval required before anything goes live.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/login?agent=1" className="btn min-h-12">Connect your agent free →</a>
            <a href="#agent-workflow" className="btn-ghost min-h-12">See it run ↓</a>
          </div>
          <div className="mt-5 flex max-w-[620px] flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline-soft pt-4 font-mono text-[10px] text-muted sm:text-[11px]">
            <span><b className="font-medium text-green">Free</b> · 1 connection · 50 assets · no card</span>
            <span>Hosted MCP · CLI · API</span>
          </div>
        </div>
        <HeroBoard />
      </div>
    </header>
  );
}

function CompileBar({ url, setUrl, onSubmit, error }: LandingProps) {
  return (
    <section className="border-b border-hairline bg-panel" aria-labelledby="compile-proof-title">
      <div className="mx-auto grid max-w-[1180px] gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
        <div>
          <p className="eyebrow text-signal">Prove it with your real website</p>
          <h2 id="compile-proof-title" className="mt-1 font-display text-lg font-bold">URL in. Brand system out.</h2>
        </div>
        <div>
          <UrlBox id="hero-client-url" url={url} setUrl={setUrl} onSubmit={onSubmit} />
          {error && <p className="mt-3 border-l-2 border-signal pl-3 font-mono text-xs text-signal" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}

function UrlBox({ id, url, setUrl, onSubmit }: Omit<LandingProps, "error"> & { id: string }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) onSubmit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col border border-hairline bg-panel focus-within:border-signal sm:flex-row">
      <label htmlFor={id} className="sr-only">Website URL</label>
      <input
        id={id}
        type="url"
        inputMode="url"
        required
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://yourbrand.com"
        className="min-w-0 flex-1 border-0 bg-transparent px-4 py-4 font-mono text-sm text-bone outline-none placeholder:text-muted/60"
      />
      <button type="submit" className="btn min-h-14 !rounded-none border-t border-signal !px-5 sm:border-l sm:border-t-0">
        Compile my brand free →
      </button>
    </form>
  );
}

function HeroBoard() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] xl:mx-0">
      <div className="absolute -left-4 top-10 hidden h-[calc(100%-5rem)] w-px bg-signal/50 sm:block" aria-hidden />
      <div className="border border-hairline bg-panel shadow-[16px_16px_0_#0A0A0B,16px_16px_0_1px_#2E2E32]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 font-mono text-[11px] text-muted">
          <span>CLAUDE / NORTHSTAR CAMPAIGN</span>
          <span className="text-green">● AGENT CONNECTED</span>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-mono text-[12px] leading-relaxed text-bone"><span className="text-signal">you ›</span> Turn the launch brief into five posts. Keep the brand strict and get my approval before scheduling.</p>
          <div className="mt-6 space-y-0 border border-hairline">
            {[["01", "BrandSpec loaded", "northstar@12", "done"], ["02", "Execution plan", "0 blockers", "done"], ["03", "Assets rendered", "5 · 0 violations", "done"], ["04", "Human approval", "waiting", "wait"], ["05", "Schedule + measure", "paused", "wait"]].map(([number, label, meta, state]) => <div key={number} className="grid grid-cols-[30px_1fr_auto] gap-2 border-b border-hairline-soft px-3 py-3 last:border-b-0 font-mono text-[10px]"><span className="text-muted">{number}</span><span className="text-bone">{label}</span><span className={state === "done" ? "text-green" : "text-signal"}>{state === "done" ? `✓ ${meta}` : `◷ ${meta}`}</span></div>)}
          </div>
          <p className="mt-4 border-l-2 border-signal pl-3 font-mono text-[10px] leading-relaxed text-muted">The agent may plan and render. Publishing requires an approved item or explicit confirmation.</p>
        </div>
        <div className="grid grid-cols-3 border-t border-hairline text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          <span className="border-r border-hairline py-3 text-green">Brand locked</span>
          <span className="border-r border-hairline py-3">Audit logged</span>
          <span className="py-3 text-signal">Human decides</span>
        </div>
      </div>
    </div>
  );
}

function AgentWorkflowSection() {
  const stages = [
    ["01", "CONNECT", "One hosted MCP endpoint gives the agent workspace-scoped tools. Free includes one connection."],
    ["02", "CONSTRAIN", "The agent loads a portable BrandSpec before it plans or renders. Violations fail closed."],
    ["03", "EXECUTE", "A dry-run exposes blockers and mutations. Rendering creates assets; it does not publish them."],
    ["04", "APPROVE", "The run pauses in a real review state. Comments and flags stay attached to the exact asset."],
    ["05", "PUBLISH", "Only approved work—or an explicitly confirmed action—can enter the calendar."],
    ["06", "LEARN", "Performance returns to the next plan. Every mutation remains visible in the audit rail."],
  ];
  return (
    <section id="agent-workflow" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="Agent-native by design" title={<>One prompt can run the campaign.<br />It still cannot bypass your judgment.</>} body="Brandrail is not a chatbot glued onto a scheduler. The agent is the operator; BrandSpec constraints, approval state, execution plans and the audit trail are the control system." />
        <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">{stages.map(([number, title, body]) => <article key={number} className="bg-ink p-5 sm:p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs text-signal">{number}</span><span className="h-2 w-2 bg-green" /></div><h3 className="mt-6 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{body}</p></article>)}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-signal/40 bg-panel p-5"><div><p className="font-display text-lg font-bold">Already use an MCP-enabled agent?</p><p className="mt-1 text-sm text-muted">Connect it in one minute, then ask it to list your brands.</p></div><a href="/login?agent=1" className="btn">Connect free →</a></div>
      </div>
    </section>
  );
}

function AudiencePaths() {
  const paths = [
    ["01", "CONNECT YOUR AGENT", "Agent operators", "Give the AI you already use a complete, approval-aware content operating system.", "/agents", "See the agent platform"],
    ["02", "ONE BRAND", "Creators & founders", "Run a recognizable weekly content system without adding a content team.", "#one-brand", "See the solo workflow"],
    ["03", "MANY BRANDS", "Agencies & teams", "Move every client through one controlled rail without flattening their identity.", "#many-brands", "See the agency workflow"],
  ];
  return (
    <section className="border-b border-hairline bg-panel" aria-label="Choose your path">
      <div className="mx-auto grid max-w-[1180px] md:grid-cols-3">
        {paths.map(([number, eyebrow, title, body, href, cta]) => (
          <a key={number} href={href} className="group relative border-b border-hairline px-5 py-7 transition-colors hover:bg-ink md:border-b-0 md:border-r md:last:border-r-0 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-xs text-signal">{number}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{eyebrow}</span>
            </div>
            <h2 className="mt-7 font-display text-xl font-bold">{title}</h2>
            <p className="mt-2 min-h-[3.6rem] text-sm leading-relaxed text-muted">{body}</p>
            <span className="mt-5 inline-flex text-sm font-semibold text-bone group-hover:text-signal">{cta} →</span>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-signal transition-all duration-300 group-hover:w-full" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, body, light = false }: { eyebrow: string; title: React.ReactNode; body?: React.ReactNode; light?: boolean }) {
  return (
    <div className="mb-12 max-w-[760px]">
      <span className={`eyebrow ${light ? "!text-[#A83200]" : "text-signal"}`}>{eyebrow}</span>
      <h2 className="mt-3.5 font-display text-[clamp(32px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em]">{title}</h2>
      {body && <p className={`mt-4 max-w-[680px] text-[17px] leading-relaxed ${light ? "text-[#514D47]" : "text-muted"}`}>{body}</p>}
    </div>
  );
}

function OutputSection() {
  const carousel = [
    "/proof/carousel.png",
    "/proof/carousel-2.png",
    "/proof/carousel-3.png",
    "/proof/carousel-4.png",
  ];
  const checks = [
    ["01", "INPUT", "1 campaign brief"],
    ["02", "SYSTEM", "Acme BrandSpec · v3"],
    ["03", "OUTPUT", "6 finished canvases"],
    ["04", "GATE", "0 rule violations"],
  ];
  return (
    <section id="examples" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-16 text-ink md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead
          light
          eyebrow="Output from the engine"
          title={<>Not a mockup. Not a prompt lottery.<br />Finished assets from one brand system.</>}
          body="These examples were rendered by the same engine behind the URL demo. Typography, palette, spacing and format rules are pulled from one BrandSpec and checked before the asset is returned."
        />
        <div className="border border-[#BEB8AD] bg-[#E9E4DA] shadow-[9px_9px_0_#D0CABF]">
          <div className="grid border-b border-[#BEB8AD] sm:grid-cols-2 lg:grid-cols-4">
            {checks.map(([number, label, value], index) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${index < checks.length - 1 ? "border-b border-[#CFC9BE] lg:border-b-0 lg:border-r" : ""} ${index === 2 ? "sm:border-b-0" : ""} ${index === 0 || index === 2 ? "sm:border-r" : ""}`}>
                <span className="font-mono text-[10px] text-[#A83200]">{number}</span>
                <div>
                  <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#777168]">{label}</span>
                  <b className="block font-display text-[12px] font-semibold">{value}</b>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-px bg-[#BEB8AD] lg:grid-cols-[1.38fr_1fr]">
            <figure className="bg-[#F6F3ED] p-3 sm:p-4">
              <figcaption className="mb-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em]">
                <span>Instagram carousel · 1080×1350</span>
                <span className="text-[#A83200]">01—04</span>
              </figcaption>
              <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2 sm:grid-cols-[minmax(0,1fr)_138px] sm:gap-3">
                <div className="overflow-hidden border border-[#CFC9BE] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={carousel[0]} alt="Opening slide from an Instagram carousel generated by Brandrail" loading="lazy" decoding="async" className="aspect-[4/5] h-full w-full object-cover" />
                </div>
                <div className="grid gap-2 sm:gap-3">
                  {carousel.slice(1).map((src, index) => (
                    <div key={src} className="relative overflow-hidden border border-[#CFC9BE] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Generated carousel slide ${index + 2} of 4`} loading="lazy" decoding="async" className="aspect-[4/5] h-full w-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 bg-ink px-1.5 py-0.5 font-mono text-[8px] text-bone">0{index + 2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </figure>

            <div className="grid gap-px bg-[#BEB8AD] sm:grid-cols-2 lg:grid-cols-1">
              {[
                { src: "/proof/og-image.png", label: "Link preview", detail: "Open Graph · 1200×630", number: "05" },
                { src: "/proof/x-graphic.png", label: "Social graphic", detail: "Landscape · 1600×900", number: "06" },
              ].map((output) => (
                <figure key={output.src} className="bg-[#F6F3ED] p-3 sm:p-4">
                  <figcaption className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <b className="block font-display text-[13px]">{output.label}</b>
                      <span className="font-mono text-[9px] text-[#6A655D]">{output.detail}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#A83200]">{output.number}</span>
                  </figcaption>
                  <div className="overflow-hidden border border-[#CFC9BE] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={output.src} alt={`${output.label} generated by Brandrail`} loading="lazy" decoding="async" className="aspect-[40/21] w-full object-cover" />
                  </div>
                </figure>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#BEB8AD] bg-[#F6F3ED] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[760px] text-sm leading-relaxed text-[#514D47]">
              One approved direction, adapted—not stretched—across the feed. Every canvas above is a production render from the same brief and BrandSpec.
            </p>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.13em] text-[#247A4A]">✓ pre-raster gate passed</span>
          </div>
        </div>
        <p className="mt-6 max-w-[760px] text-sm leading-relaxed text-[#5A554E]">
          Product evidence, not a stock gallery. Named customer stories will be added as the first public pilots complete; until then, the page labels generated proof as generated proof.
        </p>

        <div className="mt-16 border-t border-[#C9C4BA] pt-12">
          <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div>
              <span className="eyebrow !text-[#A83200]">Not one house style</span>
              <h3 className="mt-3 font-display text-[clamp(28px,3vw,38px)] font-bold leading-[1.08] tracking-[-0.035em]">The renderer should disappear behind the brand.</h3>
            </div>
            <p className="max-w-[650px] text-[16px] leading-relaxed text-[#514D47] lg:justify-self-end">
              Same engine. Same landscape format. Three fictional BrandSpecs with different palette, typography, casing, alignment and composition rules—rendered without hand-styling the final canvases.
            </p>
          </div>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0" aria-label="Brand range examples">
            {[
              { src: "/proof/range-fieldnote.png", name: "Fieldnote", mode: "Quiet editorial", detail: "Inter · warm neutral · left" },
              { src: "/proof/range-relay.png", name: "RELAY/OPS", mode: "Operational", detail: "Space Grotesk · dark · upper" },
              { src: "/proof/range-morrow.png", name: "Morrow Studio", mode: "Studio principle", detail: "Mixed type · lavender · center" },
            ].map((brand, index) => (
              <figure key={brand.src} className="min-w-[82%] snap-start border border-[#C9C4BA] bg-[#F6F3ED] p-2.5 shadow-[4px_4px_0_#D8D3C9] md:min-w-0">
                <div className="overflow-hidden border border-[#D8D3C9] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brand.src} alt={`${brand.name} fictional BrandSpec proof render`} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                </div>
                <figcaption className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
                  <div>
                    <b className="block font-display text-[13px]">{brand.name}</b>
                    <span className="block text-[11px] text-[#5A554E]">{brand.mode}</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#777168]">{brand.detail}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#A83200]">B{index + 1}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#777168]">Synthetic proof brands · production renderer · no customer claims</p>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-20 border-b border-hairline-soft bg-panel py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="Built to scale with you" title="One brand today. Twenty-five tomorrow. Same rail." body="Start with the job you have now. Brandrail keeps the workflow simple for a solo operator and adds review, workspaces and automation when the workload grows." />
        <div className="grid gap-px overflow-hidden border border-hairline bg-hairline lg:grid-cols-2">
          <article id="one-brand" className="scroll-mt-24 bg-ink p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="eyebrow text-signal">One brand</span>
              <span className="font-mono text-[10px] text-muted">CREATOR · FOUNDER · MARKETER</span>
            </div>
            <h3 className="mt-7 max-w-[430px] font-display text-3xl font-bold leading-tight">Show up every week without looking like a different company every day.</h3>
            <p className="mt-4 max-w-[500px] text-[15px] leading-relaxed text-muted">Bring the idea; Brandrail carries your typography, palette, voice and layout across every format. Review one coherent content set instead of rebuilding every size from scratch.</p>
            <div className="mt-8 grid grid-cols-3 border border-hairline text-center">
              <div className="border-r border-hairline p-4"><strong className="font-display text-2xl text-signal">1</strong><span className="mt-1 block font-mono text-[9px] uppercase text-muted">brief</span></div>
              <div className="border-r border-hairline p-4"><strong className="font-display text-2xl text-signal">5</strong><span className="mt-1 block font-mono text-[9px] uppercase text-muted">formats</span></div>
              <div className="p-4"><strong className="font-display text-2xl text-signal">0</strong><span className="mt-1 block font-mono text-[9px] uppercase text-muted">blank canvases</span></div>
            </div>
            <a href="#pricing" className="mt-7 inline-flex text-sm font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">Start with the free plan →</a>
          </article>
          <article id="many-brands" className="scroll-mt-24 bg-ink p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="eyebrow text-signal">Many brands</span>
              <span className="font-mono text-[10px] text-muted">AGENCY · FREELANCER · TEAM</span>
            </div>
            <h3 className="mt-7 max-w-[440px] font-display text-3xl font-bold leading-tight">Protect your creative judgment—and the margin around it.</h3>
            <p className="mt-4 max-w-[500px] text-[15px] leading-relaxed text-muted">Compile each client once. Then let one queue handle the resizing, rule checks and approvals while every account stays visibly its own.</p>
            <div className="mt-8 overflow-hidden border border-hairline">
              {[["NORTHSTAR", "CAROUSEL", "approved"], ["SLOW SUNDAY", "STATIC", "review"], ["BOLT", "STORY", "approved"]].map(([brand, format, status]) => (
                <div key={brand} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-hairline-soft px-3 py-3 last:border-b-0">
                  <span className="font-mono text-[10px] text-bone">{brand}</span>
                  <span className="font-mono text-[9px] text-muted">{format}</span>
                  <span className={`font-mono text-[9px] uppercase ${status === "approved" ? "text-green" : "text-signal"}`}>{status === "approved" ? "✓ approved" : "review"}</span>
                </div>
              ))}
            </div>
            <a href="#pricing" className="mt-7 inline-flex text-sm font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">Compare team plans →</a>
          </article>
        </div>
        <a href="/agents" className="group mt-px grid gap-6 border border-hairline bg-ink p-6 transition-colors hover:border-signal sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="eyebrow text-green">Build with Brandrail</span>
            <h3 className="mt-3 font-display text-2xl font-bold">Give any agent a brand system it cannot ignore.</h3>
            <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-muted">Compile websites to portable specs, render through the API, and wire the production rail into your product with MCP, CLI or SDK.</p>
          </div>
          <span className="font-mono text-sm text-signal group-hover:text-bone">API · MCP · CLI →</span>
        </a>
      </div>
    </section>
  );
}

function MechanismSection() {
  const rules = [
    ["Identity", "Fonts, color roles, logo use and clearspace"],
    ["Composition", "Grid, density, whitespace and hierarchy"],
    ["Imagery", "Photo direction, crop behavior and AI fences"],
    ["Voice", "Tone, banned phrases, emoji and CTA limits"],
  ];
  return (
    <section className="border-b border-hairline-soft py-16 md:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow text-signal">The proprietary mechanism</span>
          <h2 className="mt-3.5 font-display text-[clamp(32px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em]">A brand system the machine must obey.</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">Generic AI receives suggestions. Brandrail receives constraints. If an asset breaks a defined rule, the renderer returns a violation instead of silently shipping the mistake.</p>
          <div className="mt-7 divide-y divide-hairline-soft border-y border-hairline-soft">
            {rules.map(([title, body]) => (
              <div key={title} className="grid gap-1 py-3.5 sm:grid-cols-[120px_1fr] sm:gap-4">
                <b className="font-display text-sm">{title}</b>
                <span className="text-sm text-muted">{body}</span>
              </div>
            ))}
          </div>
        </div>
        <BrandSpecCard />
      </div>
    </section>
  );
}

function BrandSpecCard() {
  return (
    <div className="border border-hairline bg-panel font-mono text-[12px] leading-[1.8] text-muted shadow-[12px_12px_0_#0A0A0B,12px_12px_0_1px_#2E2E32]">
      <div className="flex justify-between border-b border-hairline px-5 py-3 text-[10px] uppercase tracking-[0.12em]">
        <span>northstar.brandspec.json</span><span className="text-green">valid · v12</span>
      </div>
      <pre className="overflow-x-auto p-5"><span className="text-bone">{"{"}</span>{`\n  `}<span className="text-signal">&quot;identity&quot;</span>: <span className="text-bone">{"{"}</span>{`\n    "signal": "#FF4D00",\n    "display": "Space Grotesk/700",\n    "logo.distort": false\n  },\n  `}<span className="text-signal">&quot;composition&quot;</span>: <span className="text-bone">{"{"}</span>{`\n    "grid": "12col/8px",\n    "density": "max 3/zone"\n  },\n  `}<span className="text-signal">&quot;voice&quot;</span>: <span className="text-bone">{"{"}</span>{`\n    "emojiMax": 1,\n    "banned": ["synergy", "game-changing"]\n  }\n`}<span className="text-bone">{"}"}</span></pre>
      <div className="border-t border-hairline px-5 py-3 text-[10px] text-green">✓ portable · diffable · exportable · enforced</div>
    </div>
  );
}

function ComparisonSection() {
  const rows = [
    ["Compiles a brand system from a URL", "—", "—", "✓"],
    ["Enforces type, palette and layout", "Manual", "Template only", "✓"],
    ["Agent operates the full lifecycle", "—", "Partial actions", `${MCP_TOOL_COUNT} MCP tools + resources`],
    ["Resumable human approval", "Manual", "Basic approval", "Stateful + safe"],
    ["Dry-run + mutation audit trail", "—", "—", "✓"],
    ["Calendar, publishing + feedback", "—", "Distribution", "Closed loop"],
  ];
  return (
    <section id="comparison" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="Where Brandrail fits" title="Schedulers give agents accounts. Brandrail gives agents a brand they cannot break." body="Keep the tools you already like. Brandrail adds the missing operating layer: machine-readable brand constraints, deterministic assets, resumable approval, publishing and feedback." />
        <div className="overflow-x-auto border border-hairline">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-panel font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <tr><th className="p-4 font-normal">Capability</th><th className="p-4 font-normal">Canva / Figma</th><th className="p-4 font-normal">Schedulers</th><th className="border-l border-signal p-4 font-normal text-signal">Brandrail</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-hairline-soft">
                  <th className="p-4 font-display font-medium">{row[0]}</th>
                  <td className="p-4 text-muted">{row[1]}</td>
                  <td className="p-4 text-muted">{row[2]}</td>
                  <td className="border-l border-signal p-4 font-mono text-green">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Free",
      audience: "For trying your first brand",
      price: "$0",
      suffix: "forever",
      items: ["1 hosted agent connection", "50 finished assets / month", "5 generative images", "1 active BrandSpec", "Compile, inspect, render + audit"],
      cta: "Connect your agent free",
      href: "/login?agent=1",
    },
    {
      name: "Studio",
      audience: "For creators and growing brands",
      price: "$49",
      suffix: "/ month",
      badge: "MOST POPULAR",
      items: ["5 agent connections + signed webhooks", "1,000 finished assets / month", "100 generative images", "3 active BrandSpecs", "Campaign planning + resumable review", "Calendar, publishing + performance loop"],
      cta: "Start with Studio",
      href: "/login?plan=studio",
    },
    {
      name: "Agency",
      audience: "For teams managing clients",
      price: "$199",
      suffix: "/ month",
      items: ["25 agent connections", "10,000 finished assets / month", "1,000 generative images", "25 active BrandSpecs", "Reviewer seats + client approvals", "Multi-brand campaigns + client reports"],
      cta: "Start an agency pilot",
      href: "/login?plan=agency",
    },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-16 text-ink md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead light eyebrow="Simple plans, honest scaling" title="Connect the agent free. Pay when it starts operating the business." body="Free proves the agent + brand loop on one real identity. Studio adds approvals, scheduling, webhooks and learning. Agency adds client volume and controlled collaboration." />
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col border bg-[#FBFAF7] p-6 shadow-[6px_6px_0_#D8D3C9] sm:p-7 ${plan.badge ? "border-[#A83200] lg:-translate-y-2" : "border-[#C9C4BA]"}`}>
              {plan.badge && <span className="absolute right-4 top-0 -translate-y-1/2 bg-[#A83200] px-3 py-1 font-mono text-[9px] tracking-[0.12em] text-white">{plan.badge}</span>}
              <h3 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-[#A83200]">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm text-[#6A655D]">{plan.audience}</p>
              <div className="mt-5 border-y border-[#D8D3C9] py-5">
                <strong className="font-display text-5xl tracking-[-0.04em]">{plan.price}</strong>
                <span className="ml-2 font-mono text-[11px] text-[#6A655D]">{plan.suffix}</span>
              </div>
              <ul className="mt-4 flex-1">
                {plan.items.map((item) => <li key={item} className="border-b border-[#E2DED6] py-3 text-sm before:mr-2 before:text-[#A83200] before:content-['✓']">{item}</li>)}
              </ul>
              <a href={plan.href} className={`mt-6 inline-flex min-h-12 items-center justify-center px-5 text-sm font-semibold transition-colors ${plan.badge ? "bg-[#A83200] text-white hover:bg-ink" : "border border-ink text-ink hover:bg-ink hover:text-bone"}`}>{plan.cta} →</a>
            </article>
          ))}
        </div>
        <div className="mt-7 grid border border-[#C9C4BA] bg-[#F0ECE3] lg:grid-cols-[1.2fr_.8fr]">
          <div className="border-b border-[#D8D3C9] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div><span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A83200]">Rail for developers</span><h3 className="mt-2 font-display text-2xl font-bold">Brand-safe rendering inside your product.</h3></div>
              <div className="text-right"><strong className="font-display text-3xl">Starts free</strong><span className="block font-mono text-[10px] text-[#6A655D]">1 hosted connection</span></div>
            </div>
            <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-[#514D47]">Connect through hosted MCP, REST, CLI or SDK. Free agents can compile, inspect and render; Studio unlocks campaigns, approval events, scheduling and the performance loop.</p>
            <a href="/agents" className="mt-5 inline-flex text-sm font-semibold underline decoration-[#A83200] underline-offset-4">Explore the developer rail →</a>
          </div>
          <div className="p-6 sm:p-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A83200]">Open by design</span>
            <h3 className="mt-2 font-display text-xl font-bold">Self-host the rail. Keep the spec.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#514D47]">The SDK, CLI, MCP server and BrandSpec format are open. Use the cloud where it helps; leave with your system intact.</p>
            <a href="https://github.com/apwn/brandrail" className="mt-5 inline-flex text-sm font-semibold underline decoration-[#A83200] underline-offset-4">View on GitHub →</a>
          </div>
        </div>
        <div className="mt-7 border-2 border-[#A83200] p-5 sm:flex sm:items-start sm:justify-between sm:gap-8">
          <div><b className="font-display text-lg">Agency pilot guarantee</b><p className="mt-1 max-w-[800px] text-sm leading-relaxed text-[#514D47]">If the pilot does not cut measured production time for the selected client by at least half within 30 days, we refund the month. You keep the compiled BrandSpecs.</p></div>
          <span className="mt-3 block shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#A83200] sm:mt-1">Agency plan only</span>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Is Brandrail for one brand or many?", "Both. Free is for proving one brand. Studio is built for creators, founders and in-house marketers running up to three. Agency adds 25 active brands, reviewer seats and client reporting."],
  ["Does Brandrail replace designers or Canva?", "No. Designers still own the system, campaigns and judgment. Canva and Figma remain useful for bespoke design work; Brandrail removes repeat production and makes the rules your team defines enforceable across routine content."],
  ["How long does setup take?", "The live URL compile returns an initial BrandSpec in about 60 seconds. You can review uncertain fields, refine the rules and start rendering before connecting a channel or inviting a team."],
  ["What happens when the website does not contain the full brand system?", "The compiler marks low-confidence fields for review. Your team can correct colors, voice, imagery and constraints before the spec is used. Brandrail should expose uncertainty, not pretend it has taste it could not observe."],
  ["What exactly is enforced?", "The renderer checks the BrandSpec rules it can measure: typography, color roles, contrast, density, spacing, logo behavior, format dimensions, banned words and other configured limits. Human approval still owns factual accuracy and creative judgment."],
  ["Do I have to replace my scheduler?", "No. Use Brandrail’s visual calendar or keep your current workflow through the API. Bluesky and Mastodon connect directly; LinkedIn, Instagram, Facebook, X and TikTok become available when the corresponding approved platform app credentials are configured."],
  ["Which agents can connect?", "Clients that support remote Streamable HTTP MCP can connect to the hosted endpoint. Stdio clients can use the local MCP package. The same scoped credential also works with the CLI, SDK and REST API."],
  ["Can an agent publish without me?", "Not silently. Agent publishing requires an approved batch item or an explicit confirmation flag after you approve the exact action. Dry-runs validate the plan first, idempotency prevents duplicate retries, and every mutation is recorded."],
  ["What can the free agent connection do?", "Free includes one workspace key, one active BrandSpec and 50 finished assets each month. It can compile, inspect, render, dry-run and read the audit trail. Studio unlocks campaign planning, approvals, webhooks, channels, publishing and analytics."],
  ["Can I leave with my data?", "Yes. BrandSpecs are portable and exportable, and the SDK, CLI, MCP server and spec format are open. Your brand system is not trapped inside a proprietary editor."],
];

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-24">
      <div className="mx-auto max-w-[900px] px-5 sm:px-6">
        <SectionHead eyebrow="FAQ" title="Before you put your brand on the rail." />
        <div className="border-t border-hairline">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group border-b border-hairline-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal">
                {question}<span className="font-mono text-xl text-signal group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="max-w-[760px] pb-6 text-[15px] leading-relaxed text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ url, setUrl, onSubmit }: Omit<LandingProps, "error">) {
  return (
    <section className="relative overflow-hidden py-20 text-center md:py-24">
      <div className="surface-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-[820px] px-5 sm:px-6">
        <span className="eyebrow text-signal">The agent is ready. Give it rails.</span>
        <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] font-bold leading-[1.02] tracking-[-0.04em]">Connect the AI you already use to the brand you already own.</h2>
        <p className="mx-auto mt-5 max-w-[650px] text-[17px] text-muted">Start with one free hosted connection, one real BrandSpec and a workflow that keeps you in control of every irreversible step.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="/login?agent=1" className="btn min-h-12">Connect your agent free →</a><a href="/agents" className="btn-ghost min-h-12">Explore all {MCP_TOOL_COUNT} tools</a></div>
        <div className="mx-auto mt-10 max-w-[650px] border-t border-hairline pt-6 text-left"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted">Or compile your website first</p><UrlBox id="final-client-url" url={url} setUrl={setUrl} onSubmit={onSubmit} /></div>
      </div>
    </section>
  );
}

function Footer() {
  return <PublicFooter />;
}
