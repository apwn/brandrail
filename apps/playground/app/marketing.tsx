"use client";

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
      <Hero url={url} setUrl={setUrl} onSubmit={onSubmit} error={error} />
      <AudiencePaths />
      <main>
        <OutputSection />
        <WorkflowSection />
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
    <div className="border-b border-hairline bg-panel px-4 py-2.5 text-center font-mono text-xs text-muted">
      <span className="text-bone">Your website already contains a brand system.</span> Turn it into five ready-to-review posts free.{" "}
      <a className="text-signal underline decoration-signal/50 underline-offset-4 hover:text-bone" href="#top">
        Try your URL →
      </a>
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-ink/95 backdrop-blur" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-6">
        <a href="/" className="font-display text-xl font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
          brand<span className="border-b-[3px] border-signal pb-px">rail</span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-muted lg:flex">
          <a href="#examples" className="hover:text-bone">Examples</a>
          <a href="#workflow" className="hover:text-bone">How it works</a>
          <a href="#use-cases" className="hover:text-bone">Use cases</a>
          <a href="#pricing" className="hover:text-bone">Pricing</a>
          <a href="#faq" className="hover:text-bone">FAQ</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/agents" className="hidden text-sm text-muted hover:text-bone md:inline">For agent builders</a>
          <a href="/dashboard" className="hidden text-sm text-muted hover:text-bone sm:inline">Log in</a>
          <a href="#top" className="btn !px-3.5 !py-2 !text-xs sm:!px-4 sm:!text-[13px]">Try your brand free</a>
        </div>
      </div>
    </nav>
  );
}

function Hero({ url, setUrl, onSubmit, error }: LandingProps) {
  return (
    <header id="top" className="relative overflow-hidden border-b border-hairline-soft py-14 md:py-20">
      <div className="surface-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 px-5 sm:px-6 xl:grid-cols-[1.02fr_.98fr] xl:gap-16">
        <div>
          <div className="mb-6 flex w-fit items-center gap-2 border border-hairline bg-panel px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="h-2 w-2 bg-signal" aria-hidden />
            Brand-locked content from brief to publish
          </div>
          <h1 className="max-w-[690px] font-display text-[clamp(42px,5.7vw,68px)] font-bold leading-[0.98] tracking-[-0.045em]">
            Every post. <span className="text-signal">On brand.</span>{" "}
            Ready to publish.
          </h1>
          <p className="mt-6 max-w-[650px] text-[17px] leading-relaxed text-muted sm:text-lg">
            Paste any website. Brandrail learns the brand, writes and renders social posts, lets you review them, and sends approved content to your scheduler—or your agent.
          </p>
          <div className="mt-7 max-w-[650px]">
            <UrlBox id="hero-client-url" url={url} setUrl={setUrl} onSubmit={onSubmit} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-muted">
            <span><b className="font-medium text-green">Free</b> · no signup · no card</span>
            <span>Uses your real brand</span>
            <a href="#workflow" className="text-bone underline decoration-hairline underline-offset-4 hover:decoration-signal">See the workflow ↓</a>
          </div>
          {error && <p className="mt-4 border-l-2 border-signal pl-3 font-mono text-sm text-signal" role="alert">{error}</p>}
        </div>
        <HeroBoard />
      </div>
    </header>
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
        See my next 5 posts →
      </button>
    </form>
  );
}

const FORMATS = [
  { label: "CAROUSEL", color: "#FF4D00", title: "The field guide to faster launches", meta: "instagram · 4 slides", shape: "aspect-[4/5]" },
  { label: "LINKEDIN", color: "#F2C230", title: "Ship the campaign, not another template", meta: "landscape · 1200×627", shape: "aspect-[1.91/1]" },
  { label: "STORY", color: "#7FB5A6", title: "Three rules. One recognizable brand.", meta: "vertical · 1080×1920", shape: "aspect-[9/16]" },
];

function HeroBoard() {
  return (
    <div className="relative mx-auto w-full max-w-[570px] xl:mx-0">
      <div className="absolute -left-4 top-10 hidden h-[calc(100%-5rem)] w-px bg-signal/50 sm:block" aria-hidden />
      <div className="border border-hairline bg-panel shadow-[16px_16px_0_#0A0A0B,16px_16px_0_1px_#2E2E32]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-4 py-3 font-mono text-[11px] text-muted">
          <span>NORTHSTAR · ONE BRIEF · FIVE FORMATS</span>
          <span className="text-green">✓ BRANDSPEC VALID</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-hairline-soft p-px">
          {FORMATS.map((format, index) => (
            <div key={format.label} className="flex min-h-[310px] flex-col bg-ink p-3.5 sm:min-h-[350px] sm:p-4">
              <div className={`flex ${format.shape} w-full flex-col justify-between overflow-hidden border border-hairline bg-panel p-3`}>
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] sm:text-[9px]" style={{ color: format.color }}>NORTHSTAR / 0{index + 1}</span>
                  <span className="mt-2 block h-1 w-8" style={{ backgroundColor: format.color }} aria-hidden />
                </div>
                <div className="space-y-1">
                  <span className="block h-1 w-4/5 bg-bone/85" />
                  <span className="block h-1 w-3/5 bg-bone/40" />
                </div>
              </div>
              <p className="mt-4 font-display text-[13px] font-bold leading-tight sm:text-base">{format.title}</p>
              <span className="mt-auto pt-3 font-mono text-[8px] text-muted sm:text-[9px]">{format.meta}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 border-t border-hairline text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <span className="border-r border-hairline py-3 text-green">5 assets rendered</span>
          <span className="border-r border-hairline py-3">+2 formats</span>
          <span className="py-3 text-signal">Review next</span>
        </div>
      </div>
    </div>
  );
}

function AudiencePaths() {
  const paths = [
    ["01", "ONE BRAND", "Creators & founders", "Turn one website and one idea into a consistent weekly content system.", "#one-brand", "See the solo workflow"],
    ["02", "MANY BRANDS", "Agencies & teams", "Move every client through one production and approval rail without flattening their identity.", "#many-brands", "See the agency workflow"],
    ["03", "BUILD WITH BRANDRAIL", "Developers & agents", "Give your product deterministic brand rendering through the API, MCP server or CLI.", "/agents", "Explore developer rails"],
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
  const outputs = [
    { src: "/proof/carousel.png", label: "Instagram carousel", detail: "Slide 1 of 4 · 1080×1350" },
    { src: "/proof/og-image.png", label: "Link preview", detail: "Open Graph · 1200×630" },
    { src: "/proof/x-graphic.png", label: "Social graphic", detail: "Landscape · 1600×900" },
  ];
  return (
    <section id="examples" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-20 text-ink md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead
          light
          eyebrow="Output from the engine"
          title={<>Not a mockup. Not a prompt lottery.<br />Finished assets from one brand system.</>}
          body="These examples were rendered by the same engine behind the URL demo. Typography, palette, spacing and format rules are pulled from one BrandSpec and checked before the asset is returned."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {outputs.map((output, index) => (
            <figure key={output.src} className="group border border-[#C9C4BA] bg-[#FBFAF7] p-3 shadow-[6px_6px_0_#D8D3C9]">
              <div className="overflow-hidden border border-[#D8D3C9] bg-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={output.src} alt={`${output.label} generated by Brandrail`} className="aspect-[4/3] w-full bg-white object-contain p-2 transition-transform duration-300 group-hover:scale-[1.015]" />
              </div>
              <figcaption className="flex items-start justify-between gap-3 px-1 pb-1 pt-3">
                <div>
                  <b className="block font-display text-sm">{output.label}</b>
                  <span className="font-mono text-[10px] text-[#6A655D]">{output.detail}</span>
                </div>
                <span className="font-mono text-xs text-[#A83200]">0{index + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 max-w-[720px] text-sm leading-relaxed text-[#5A554E]">
          Product evidence, not a stock gallery. These assets came from the engine behind the live URL demo; named customer stories will be added as the first public pilots complete.
        </p>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    ["01", "Paste any website", "Brandrail reads the live site, real fonts, palette, imagery and existing voice."],
    ["02", "Review the BrandSpec", "Confirm what is allowed, what is banned, and how the brand should compose a page."],
    ["03", "Give it a brief", "A launch, offer, hiring post or weekly theme becomes copy and format-ready creative."],
    ["04", "Approve and publish", "Edit, approve or regenerate the queue, then hand the approved set to your scheduler or agent."],
  ];
  return (
    <section id="workflow" className="scroll-mt-20 border-b border-hairline-soft py-20 md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="The workflow" title="From website to review queue in one rail." body="Brandrail does not replace creative direction. It turns the direction you already own into a repeatable production system." />
        <div className="relative grid gap-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <div className="absolute left-0 right-0 top-3 hidden h-px bg-hairline xl:block" aria-hidden />
          {steps.map(([number, title, body]) => (
            <article key={number} className="relative border-l border-hairline pl-5 xl:border-l-0 xl:pl-0 xl:pt-10">
              <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 bg-signal xl:left-0 xl:top-0" aria-hidden />
              <span className="font-mono text-xs text-signal">{number}</span>
              <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="scroll-mt-20 border-b border-hairline-soft bg-panel py-20 md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="Built to scale with you" title="One brand today. Twenty-five tomorrow. Same rail." body="Start with the job you have now. Brandrail keeps the workflow simple for a solo operator and adds review, workspaces and automation when the workload grows." />
        <div className="grid gap-px overflow-hidden border border-hairline bg-hairline lg:grid-cols-2">
          <article id="one-brand" className="scroll-mt-24 bg-ink p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="eyebrow text-signal">One brand</span>
              <span className="font-mono text-[10px] text-muted">CREATOR · FOUNDER · MARKETER</span>
            </div>
            <h3 className="mt-7 max-w-[430px] font-display text-3xl font-bold leading-tight">Show up every week without looking like a different company every day.</h3>
            <p className="mt-4 max-w-[500px] text-[15px] leading-relaxed text-muted">Bring the idea; Brandrail carries your typography, palette, voice and layout across every format. Review five posts as one coherent set instead of rebuilding them one at a time.</p>
            <div className="mt-8 grid grid-cols-3 border border-hairline text-center">
              <div className="border-r border-hairline p-4"><strong className="font-display text-2xl text-signal">1</strong><span className="mt-1 block font-mono text-[9px] uppercase text-muted">brief</span></div>
              <div className="border-r border-hairline p-4"><strong className="font-display text-2xl text-signal">5</strong><span className="mt-1 block font-mono text-[9px] uppercase text-muted">posts</span></div>
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
    <section className="border-b border-hairline-soft py-20 md:py-28">
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
    ["Writes and renders social content", "Separate tools", "—", "✓"],
    ["Multi-brand approval queue", "—", "—", "✓"],
    ["Publishes or hands off to a scheduler", "—", "—", "✓"],
  ];
  return (
    <section id="comparison" className="scroll-mt-20 border-b border-hairline-soft py-20 md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead eyebrow="Where Brandrail fits" title="Design tools create. Schedulers distribute. Brandrail runs the production line between them." body="Keep the tools you already like. Brandrail turns the brand into enforceable rules, creates the assets, and gives you one place to approve them." />
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
      items: ["50 cloud renders / month", "5 generative renders", "URL-to-BrandSpec compiler", "Preview, restyle and export"],
      cta: "Try your brand free",
      href: "#top",
    },
    {
      name: "Studio",
      audience: "For creators and growing brands",
      price: "$49",
      suffix: "/ month",
      badge: "MOST POPULAR",
      items: ["1,000 renders / month", "100 generative renders", "3 active BrandSpecs", "AI planner + batch review", "API, MCP and CLI access"],
      cta: "Start with Studio",
      href: "/dashboard",
    },
    {
      name: "Agency",
      audience: "For teams managing clients",
      price: "$199",
      suffix: "/ month",
      items: ["10,000 renders / month", "1,000 generative renders", "25 active BrandSpecs", "Client workspaces + team access", "Multi-brand approvals + reports"],
      cta: "Start an agency pilot",
      href: "/dashboard",
    },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-hairline-soft bg-bone py-20 text-ink md:py-28">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
        <SectionHead light eyebrow="Simple plans, honest scaling" title="Start with one brand. Add horsepower when the workload earns it." body="The full product idea is available before you pay. Upgrade for more volume, more brands and the collaboration layer—not to unlock a usable result." />
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
              <div className="text-right"><strong className="font-display text-3xl">$0.02</strong><span className="block font-mono text-[10px] text-[#6A655D]">per deterministic render</span></div>
            </div>
            <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-[#514D47]">Usage-based API access with MCP, CLI and portable BrandSpecs. No editor seat required for the agents doing the work.</p>
            <a href="/agents" className="mt-5 inline-flex text-sm font-semibold underline decoration-[#A83200] underline-offset-4">Explore developer pricing →</a>
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
  ["Is Brandrail for one brand or many?", "Both. The Free and Studio plans are built for creators, founders and in-house marketers running one to three brands. Agency adds the volume, workspaces and approval layer needed to manage client accounts."],
  ["Does Brandrail replace designers or Canva?", "No. Designers still own the system, campaigns and judgment. Canva and Figma remain useful for bespoke design work; Brandrail removes repeat production and makes the rules your team defines enforceable across routine content."],
  ["How long does setup take?", "The live URL compile returns an initial BrandSpec in about 60 seconds. You can review uncertain fields, refine the rules and start rendering before connecting a scheduler or inviting a team."],
  ["What happens when the website does not contain the full brand system?", "The compiler marks low-confidence fields for review. Your team can correct colors, voice, imagery and constraints before the spec is used. Brandrail should expose uncertainty, not pretend it has taste it could not observe."],
  ["What exactly is enforced?", "The renderer checks the BrandSpec rules it can measure: typography, color roles, contrast, density, spacing, logo behavior, format dimensions, banned words and other configured limits. Human approval still owns factual accuracy and creative judgment."],
  ["Do I have to replace my scheduler?", "No. Approved assets can flow into the scheduler you already use. Bluesky and Mastodon publishing are available directly today; additional native publishing rails are rolling out separately."],
  ["Can developers and agents use it directly?", "Yes. Brandrail exposes the same portable BrandSpec and deterministic renderer through the API, MCP server and CLI, with usage-based pricing for products that do not need editor seats."],
  ["Can I leave with my data?", "Yes. BrandSpecs are portable and exportable, and the SDK, CLI, MCP server and spec format are open. Your brand system is not trapped inside a proprietary editor."],
];

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-hairline-soft py-20 md:py-28">
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
    <section className="relative overflow-hidden py-24 text-center md:py-32">
      <div className="surface-grid absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-[820px] px-5 sm:px-6">
        <span className="eyebrow text-signal">Use your real brand</span>
        <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] font-bold leading-[1.02] tracking-[-0.04em]">The fastest way to believe it is to see your next five posts.</h2>
        <p className="mx-auto mt-5 max-w-[620px] text-[17px] text-muted">Paste a public website. No signup, no card and no carefully selected demo brand.</p>
        <div className="mx-auto mt-8 max-w-[650px] text-left"><UrlBox id="final-client-url" url={url} setUrl={setUrl} onSubmit={onSubmit} /></div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline bg-panel py-12">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="/" className="font-display text-xl font-bold">brand<span className="border-b-[3px] border-signal">rail</span></a>
          <p className="mt-3 max-w-[340px] text-sm leading-relaxed text-muted">The brand-locked content engine—from brief to publish, for one brand or many.</p>
        </div>
        <div><h3 className="eyebrow text-bone">Product</h3><div className="mt-3 space-y-2 text-sm text-muted"><a className="block hover:text-bone" href="#workflow">How it works</a><a className="block hover:text-bone" href="#use-cases">Use cases</a><a className="block hover:text-bone" href="#pricing">Pricing</a><a className="block hover:text-bone" href="/dashboard">Workspace</a></div></div>
        <div><h3 className="eyebrow text-bone">Builders</h3><div className="mt-3 space-y-2 text-sm text-muted"><a className="block hover:text-bone" href="/agents">For agent builders</a><a className="block hover:text-bone" href="/docs">Documentation</a><a className="block hover:text-bone" href="https://github.com/apwn/brandrail">GitHub</a><a className="block hover:text-bone" href="/review">Review queue</a></div></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1180px] flex-col gap-2 border-t border-hairline px-5 pt-5 font-mono text-[11px] text-muted sm:flex-row sm:justify-between sm:px-6">
        <span>© Brandrail 2026 · built in public</span><span>Portable BrandSpecs · deterministic rails · human approval</span>
      </div>
    </footer>
  );
}
