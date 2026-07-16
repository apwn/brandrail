"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ARCHETYPE_INFO, type LayoutArchetype } from "@brandrail/spec";
import { PublicFooter } from "./components/public-footer";
import { PublicNav } from "./components/public-nav";
import { MCP_TOOL_COUNT } from "@/lib/mcp-meta";
import { trackConversion } from "@/lib/conversion";

const LANDING_NAV_LINKS = [
  { href: "#examples", label: "Output" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#templates", label: "Templates" },
  { href: "#pricing", label: "Pricing" },
] as const;

const LANDING_MOBILE_LINK = { href: "/agents", label: "Agents" } as const;

type LandingProps = {
  url: string;
  setUrl: (value: string) => void;
  onSubmit: () => void;
  error: string | null;
};

export function MarketingLanding({ url, setUrl, onSubmit, error }: LandingProps) {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("brand")) trackConversion("landing_view");
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <PublicNav
        links={LANDING_NAV_LINKS}
        mobileLink={LANDING_MOBILE_LINK}
        ctaHref="#try"
        ctaLabel="Try it free"
      />
      <Hero url={url} setUrl={setUrl} onSubmit={onSubmit} error={error} />
      <main>
        <OutputProof />
        <HowItWorks />
        <ContentProgram />
        <CreativeControl />
        <UseCases />
        <Pricing />
        <Faq />
      </main>
      <FinalCta url={url} setUrl={setUrl} onSubmit={onSubmit} />
      <PublicFooter note="Open BrandSpec · open SDK, CLI and MCP packages · self-hostable" />
    </div>
  );
}

function Hero({ url, setUrl, onSubmit, error }: LandingProps) {
  return (
    <header id="try" className="relative scroll-mt-20 overflow-hidden border-b border-hairline-soft py-12 sm:py-14 lg:py-16">
      <div className="surface-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-14">
        <div>
          <div className="mb-5 flex w-fit items-center gap-2 border border-hairline bg-panel px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px]">
            <span className="h-2 w-2 bg-signal" aria-hidden />
            Agent-first social content
          </div>
          <h1 className="max-w-[690px] font-display text-[clamp(42px,5.4vw,68px)] font-bold leading-[0.97] tracking-[-0.045em]">
            Turn one brief into a week of <span className="text-signal">on-brand content.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-muted sm:text-[18px]">
            Your agent plans it. Brandrail renders every channel, checks every brand rule and waits for your approval before anything publishes. Start with a week—or keep the next four weeks full.
          </p>
          <div className="mt-7 max-w-[660px]">
            <UrlBox id="hero-client-url" placement="hero" url={url} setUrl={setUrl} onSubmit={onSubmit} />
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[.08em] text-muted">01 · Scan your site&nbsp;&nbsp; 02 · Review the brand rules&nbsp;&nbsp; 03 · Plan one or four weeks</p>
            {error && <p className="mt-3 border-l-2 border-signal pl-3 font-mono text-xs text-signal" role="alert">{error}</p>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="font-mono text-[10px] text-green">✓ No card · first BrandSpec free</span>
            <a
              href="/login?agent=1"
              onClick={() => trackConversion("agent_cta_clicked", { placement: "hero" })}
              className="font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal"
            >
              Already have an agent? Connect it →
            </a>
          </div>
        </div>
        <HeroBoard />
      </div>
      <div className="relative mx-auto mt-12 grid max-w-[1180px] grid-cols-2 border-x border-t border-hairline bg-panel px-5 sm:grid-cols-4 sm:px-6 lg:px-0">
        {[
          ["05", "channel formats"],
          [`${Object.keys(ARCHETYPE_INFO).length}+`, "built-in + custom templates"],
          ["01", "human approval gate"],
          ["02 min", "agent setup"],
        ].map(([value, label], index) => (
          <div key={label} className={`px-3 py-4 text-center ${index % 2 === 0 ? "border-r border-hairline" : ""} ${index < 2 ? "border-b border-hairline sm:border-b-0" : ""} sm:border-r sm:last:border-r-0`}>
            <strong className="font-display text-xl text-bone">{value}</strong>
            <span className="ml-2 font-mono text-[9px] uppercase tracking-[.08em] text-muted sm:block sm:ml-0 sm:mt-1">{label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

function UrlBox({ id, placement, url, setUrl, onSubmit }: Omit<LandingProps, "error"> & { id: string; placement: "hero" | "final" }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;
    trackConversion("url_submitted", { placement });
    onSubmit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col border border-hairline bg-panel focus-within:border-signal sm:flex-row">
      <label htmlFor={id} className="sr-only">Your website URL</label>
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
        See my brand system →
      </button>
    </form>
  );
}

function HeroBoard() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] xl:mx-0">
      <div className="absolute -left-4 top-10 hidden h-[calc(100%-5rem)] w-px bg-signal/50 sm:block" aria-hidden />
      <div className="border border-hairline bg-panel shadow-[16px_16px_0_#0A0A0B,16px_16px_0_1px_#2E2E32]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 font-mono text-[10px] text-muted">
          <span>CLAUDE / NORTHSTAR CAMPAIGN</span>
          <span className="text-green">● AGENT CONNECTED</span>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-mono text-[11px] leading-relaxed text-bone"><span className="text-signal">you ›</span> Turn the launch brief into five posts. Keep the brand strict and get my approval before scheduling.</p>
          <div className="mt-5 border border-hairline">
            {[
              ["01", "Brand system loaded", "northstar@12", "done"],
              ["02", "Campaign rendered", "5 formats · 0 violations", "done"],
              ["03", "Human approval", "waiting", "wait"],
              ["04", "Schedule + measure", "paused", "wait"],
            ].map(([number, label, meta, state]) => (
              <div key={number} className="grid grid-cols-[28px_1fr_auto] gap-2 border-b border-hairline-soft px-3 py-3 last:border-b-0 font-mono text-[9px] sm:text-[10px]">
                <span className="text-muted">{number}</span>
                <span className="text-bone">{label}</span>
                <span className={state === "done" ? "text-green" : "text-signal"}>{state === "done" ? `✓ ${meta}` : `◷ ${meta}`}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-l-2 border-signal pl-3 font-mono text-[9px] leading-relaxed text-muted">The reversible work runs automatically. Publishing waits for an approved item or explicit confirmation.</p>
        </div>
        <div className="grid grid-cols-3 border-t border-hairline text-center font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
          <span className="border-r border-hairline py-3 text-green">Brand locked</span>
          <span className="border-r border-hairline py-3">Audit logged</span>
          <span className="py-3 text-signal">Human decides</span>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, body, light = false }: { eyebrow: string; title: React.ReactNode; body?: React.ReactNode; light?: boolean }) {
  return (
    <div className="mb-9 max-w-[760px] md:mb-11">
      <span className={`eyebrow ${light ? "!text-[#A83200]" : "text-signal"}`}>{eyebrow}</span>
      <h2 className="mt-3.5 font-display text-[clamp(32px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em]">{title}</h2>
      {body && <p className={`mt-4 max-w-[690px] text-[16px] leading-relaxed sm:text-[17px] ${light ? "text-[#514D47]" : "text-muted"}`}>{body}</p>}
    </div>
  );
}

function OutputProof() {
  const outputs = [
    { src: "/proof/carousel.png", label: "Instagram carousel", detail: "Slide 1 of 4 · 1080×1350", aspect: "aspect-[4/5]" },
    { src: "/proof/og-image.png", label: "Link preview", detail: "Open Graph · 1200×630", aspect: "aspect-[40/21]" },
    { src: "/proof/x-graphic.png", label: "Social graphic", detail: "Landscape · 1600×900", aspect: "aspect-[16/9]" },
  ];
  return (
    <section id="examples" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-16 text-ink md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead
          light
          eyebrow="See the result before the machinery"
          title={<>One brief. One brand.<br />A finished channel set.</>}
          body="These are production renders, not design mockups. Every canvas uses the same BrandSpec, approved direction and pre-raster violation gate."
        />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr] lg:items-end">
          {outputs.map((output, index) => (
            <figure key={output.src} className="border border-[#BEB8AD] bg-[#F6F3ED] p-3 shadow-[5px_5px_0_#D8D3C9]">
              <div className="overflow-hidden border border-[#CFC9BE] bg-white">
                <Image src={output.src} alt={`${output.label} rendered by Brandrail`} width={index === 0 ? 1080 : 1600} height={index === 0 ? 1350 : 900} sizes="(min-width: 1024px) 380px, 90vw" className={`${output.aspect} w-full object-cover`} />
              </div>
              <figcaption className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
                <div><b className="block font-display text-[13px]">{output.label}</b><span className="font-mono text-[9px] text-[#6A655D]">{output.detail}</span></div>
                <span className="font-mono text-[10px] text-[#A83200]">0{index + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 grid gap-5 border-t border-[#C9C4BA] pt-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <b className="font-display text-lg">Not one Brandrail house style.</b>
            <p className="mt-1 max-w-[700px] text-sm leading-relaxed text-[#514D47]">The renderer follows each brand’s palette, typography, casing, alignment and image treatment instead of imposing the interface aesthetic on the output.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0" aria-label="Fictional brand range proof">
            {[
              ["/proof/range-fieldnote.png", "Fieldnote"],
              ["/proof/range-relay.png", "RELAY/OPS"],
              ["/proof/range-morrow.png", "Morrow Studio"],
            ].map(([src, name]) => (
              <figure key={src} className="w-36 shrink-0 border border-[#C9C4BA] bg-white p-1.5 sm:w-44">
                <Image src={src} alt={`${name} fictional BrandSpec render`} width={640} height={360} sizes="176px" className="aspect-video w-full object-cover" />
                <figcaption className="px-0.5 pt-1.5 font-mono text-[8px] text-[#6A655D]">{name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.1em] text-[#777168]">Synthetic proof brands · production renderer · no customer claims</p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Bring the brief", "Use the agent you already have—or work in Studio. Brandrail loads the brand before planning begins."],
    ["02", "Render inside the rules", "Copy, templates, images and every channel format pass through one enforceable brand system."],
    ["03", "Approve once, then publish", "Review the exact assets, leave comments and release only the work you approve into the calendar."],
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
          <SectionHead
            eyebrow="The expensive part is not writing"
            title="AI made drafts cheap. Cleanup is still manual."
            body="Off-brand layouts, repeated resizing and approval chasing erase the time AI was supposed to save. Brandrail makes the whole repeatable path enforceable."
          />
          <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-3">
            {steps.map(([number, title, body]) => (
              <article key={number} className="bg-panel p-5 sm:p-6">
                <span className="font-mono text-[10px] text-signal">{number}</span>
                <h3 className="mt-6 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-7 grid gap-px border border-hairline bg-hairline sm:grid-cols-4">
          {[
            ["Identity", "type · color · logo"],
            ["Composition", "grid · spacing · hierarchy"],
            ["Imagery", "photos · crops · treatments"],
            ["Voice", "tone · claims · CTA limits"],
          ].map(([title, detail]) => <div key={title} className="bg-ink px-4 py-4"><b className="font-display text-sm">{title}</b><span className="mt-1 block font-mono text-[9px] text-muted">{detail}</span></div>)}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-signal/40 bg-panel p-5">
          <div><b className="font-display text-lg">Already operate through Claude, OpenClaw or another MCP client?</b><p className="mt-1 text-sm text-muted">The agent-specific setup, tools and safety model live on one focused page.</p></div>
          <a href="/agents" className="btn-ghost">See the agent platform →</a>
        </div>
      </div>
    </section>
  );
}

function ContentProgram() {
  const weeks = [
    { label: "Week 1", state: "READY TO PRODUCE", tone: "green", posts: ["Launch story", "Proof carousel", "Founder POV"] },
    { label: "Week 2", state: "PLANNED", tone: "signal", posts: ["Customer problem", "How it works", "Objection post"] },
    { label: "Week 3", state: "PLANNED", tone: "signal", posts: ["Use case", "Behind the scenes", "Product lesson"] },
    { label: "Week 4", state: "ADAPTS TO RESULTS", tone: "muted", posts: ["Winning angle", "Fresh proof", "Next offer"] },
  ] as const;

  return (
    <section id="content-program" className="scroll-mt-20 border-b border-hairline-soft bg-panel py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[.76fr_1.24fr] lg:items-center lg:gap-14">
          <div>
            <p className="eyebrow text-signal">Your always-on content program</p>
            <h2 className="mt-4 font-display text-[clamp(34px,4.2vw,52px)] font-bold leading-[1.02] tracking-[-.04em]">Plan four weeks. Produce the next week. Learn before the next one.</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-muted">Give Brandrail the outcome, audience, product facts and content pillars once. It maps a coherent four-week plan, turns the next week into channel-native copy and finished assets, then refreshes unlocked ideas with performance and your feedback.</p>
            <ol className="mt-7 border-y border-hairline-soft">
              {[
                ["01", "Set the strategy", "Objective, audience, pillars, offer and important dates."],
                ["02", "Preview before spending", "See and export all four weeks before any asset is rendered."],
                ["03", "Choose the control level", "Approve each week by default, or explicitly enable auto-publishing."],
              ].map(([number, title, body]) => (
                <li key={number} className="grid grid-cols-[32px_1fr] gap-3 border-b border-hairline-soft py-4 last:border-b-0">
                  <span className="font-mono text-[10px] text-signal">{number}</span>
                  <span><b className="block font-display text-sm">{title}</b><span className="mt-1 block text-sm leading-relaxed text-muted">{body}</span></span>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a href="#try" onClick={() => trackConversion("content_program_cta_clicked", { placement: "landing" })} className="btn">Preview my next 4 weeks free →</a>
              <a href="/agents#tools" className="text-sm font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">Let my agent run it</a>
            </div>
          </div>
          <div className="overflow-hidden border border-hairline bg-ink shadow-[12px_12px_0_#0A0A0B,12px_12px_0_1px_#2E2E32]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 font-mono text-[9px] uppercase tracking-[.08em] text-muted">
              <span>Northstar / four-week program</span><span className="text-green">● Strategy locked</span>
            </div>
            <div className="grid gap-px bg-hairline sm:grid-cols-2">
              {weeks.map((week) => (
                <article key={week.label} className="bg-panel p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 font-mono text-[9px]">
                    <span className="text-bone">{week.label}</span>
                    <span className={week.tone === "green" ? "text-green" : week.tone === "signal" ? "text-signal" : "text-muted"}>{week.state}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {week.posts.map((post, index) => (
                      <div key={post} className="grid grid-cols-[22px_1fr_auto] items-center gap-2 border border-hairline-soft px-3 py-2.5 font-mono text-[9px]">
                        <span className="text-muted">0{index + 1}</span><span>{post}</span><span className={week.label === "Week 1" ? "text-green" : "text-muted"}>{week.label === "Week 1" ? "✓" : "○"}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="grid grid-cols-3 border-t border-hairline text-center font-mono text-[8px] uppercase tracking-[.08em] text-muted">
              <span className="border-r border-hairline py-3">12 posts planned</span><span className="border-r border-hairline py-3 text-green">0 assets spent</span><span className="py-3 text-signal">Weekly refresh</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CREATIVE_MODES = [
  ["auto", "Auto Mix", "The agent chooses the strongest valid composition for every channel."],
  ["template", "One Template", "Choose one approved direction and adapt it across formats."],
  ["plan", "Channel Plan", "Direct selected channels while the rest remain automatic."],
  ["recipe", "Saved Look", "Reuse the visual direction next week with completely fresh copy."],
  ["family", "Custom Family", "Duplicate a built-in, upload artwork and publish your own versioned visual system."],
] as const;
const TEMPLATE_SHOWCASE = Object.keys(ARCHETYPE_INFO) as LayoutArchetype[];
const CUSTOM_FAMILY_STEPS = [
  ["01", "Duplicate", "Keep the proven content contract; change the visual composition."],
  ["02", "Design safely", "Move text, image, logo, shape and data zones without executable code."],
  ["03", "Preflight + publish", "Check geometry, contrast, artwork and all five canvases before release."],
] as const;
const CUSTOM_FAMILY_GEOMETRY = [["X", "10%"], ["Y", "28%"], ["W", "38%"], ["H", "25%"]] as const;

function TemplateStudioProof() {
  return (
    <article id="template-studio" className="mt-5 grid scroll-mt-20 overflow-hidden border border-hairline bg-panel lg:grid-cols-[.78fr_1.22fr]">
      <div className="border-b border-hairline p-6 sm:p-8 lg:border-b-0 lg:border-r">
        <span className="eyebrow text-green">Your visual system, not ours</span>
        <h3 className="mt-4 max-w-[430px] font-display text-3xl font-bold leading-tight sm:text-4xl">Start with {Object.keys(ARCHETYPE_INFO).length}. Make one unmistakably yours.</h3>
        <p className="mt-4 max-w-[500px] text-[15px] leading-relaxed text-muted">Duplicate a production template, drag its named layers into place, attach approved artwork for each format and publish an immutable version. Your family then renders through the same BrandSpec and quality gate as every built-in.</p>
        <ol className="mt-6 border-y border-hairline-soft">
          {CUSTOM_FAMILY_STEPS.map(([number, title, body]) => <li key={number} className="grid grid-cols-[30px_1fr] gap-3 border-b border-hairline-soft py-3.5 last:border-b-0"><span className="font-mono text-[9px] text-signal">{number}</span><span><b className="block font-display text-sm">{title}</b><span className="mt-1 block text-xs leading-relaxed text-muted">{body}</span></span></li>)}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href="/templates" onClick={() => trackConversion("template_family_cta_clicked", { placement: "landing" })} className="btn">Open the template Studio →</a>
          <a href="/docs#templates" className="text-sm font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">Read the model</a>
        </div>
      </div>
      <div className="bg-ink p-4 sm:p-6">
        <div className="overflow-hidden border border-hairline bg-panel shadow-[10px_10px_0_#0A0A0B,10px_10px_0_1px_#2E2E32]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 font-mono text-[9px] uppercase tracking-[.08em] text-muted"><span>Visual family / launch-frame</span><span className="text-green">● v4 published</span></div>
          <div className="grid gap-px bg-hairline sm:grid-cols-[1fr_210px]">
            <div className="bg-panel p-4">
              <div className="mb-3 flex items-center justify-between font-mono text-[8px] uppercase text-muted"><span>LinkedIn · 1200×627</span><span>Drag layers</span></div>
              <div className="relative aspect-[40/21] overflow-hidden border border-hairline bg-bone text-ink">
                <span className="absolute left-[7%] top-[8%] h-[84%] w-[47%] border border-[#BEB8AD] bg-[#F4EFE5]" />
                <span className="absolute left-[10%] top-[15%] flex h-[10%] w-[38%] items-center border border-[#BEB8AD] px-2 font-mono text-[7px] uppercase text-[#6A655D]">kicker · 36</span>
                <span className="absolute left-[10%] top-[28%] flex h-[25%] w-[38%] items-center overflow-hidden border-2 border-[#A83200] px-2 font-display text-[clamp(9px,1vw,14px)] font-bold leading-[1.08]">The launch system teams remember.</span>
                <span className="absolute left-[10%] top-[58%] flex h-[17%] w-[38%] items-center border border-[#BEB8AD] px-2 text-[7px] leading-tight text-[#514D47]">Approved copy stays editable inside the contract.</span>
                <span className="absolute left-[10%] top-[82%] flex h-[5%] w-[19%] items-center font-display text-[7px] font-bold">NORTHSTAR</span>
                <span className="absolute left-[57%] top-[8%] flex h-[84%] w-[36%] items-center justify-center border border-[#BEB8AD] bg-[#D8D3C9] font-mono text-[7px] uppercase text-[#6A655D]">approved artwork</span>
                <span className="absolute left-[48%] top-[28%] -translate-x-full -translate-y-full bg-signal px-1.5 py-1 font-mono text-[6px] font-bold uppercase text-ink">hook selected</span>
              </div>
            </div>
            <aside className="bg-panel p-4">
              <span className="font-mono text-[8px] uppercase tracking-[.1em] text-signal">Layer inspector</span>
              <b className="mt-2 block font-display text-sm">hook · text</b>
              <span className="font-mono text-[8px] text-muted">field-hook</span>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {CUSTOM_FAMILY_GEOMETRY.map(([label, value]) => <span key={label} className="border border-hairline px-2 py-2"><span className="block font-mono text-[7px] text-muted">{label}</span><b className="font-mono text-[9px]">{value}</b></span>)}
              </div>
              <div className="mt-3 border border-hairline p-2 font-mono text-[8px] text-muted"><span className="text-green">✓</span> Contract · 90 chars</div>
              <div className="mt-2 border border-hairline p-2 font-mono text-[8px] text-muted"><span className="text-green">✓</span> Contrast · 11.4:1</div>
            </aside>
          </div>
          <div className="grid grid-cols-3 border-t border-hairline text-center font-mono text-[8px] uppercase tracking-[.06em] text-muted"><span className="border-r border-hairline py-3">v2 draft</span><span className="border-r border-hairline py-3">v3 archived</span><span className="py-3 text-green">v4 published</span></div>
        </div>
        <p className="mt-4 font-mono text-[9px] leading-relaxed text-muted">Strict data model · workspace-owned uploads · immutable history · API, SDK, CLI and MCP ready</p>
      </div>
    </article>
  );
}

function CreativeControl() {
  const [activeMode, setActiveMode] = useState<(typeof CREATIVE_MODES)[number][0]>("auto");
  const [activeTemplate, setActiveTemplate] = useState<LayoutArchetype>("hero-statement");
  const mode = CREATIVE_MODES.find((item) => item[0] === activeMode) ?? CREATIVE_MODES[0];
  const template = ARCHETYPE_INFO[activeTemplate];

  function chooseMode(id: (typeof CREATIVE_MODES)[number][0]) {
    setActiveMode(id);
    trackConversion("creative_mode_selected", { mode: id });
  }
  function chooseTemplate(id: LayoutArchetype) {
    setActiveTemplate(id);
    trackConversion("template_preview_selected", { template: id });
  }

  return (
    <section id="templates" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead
          eyebrow="Agent speed, designer control"
          title={<>Let the agent art-direct.<br />Take over when judgment matters.</>}
          body="Start automatically, force a specific template, direct each channel, save an approved look, or publish a versioned custom family. The same BrandSpec protects every mode."
        />
        <div className="grid overflow-hidden border border-hairline bg-panel lg:grid-cols-[.7fr_1.3fr]">
          <div className="border-b border-hairline p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" role="group" aria-label="Creative control modes">
              {CREATIVE_MODES.map(([id, label, description], index) => {
                const selected = id === activeMode;
                return (
                  <button key={id} type="button" aria-pressed={selected} onClick={() => chooseMode(id)} className={`grid grid-cols-[28px_1fr_auto] items-center gap-3 border p-3.5 text-left ${selected ? "border-signal bg-signal/5" : "border-hairline-soft hover:border-muted"}`}>
                    <span className={`font-mono text-[9px] ${selected ? "text-signal" : "text-muted"}`}>0{index + 1}</span>
                    <span><b className="block font-display text-sm">{label}</b><span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span></span>
                    <span className={selected ? "text-signal" : "text-muted"} aria-hidden>{selected ? "●" : "○"}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-ink p-4 sm:p-5">
            <div className="border border-hairline bg-panel">
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3 font-mono text-[9px] uppercase tracking-[.1em] text-muted"><span>Northstar / campaign direction</span><span className="text-green">● Brand locked</span></div>
              <div className="p-4 sm:p-5">
                <span className="font-mono text-[9px] uppercase tracking-[.12em] text-signal">Active mode</span>
                <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><h3 className="font-display text-2xl font-bold">{mode[1]}</h3><span className="font-mono text-[9px] text-muted">{Object.keys(ARCHETYPE_INFO).length} templates · 5 formats</span></div>
                <p className="mt-2 max-w-[610px] text-sm leading-relaxed text-muted">{mode[2]}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {["Typography locked", "Approved media only", "Copy stays editable"].map((rule, index) => <span key={rule} className={`border px-3 py-2 text-center font-mono text-[8px] uppercase tracking-[.08em] ${index === 2 ? "border-signal/50 text-signal" : "border-hairline text-muted"}`}>{index < 2 ? "✓" : "↳"} {rule}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden border border-hairline bg-panel">
          <div className="grid lg:grid-cols-[1.22fr_.78fr]">
            <div className="border-b border-hairline p-3 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="relative aspect-[40/21] overflow-hidden border border-hairline bg-bone">
                <Image key={activeTemplate} src={`/proof/templates/${activeTemplate}.png`} alt={`${template.label} template rendered by Brandrail`} fill sizes="(min-width: 1024px) 680px, 100vw" className="object-cover" />
              </div>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-green">✓ Production renderer · BrandSpec gate passed</p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><span className="font-mono text-[9px] uppercase tracking-[.12em] text-signal">{activeTemplate}</span><h3 className="mt-1 font-display text-2xl font-bold">{template.label}</h3></div><span className="border border-hairline px-2 py-1 font-mono text-[8px] uppercase text-muted">{template.optIn ? "Proof required" : "Auto-ready"}</span></div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{template.description}</p>
              <div className="mt-5 border-y border-hairline-soft py-4"><span className="font-mono text-[8px] uppercase tracking-[.12em] text-muted">Best for</span><p className="mt-1 text-sm text-bone">{template.bestFor}</p></div>
              <div className="mt-4"><span className="font-mono text-[8px] uppercase tracking-[.12em] text-muted">Editable fields</span><p className="mt-1 text-xs leading-relaxed text-bone">{Object.values(template.slots).map((slot) => slot.label).join(" · ")}</p></div>
              <div className="mt-4"><span className="font-mono text-[8px] uppercase tracking-[.12em] text-muted">Protected by the brand</span><p className="mt-1 text-xs leading-relaxed text-bone">{template.locked.join(" · ")}</p></div>
            </div>
          </div>
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto border-t border-hairline p-3 sm:grid sm:grid-cols-5 sm:overflow-visible sm:p-4" role="group" aria-label="Production template library">
            {TEMPLATE_SHOWCASE.map((archetype) => {
              const selected = archetype === activeTemplate;
              return (
                <button key={archetype} type="button" aria-pressed={selected} onClick={() => chooseTemplate(archetype)} className={`min-w-[152px] snap-start border p-1.5 text-left sm:min-w-0 ${selected ? "border-signal bg-signal/5" : "border-hairline hover:border-muted"}`}>
                  <span className="relative block aspect-[40/21] overflow-hidden bg-bone"><Image src={`/proof/templates/${archetype}.png`} alt="" fill sizes="(min-width: 640px) 190px, 152px" className="object-cover" /></span>
                  <span className="mt-2 flex items-center justify-between gap-2 px-0.5 pb-0.5"><b className="truncate font-display text-[11px]">{ARCHETYPE_INFO[archetype].label}</b><span className={selected ? "text-signal" : "text-muted"} aria-hidden>{selected ? "●" : "○"}</span></span>
                </button>
              );
            })}
          </div>
        </div>
        <TemplateStudioProof />
      </div>
    </section>
  );
}

function UseCases() {
  const [audience, setAudience] = useState<"one" | "many">("one");
  const content = audience === "one" ? {
    eyebrow: "Creator · founder · in-house marketer",
    title: "Show up every week without rebuilding the system.",
    body: "Bring the outcome once. Brandrail keeps the next four weeks coherent, carries your visual identity across every channel and refreshes the next production week with what worked.",
    bullets: ["One URL becomes a reusable brand system", "One strategy becomes a rolling four-week plan", "One approved look removes the next blank canvas"],
    stats: [["1", "active brand"], ["50", "free assets"], ["0", "blank canvases"]],
    cta: "Start with one brand",
    href: "#try",
  } : {
    eyebrow: "Agency · freelancer · content team",
    title: "Protect creative judgment and the margin around it.",
    body: "Give each client a separate brand system and approved template library. Run production through one queue without flattening their identity.",
    bullets: ["Multi-brand campaigns stay visually distinct", "Client approvals attach to the exact asset", "Reports and audit history keep delivery accountable"],
    stats: [["25", "active brands"], ["10k", "monthly assets"], ["1", "review rail"]],
    cta: "See Agency pricing",
    href: "#pricing",
  };
  return (
    <section id="use-cases" className="scroll-mt-20 border-b border-hairline-soft bg-panel py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead eyebrow="Simple at one brand, controlled at twenty-five" title="The workflow scales. The interface does not get in your way." />
          <div className="mb-9 flex border border-hairline p-1" role="group" aria-label="Choose your use case">
            {[["one", "One brand"], ["many", "Many brands"]].map(([id, label]) => <button key={id} type="button" aria-pressed={audience === id} onClick={() => { setAudience(id as "one" | "many"); trackConversion("audience_selected", { audience: id }); }} className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[.08em] ${audience === id ? "bg-signal text-ink" : "text-muted hover:text-bone"}`}>{label}</button>)}
          </div>
        </div>
        <article className="grid overflow-hidden border border-hairline bg-ink lg:grid-cols-[1fr_.72fr]">
          <div className="p-6 sm:p-8">
            <span className="eyebrow text-signal">{content.eyebrow}</span>
            <h3 className="mt-4 max-w-[620px] font-display text-3xl font-bold leading-tight sm:text-4xl">{content.title}</h3>
            <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted">{content.body}</p>
            <ul className="mt-6 grid gap-2 text-sm text-bone">{content.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><span className="font-mono text-green">✓</span><span>{bullet}</span></li>)}</ul>
            <a href={content.href} className="mt-7 inline-flex font-semibold text-bone underline decoration-signal underline-offset-4 hover:text-signal">{content.cta} →</a>
          </div>
          <div className="grid grid-cols-3 border-t border-hairline lg:grid-cols-1 lg:border-l lg:border-t-0">
            {content.stats.map(([value, label]) => <div key={label} className="flex flex-col justify-center border-r border-hairline p-4 text-center last:border-r-0 lg:border-b lg:border-r-0 lg:last:border-b-0"><strong className="font-display text-3xl text-signal">{value}</strong><span className="mt-1 font-mono text-[9px] uppercase text-muted">{label}</span></div>)}
          </div>
        </article>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free", audience: "Prove the loop on one real brand", price: "$0", suffix: "forever",
      outcome: "Compile your brand, preview the next four weeks and create the first channel set before paying.",
      items: ["1 active brand · 1 agent key", "Free four-week calendar preview + CSV export", "50 finished assets / month", `All ${Object.keys(ARCHETYPE_INFO).length} templates + custom families + saved looks`, "Brand checks and audit trail"],
      cta: "Try it with my website", href: "#try",
    },
    {
      name: "Studio", audience: "Operate up to three growing brands", price: "$49", suffix: "/ month", badge: "MOST POPULAR",
      outcome: "Keep the next four weeks planned and turn each new week into approved, scheduled content.",
      items: ["3 brands · 5 scoped agent keys", "1,000 finished assets / month", "Visual template families + immutable history", "Rolling programs, approvals and publishing"],
      cta: "Start with Studio", href: "/login?plan=studio",
    },
    {
      name: "Agency", audience: "Run controlled production for clients", price: "$199", suffix: "/ month",
      outcome: "Operate 25 distinct client brands through one production and approval rail.",
      items: ["25 brands · 25 scoped agent keys", "10,000 finished assets / month", "Brand-scoped template families", "Reviewer seats, campaigns + reports"],
      cta: "Start an Agency pilot", href: "/login?plan=agency",
    },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-16 text-ink md:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead light eyebrow="Start with the real product" title="Free proves the result. Paid plans run the operation." body="No stripped-down demo tier: compile, choose or build templates, save looks and render the first brand free. Upgrade when you need more brands, approval operations and publishing." />
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col border bg-[#FBFAF7] p-6 shadow-[6px_6px_0_#D8D3C9] sm:p-7 ${plan.badge ? "border-[#A83200] lg:-translate-y-2" : "border-[#C9C4BA]"}`}>
              {plan.badge && <span className="absolute right-4 top-0 -translate-y-1/2 bg-[#A83200] px-2.5 py-1 font-mono text-[8px] text-white">{plan.badge}</span>}
              <span className="font-mono text-[10px] uppercase tracking-[.1em] text-[#6A655D]">{plan.audience}</span>
              <h3 className="mt-3 font-display text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-2"><strong className="font-display text-5xl tracking-tight">{plan.price}</strong><span className="pb-1 text-sm text-[#6A655D]">{plan.suffix}</span></div>
              <p className="mt-5 min-h-[4.5rem] text-sm leading-relaxed text-[#514D47]">{plan.outcome}</p>
              <ul className="mt-5 flex-1 space-y-3 border-t border-[#D8D3C9] pt-5 text-sm">{plan.items.map((item) => <li key={item} className="flex gap-2.5"><span className="font-mono text-[#247A4A]">✓</span><span>{item}</span></li>)}</ul>
              <a href={plan.href} onClick={() => trackConversion("pricing_cta_clicked", { plan: plan.name.toLowerCase() })} className={plan.badge ? "btn mt-7 text-center" : "mt-7 border border-[#A83200] px-4 py-3 text-center text-sm font-semibold hover:bg-[#A83200] hover:text-white"}>{plan.cta} →</a>
            </article>
          ))}
        </div>
        <div className="mt-7 grid gap-5 border border-[#C9C4BA] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div><b className="font-display text-lg">Publishing without fine print.</b><p className="mt-1 max-w-[800px] text-sm leading-relaxed text-[#514D47]">Bluesky and Mastodon connect directly. LinkedIn, Instagram/Facebook, X and TikTok activate when the corresponding approved platform-app credentials are configured. Rendering, review and export work independently of channel connection.</p></div>
          <a href="/docs#publishing" className="shrink-0 font-mono text-[10px] uppercase tracking-[.1em] text-[#A83200] underline underline-offset-4">Channel details →</a>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-l-2 border-[#A83200] pl-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#514D47]"><b className="text-ink">Developers:</b> hosted MCP, REST, TypeScript SDK and CLI share the same permissions and render gate.</p><a href="/agents" className="shrink-0 text-sm font-semibold underline decoration-[#A83200] underline-offset-4">Explore the developer rail →</a></div>
      </div>
    </section>
  );
}

export const FAQ = [
  ["Is Brandrail for one brand or many?", "Both. Free proves the workflow on one brand. Studio supports three growing brands. Agency supports 25 client brands with reviewer access and reporting."],
  ["Can I choose the design, or does the agent decide?", "Either. Let Brandrail choose automatically, force one template, direct each channel, apply a saved look, or select a published custom family. Copy and approved-image fields stay editable while brand-critical design rules stay locked."],
  ["Can I upload or build my own templates?", "Yes. Duplicate any built-in, design it visually, upload locked PNG, JPEG, WebP or sanitized SVG artwork per format, then preflight and publish an immutable version. You can also import the strict template JSON. Brandrail rejects arbitrary HTML, CSS and JavaScript so custom families keep the same deterministic rendering and safety guarantees."],
  ["Can Brandrail plan four weeks?", "Yes. A Content Program maps one strategy into one or four weeks of dated ideas. The preview is free to generate; Brandrail produces the next week, learns from results and refreshes what follows so the plan stays coherent without becoming stale."],
  ["Which publishing channels are available?", "Bluesky and Mastodon connect directly. LinkedIn, Instagram/Facebook, X and TikTok are available when the corresponding approved platform-app credentials are configured. You can always render, review, export or use the API without connecting a channel."],
  ["Can an agent publish without my approval?", "Not silently. Agent publishing requires an approved review item or explicit confirmation. Dry-runs expose mutations first, retries are idempotent and every change stays visible in the audit trail."],
  ["Can I leave with my data?", "Yes. BrandSpecs are portable and exportable. The spec format, SDK, CLI and MCP server are open, and the full rail can be self-hosted."],
] as const;

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-hairline-soft py-16 md:py-20">
      <div className="mx-auto max-w-[920px] px-5 sm:px-6">
        <SectionHead eyebrow="The questions that affect the decision" title="Before you put your brand on the rail." />
        <div className="divide-y divide-hairline border-y border-hairline">
          {FAQ.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-display text-lg font-bold"><span>{question}</span><span className="font-mono text-signal group-open:rotate-45">+</span></summary><p className="mt-3 max-w-[790px] text-sm leading-relaxed text-muted">{answer}</p></details>)}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ url, setUrl, onSubmit }: Omit<LandingProps, "error">) {
  return (
    <section className="relative overflow-hidden py-16 text-center md:py-20">
      <div className="surface-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-[860px] px-5 sm:px-6">
        <span className="eyebrow text-signal">The agent is ready. Give it rails.</span>
        <h2 className="mt-4 font-display text-[clamp(38px,5vw,58px)] font-bold leading-[1.02] tracking-[-0.04em]">Start with one brief. Keep four weeks full.</h2>
        <p className="mx-auto mt-5 max-w-[650px] text-[17px] text-muted">Start with your real website, see the brand system before creating an account and produce your first week free.</p>
        <div className="mx-auto mt-8 max-w-[700px] text-left"><UrlBox id="final-client-url" placement="final" url={url} setUrl={setUrl} onSubmit={onSubmit} /></div>
        <p className="mt-4 font-mono text-[10px] text-muted">Or <a href="/login?agent=1" onClick={() => trackConversion("agent_cta_clicked", { placement: "final" })} className="text-signal underline underline-offset-4">connect your agent directly</a> · {MCP_TOOL_COUNT} lifecycle tools · no card</p>
      </div>
    </section>
  );
}
