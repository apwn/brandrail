"use client";

import { useEffect, useState } from "react";

/**
 * The Brandrail front door — one page, two funnels (agencies / agent builders)
 * behind a hero toggle. The hero URL input runs the *real* compiler: paste a
 * site, see your actual next 5 posts. The site is the product demo — one accent,
 * a rail motif, and zero gradients (except the quarantined "slop" exhibit).
 */
export function MarketingLanding({
  url,
  setUrl,
  onSubmit,
  error,
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const [mode, setMode] = useState<"agency" | "dev">("agency");
  const dev = mode === "dev";

  const sections = dev
    ? ["who", "how", "engine", "agents", "oss", "pricing", "proof", "faq"]
    : ["math", "how", "engine", "stack", "guarantee", "pricing", "cohort", "proof", "agents", "oss", "faq"];

  return (
    <div className="min-h-screen">
      <Announce />
      <Nav />
      <Hero mode={mode} setMode={setMode} url={url} setUrl={setUrl} onSubmit={onSubmit} error={error} />
      <Ticker />
      <main className="flex flex-col">
        {sections.map((s) => (
          <Section key={s} id={s} mode={mode} />
        ))}
      </main>
      <FinalCta dev={dev} url={url} setUrl={setUrl} onSubmit={onSubmit} />
      <FooterLarge />
    </div>
  );
}

/* ------------------------------------------------------------------ chrome */
function Announce() {
  return (
    <div className="bg-panel border-b border-hairline text-center py-2.5 px-4 font-mono text-[12.5px] text-muted">
      Now live — URL → BrandSpec → 5 on-brand posts, deterministic. Batch review shipped.{" "}
      <a href="#top" className="text-signal font-medium">try it →</a>
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-ink/90 backdrop-blur border-b-2 border-hairline">
      <div className="mx-auto max-w-[1160px] px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-display font-bold text-xl tracking-tight">
          brand<span className="border-b-[3px] border-signal pb-px">rail</span>
        </a>
        <div className="hidden md:flex gap-7 text-sm text-muted">
          <a href="#engine" className="hover:text-bone">Product</a>
          <a href="#agents" className="hover:text-bone">Agents</a>
          <a href="#oss" className="hover:text-bone">Open Source</a>
          <a href="#pricing" className="hover:text-bone">Pricing</a>
          <a href="/review" className="hover:text-bone">Review</a>
          <a href="/dashboard" className="hover:text-bone">Workspace</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/brandrail" className="font-mono text-[13px] border border-hairline px-3.5 py-2 text-muted hover:text-bone hover:border-bone">GitHub ★</a>
          <a href="#top" className="btn !py-2 !px-4 !text-[13px]">Get started — free</a>
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------- hero */
function Hero({
  mode,
  setMode,
  url,
  setUrl,
  onSubmit,
  error,
}: {
  mode: "agency" | "dev";
  setMode: (m: "agency" | "dev") => void;
  url: string;
  setUrl: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const dev = mode === "dev";
  return (
    <header id="top" className="relative border-b border-hairline-soft py-10 md:py-12 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(90deg,#1E1E21 0 1px,transparent 1px 96px)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1160px] px-6 grid lg:grid-cols-[1.05fr_.95fr] gap-x-16 gap-y-8 items-center">
        <div>
          <div className="flex w-max border border-hairline mb-5">
            {(["agency", "dev"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`font-mono text-xs uppercase tracking-[0.1em] px-5 py-3 transition-colors duration-mech ${
                  mode === m ? "bg-signal text-ink font-medium" : "text-muted hover:text-bone"
                }`}
              >
                {m === "agency" ? "I run brands" : "I build agents"}
              </button>
            ))}
          </div>

          {dev ? (
            <>
              <span className="eyebrow text-signal">Open source · MCP-native · self-hostable</span>
              <h1 className="font-display font-bold tracking-tight leading-[1.05] text-[clamp(36px,4.4vw,54px)] mt-3 mb-4">
                AI can think.
                <br />
                It still can&rsquo;t <span className="text-signal">design.</span>
              </h1>
              <p className="text-muted text-[17px] leading-relaxed max-w-[540px] mb-5">
                Brandrail teaches AI how your brand thinks visually. Compile a <b className="text-bone">BrandSpec</b>, and any
                agent — <b className="text-bone">Claude, OpenClaw, ChatGPT, Codex, n8n</b> — renders designer-quality assets
                through it, deterministically. Nothing ships off-brand. Ever.
              </p>
            </>
          ) : (
            <>
              <span className="eyebrow text-signal">Every client · on-brand · on autopilot</span>
              <h1 className="font-display font-bold tracking-tight leading-[1.05] text-[clamp(36px,4.4vw,54px)] mt-3 mb-4">
                10× the content.
                <br />
                Zero brand drift.
                <br />
                <span className="text-signal">Zero new hires.</span>
              </h1>
              <p className="text-muted text-[17px] leading-relaxed max-w-[540px] mb-5">
                Brandrail is your agency&rsquo;s content production line: compile each client&rsquo;s brand once, then any brief
                becomes on-brand posts — <b className="text-bone">written in their voice, rendered to their exact spec, triaged
                in one review queue.</b> Publish through the scheduler you already use. You keep the margin your production line was eating.
              </p>
            </>
          )}

          <UrlBox url={url} setUrl={setUrl} onSubmit={onSubmit} />
          <p className="font-mono text-xs text-muted mt-3">
            <span className="text-green">Free.</span> No signup. No credit card. 60 seconds —{" "}
            <b className="text-bone">with their real brand.</b>{" "}
            {dev && (
              <>
                Or <a href="#oss" className="text-bone border-b border-hairline">git clone</a> and self-host.
              </>
            )}
          </p>
          {error && <p className="font-mono text-sm text-signal mt-3">ERR {error}</p>}
        </div>

        <BeforeAfterDemo />
      </div>

      <div className="mx-auto max-w-[1160px] px-6 mt-9">
        <div className="flex flex-wrap gap-x-6 gap-y-2.5 font-mono text-xs text-[#6D6961] items-center">
          {["Instagram", "LinkedIn", "TikTok", "Threads", "Bluesky", "Pinterest", "Facebook", "YouTube", "Mastodon", "X (BYOK)"].map((c) => (
            <span key={c} className="before:content-['◇_'] before:text-signal">{c}</span>
          ))}
          <span className="text-signal">+ more</span>
        </div>
        <p className="font-mono text-[11px] text-[#5B5851] mt-2.5">
          Renders every format for each. <span className="text-signal">Bluesky publishing is live</span>; the rest publish through your scheduler while native rails roll out.
        </p>
      </div>
    </header>
  );
}

function UrlBox({ url, setUrl, onSubmit }: { url: string; setUrl: (v: string) => void; onSubmit: () => void }) {
  return (
    <div className="flex max-w-[540px] border border-hairline bg-panel">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="https://your-client.com"
        className="flex-1 bg-transparent border-0 outline-0 text-bone font-mono text-sm px-4 py-4 placeholder:text-[#5B5851]"
        aria-label="Website URL"
      />
      <button onClick={onSubmit} className="btn border-0 border-l border-signal !rounded-none whitespace-nowrap">
        See their next 5 posts →
      </button>
    </div>
  );
}

function BeforeAfterDemo() {
  const [tab, setTab] = useState<"slop" | "rail">("rail");
  // teach the interaction once: flip to slop, then back to rail
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const a = setTimeout(() => setTab("slop"), 2600);
    const b = setTimeout(() => setTab("rail"), 5200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return (
    <div className="border border-hairline bg-panel">
      <div className="flex border-b border-hairline">
        {(["slop", "rail"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 font-mono text-[12.5px] tracking-[0.12em] uppercase text-center py-3 border-r border-hairline last:border-r-0 transition-colors duration-mech ${
              tab === t ? "bg-signal text-ink font-medium" : "text-muted"
            }`}
          >
            {t === "slop" ? "Without Brandrail" : "Through Brandrail"}
          </button>
        ))}
      </div>
      <div className="p-6 min-h-[330px]">
        {tab === "slop" ? (
          <>
            {/* the quarantined exhibit — the one place a gradient is allowed, ironically */}
            <div className="p-6 rounded-[14px] text-white -rotate-[0.6deg]" style={{ background: "linear-gradient(135deg,#7b2ff7,#f107a3)" }}>
              <span className="inline-block bg-white/20 rounded-full px-3 py-0.5 text-[11px] mb-3">✨ AI Generated ✨</span>
              <h4 className="text-[19px] leading-snug mb-2.5 font-semibold">🚀 Exciting News!! We&rsquo;re SO thrilled to announce our GAME-CHANGING v2 launch!! 🎉🔥</h4>
              <p className="text-[13.5px] opacity-90">Unleash the power of synergy with our revolutionary solution!! Don&rsquo;t miss out — link in bio!! 💪✨ #blessed #hustle #gamechanger</p>
              <div className="mt-3.5 text-[11px] opacity-75">🖼️ image: businessman with 6 fingers shaking hands with robot</div>
            </div>
            <div className="font-mono text-xs mt-4 px-3.5 py-2.5 border border-dashed border-[#8a3ffc55] text-muted">
              ✕ off-palette · ✕ wrong font · ✕ emoji soup · ✕ logo mangled · brand spec: 14 violations · client: furious
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#101012] border border-hairline">
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-hairline-soft font-mono text-[11px] text-muted">
                <span>acme · carousel 1/4 · 1080×1350</span>
                <span className="text-green">✓ spec v12</span>
              </div>
              <div className="px-4 pt-6 pb-4" style={{ backgroundImage: "repeating-linear-gradient(90deg,#ffffff06 0 1px,transparent 1px 40px)" }}>
                <span className="font-mono text-[11px] tracking-[0.16em] text-signal uppercase">Product update</span>
                <h4 className="font-display text-2xl tracking-tight mt-2.5 mb-2 leading-tight">
                  v2 renders 4× faster.
                  <br />
                  Same API. Zero migration.
                </h4>
                <div className="h-0.5 bg-signal w-14 my-4" />
                <p className="text-[13.5px] text-muted max-w-[340px]">Benchmarks, changelog, and what&rsquo;s next — swipe through.</p>
              </div>
              <div className="flex justify-between font-mono text-[10.5px] text-[#5B5851] px-4 py-3 border-t border-hairline-soft">
                <span>ACME.COM</span>
                <span>02 — BENCHMARKS →</span>
              </div>
            </div>
            <div className="font-mono text-xs mt-4 px-3.5 py-2.5 border border-dashed border-green text-green">
              ✓ rendered deterministically · 0 violations · brand-locked · ready for your scheduler · client: kept
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Ticker() {
  const items = [
    ["🚀 Exciting news!!", "businessman_6fingers.png"],
    ["✨ purple gradient #4,081", '"Unleash the power of synergy"'],
    ["🔥 #hustle #blessed #grindset", "logo stretched 140%"],
    ['💪 "We’re SO thrilled to announce"', "font: whatever the model felt like"],
    ["🎉 emoji soup (13 per line)", "brand colors: approximately"],
  ];
  const row = [...items, ...items];
  return (
    <div className="bg-panel border-b border-hairline-soft overflow-hidden">
      <div className="flex gap-14 whitespace-nowrap py-4 w-max motion-safe:animate-[btick_36s_linear_infinite]">
        {row.map(([a, b], i) => (
          <span key={i} className="font-mono text-[13px] text-muted flex gap-14">
            <span>{a}</span>
            <s className="text-[#5B5851]">{b}</s>
          </span>
        ))}
      </div>
      <div className="font-mono text-xs text-signal text-center pb-3.5 pt-1 tracking-[0.14em] uppercase">
        Your clients are paying you so their feed never looks like this.
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- sections */
function SecHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="max-w-[680px] mb-14">
      <span className="eyebrow text-signal">{eyebrow}</span>
      <h2 className="font-display font-bold tracking-tight text-[clamp(30px,3.6vw,42px)] mt-3.5 mb-4 leading-tight">{title}</h2>
      {sub && <p className="text-muted text-[17px]">{sub}</p>}
    </div>
  );
}

function Section({ id, mode }: { id: string; mode: "agency" | "dev" }) {
  const dev = mode === "dev";
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <section id={id} className="py-24 border-b border-hairline-soft">
      <div className="mx-auto max-w-[1160px] px-6">{children}</div>
    </section>
  );

  if (id === "math")
    return (
      <Wrap>
        <SecHead eyebrow="The math" title="Your margin is hiding in your production line." sub="What it actually costs to keep one client's social on-brand, every day:" />
        <div className="grid md:grid-cols-4 gap-px bg-hairline border border-hairline">
          {[
            ["In-house designer", "$4,500", "/mo", "One brand at a time. Sick days. Revisions. Quits after 14 months."],
            ["Freelancers", "$150", "/post", "× 20 posts × revisions × chasing files at 11pm before the deadline."],
            ["AI tool stack", "$300", "/mo", "Generates slop your team then fixes by hand. The designer stays on payroll."],
          ].map(([h, big, unit, p]) => (
            <MathCell key={h} h={h} big={big} unit={unit} p={p} />
          ))}
          <MathCell win h="Brandrail Agency" big="$199" unit="/mo · all clients" p="10,000 renders. 25 brand specs, enforced by a machine that never gets tired or creative with your client's logo." />
        </div>
        <p className="font-mono text-[13px] text-muted mt-6">
          At 10 clients, that&rsquo;s <b className="text-bone font-medium">≈ $8/client/mo</b> for production that used to cost you{" "}
          <b className="text-bone font-medium">$450+/client/mo</b> in labor. The question isn&rsquo;t whether $199 is worth it — it&rsquo;s{" "}
          <b className="text-bone font-medium">what the old way is costing you every month you keep it.</b>
        </p>
        <div className="mt-14 border border-hairline bg-panel p-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="font-display font-bold text-2xl mb-2.5">Same team. More retainers.</h3>
            <p className="text-muted text-[15px]">Production capacity is why you say no to new clients. Remove it, and the team you already pay can carry more books — without the quality dropping on post one hundred.</p>
          </div>
          <div className="flex gap-10 justify-end font-mono text-center">
            {[["−80%", "production hours"], ["+5", "clients, same team"], ["0", "off-brand posts"]].map(([b, s]) => (
              <div key={s}>
                <b className="block font-display text-4xl text-signal font-bold">{b}</b>
                <span className="text-[11px] tracking-[0.12em] uppercase text-muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    );

  if (id === "who")
    return (
      <Wrap>
        <SecHead eyebrow="Who it's for" title="Built for the people shipping content at machine speed." />
        <div className="grid md:grid-cols-3 gap-px bg-hairline border border-hairline">
          {[
            ["01", "Agent builders", "Your OpenClaw or Claude pipeline posts daily. Make its output look like a designer did it — one MCP tool, one CLI command. Token-cheap by design."],
            ["02", "Agencies & multi-brand teams", "10–100 accounts, one enforced brand spec each. Volume without the brand drift. Client workspaces, approval rails, and white-label reports included."],
            ["03", "Automation teams", "n8n, Make, Zapier, or raw API. Trigger a branded carousel from a webhook, a CMS event, or a CI pipeline. Render → publish, one call."],
          ].map(([n, h, p]) => (
            <div key={n} className="bg-ink p-8">
              <span className="font-mono text-signal text-[13px]">{n}</span>
              <h3 className="font-display font-bold text-[19px] my-3">{h}</h3>
              <p className="text-muted text-[14.5px]">{p}</p>
            </div>
          ))}
        </div>
      </Wrap>
    );

  if (id === "how")
    return (
      <Wrap>
        <SecHead
          eyebrow="How it works"
          title="Three stations. One rail."
          sub={!dev ? "Onboard a client in 15 minutes. Then the line runs itself — you approve, it ships." : undefined}
        />
        <div className="relative grid md:grid-cols-3 gap-10 mt-16">
          <div className="hidden md:block absolute top-[7px] left-0 right-0 h-0.5 bg-hairline" aria-hidden />
          <Station
            n="1 · Compile the BrandSpec"
            body={dev
              ? "Point Brandrail at a website (Figma/Canva import coming). Out comes a BrandSpec — versioned, diffable, forkable. Not just palette and type: composition, imagery rules, voice, negative examples. Enforced, not suggested."
              : "Drop in the client's website — Brandrail extracts a BrandSpec: not just fonts and colors, but composition rules, photography style, voice, and the “never do this” list. The taste your agency gets paid for, made enforceable."}
            tag={dev ? "$ brandrail compile acme.com → brandspec v1" : "client onboarded → 15 minutes"}
          />
          <Station
            n="2 · AI writes in-brand"
            body="Every brief is drafted in the client's voice — tone, banned words, emoji limits and CTA style live in the BrandSpec and are enforced like design rules, so nothing off-voice makes it through. (Performance-driven planning is on the roadmap.)"
            tag="brief → copy · on-voice · gate-checked"
          />
          <Station
            n="3 · Batch review → ship"
            body="Every post renders pixel-perfect through the BrandSpec, then hits one keyboard-driven queue: triage many posts across many clients in minutes. Because the design layer is guaranteed, you're checking judgment — not fixing fonts. Approve, edit, or regenerate, then hand the approved set to your scheduler."
            tag="approve · edit · regenerate — by keyboard"
          />
        </div>
      </Wrap>
    );

  if (id === "engine")
    return (
      <Wrap>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="eyebrow text-signal">The engine</span>
            <h2 className="font-display font-bold tracking-tight text-[clamp(30px,3.6vw,42px)] mt-3.5 mb-4">A design system, not a slot machine.</h2>
            <ul className="mt-6">
              {(dev
                ? [
                    ["The BrandSpec is the primitive.", " Portable, versionable, diffable, forkable. MIT-licensed. A brand refresh is a PR."],
                    ["It captures taste, not just tokens.", " Composition rules, density limits, photography style, negative examples — the parts humans disagree about, schematized."],
                    ["Deterministic rendering.", " Same brief in, same quality out. Generative AI only inside fenced zones."],
                    ["Auto-adapt.", " One piece → every aspect ratio and platform spec, one call."],
                    ["One spec, every asset.", " Social today. Ads, decks, thumbnails, email headers, OG images next — same engine."],
                  ]
                : [
                    ["It captures your taste, not just the logo.", " Composition, density, photo style, “never do this” — the judgment your clients pay you for, made enforceable."],
                    ["Same quality on post #1 and post #1,000.", " Deterministic rendering — not “regenerate and pray.”"],
                    ["One asset → every platform size,", " automatically. No more “can you resize this for LinkedIn?”"],
                    ["Client-proof.", " Violations physically can't render. There is no “oops” to apologize for."],
                    ["One spec, every asset.", " Social today — ads, decks, thumbnails, and email next. The BrandSpec you compile now carries all of it."],
                  ]
              ).map(([b, rest]) => (
                <li key={b} className="py-3.5 border-b border-hairline-soft text-[15px] text-muted before:content-['—'] before:text-signal before:mr-3 before:font-mono">
                  <b className="text-bone font-semibold">{b}</b>
                  {rest}
                </li>
              ))}
            </ul>
          </div>
          {dev ? <SpecJson /> : <ClientGrid />}
        </div>
      </Wrap>
    );

  if (id === "stack")
    return (
      <Wrap>
        <SecHead eyebrow="The Agency plan, stacked" title="Everything your production line needs. One line item." />
        <div className="border border-hairline">
          {[
            { h: "10,000 renders every month", p: "Finished, on-brand assets — carousels, statics, stories. Enough for 25 active clients posting daily.", val: "$15,000/mo at freelance rates" },
            { h: "25 brand specs, compiled for you", p: "Website in — enforced brand system out. Figma/Canva import coming; we compile your first 5 with you, live.", val: "$500/brand at studio rates" },
            { h: "AI planner trained on each client's numbers", p: "Reads 90 days of performance, proposes the calendar, attaches the rationale you forward to the client.", val: "your strategist's Tuesday, back", roadmap: true },
            { h: "Client workspaces + approval rails", p: "The keyboard review queue is live today. Per-client workspaces and autopilot are next.", val: "included", roadmap: true },
            { h: "White-label monthly reports", p: "The performance report you already send every month — generated, branded as your agency, done.", val: "8 hrs/mo, back", roadmap: true },
            { h: "Founding-cohort onboarding", p: "Direct line to the founders. Your feature requests jump the queue while the cohort is open.", val: "priceless, briefly" },
          ].map(({ h, p, val, roadmap }) => (
            <div key={h} className="grid grid-cols-[1fr_auto] gap-5 px-6 py-5 border-b border-hairline-soft items-center">
              <div>
                <h4 className="font-display text-[17px] font-medium flex items-center gap-2.5">
                  {h}
                  {roadmap && <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-muted border border-hairline px-1.5 py-0.5">Roadmap</span>}
                </h4>
                <p className="text-[13.5px] text-muted mt-0.5">{p}</p>
              </div>
              <span className="font-mono text-[13px] text-muted whitespace-nowrap hidden sm:block">{val}</span>
            </div>
          ))}
          <div className="bg-panel flex justify-between items-center px-6 py-6 border-t-2 border-signal">
            <span className="font-mono text-xs tracking-[0.14em] uppercase text-muted">All of it</span>
            <span className="flex items-baseline">
              <span className="font-mono text-[15px] text-[#5B5851] line-through mr-3.5">$15,500+/mo equivalent</span>
              <span className="font-display text-3xl font-bold text-signal">$199 <small className="text-[13px] font-mono text-muted font-normal">/mo</small></span>
            </span>
          </div>
        </div>
      </Wrap>
    );

  if (id === "guarantee")
    return (
      <Wrap>
        <div className="border-2 border-signal p-11 grid md:grid-cols-[auto_1fr] gap-9 items-center bg-panel">
          <div className="w-24 h-24 border-2 border-signal flex items-center justify-center font-mono text-[10px] tracking-[0.1em] text-center text-signal uppercase leading-normal">
            Slop-free
            <br />
            guarantee
            <br />
            30 days
          </div>
          <div>
            <h3 className="font-display font-bold text-2xl mb-3">Run one client on Brandrail for 30 days.</h3>
            <p className="text-muted text-[15.5px] max-w-[640px]">
              If it doesn&rsquo;t cut that client&rsquo;s production time <b className="text-bone">in half</b>, you get every cent back —{" "}
              <b className="text-bone">and you keep the compiled brand specs.</b> We take the risk, because the engine doesn&rsquo;t miss.
              No credit-card trials, no cancellation mazes, no &ldquo;contact us to cancel.&rdquo;
            </p>
          </div>
        </div>
      </Wrap>
    );

  if (id === "agents")
    return (
      <Wrap>
        <SecHead
          eyebrow="Agent-native"
          title={dev ? "Your agent already knows how to use it." : "And when you're ready — your own AI staff."}
          sub={dev
            ? "MCP server and a token-cheap CLI, from day one. Add Brandrail to any agent in 60 seconds."
            : "Brandrail speaks the same protocols as Claude, ChatGPT, and every major AI agent. If your ops team automates with n8n or Make, the whole line — plan, render, publish — runs from their existing workflows."}
        />
        <Terminal
          lines={[
            ["$", "brandrail compile acme.com"],
            ["✓ compiled", "BrandSpec v1 · palette, real fonts, photos pinned"],
            ["$", 'brandrail render "announce our v2 launch" --brand acme'],
            ["✓ rendered", "5 formats · brand spec v1 · 0 violations → ./assets"],
          ]}
          cursor
        />
        <div className="flex gap-6 flex-wrap mt-8 font-mono text-[13px] text-muted">
          {["Claude", "OpenClaw", "ChatGPT", "Codex", "Cursor", "n8n", "Make"].map((a) => (
            <span key={a} className="border border-hairline px-4 py-2">{a}</span>
          ))}
        </div>
      </Wrap>
    );

  if (id === "oss")
    return (
      <Wrap>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="eyebrow text-signal">Open source</span>
            <h2 className="font-display font-bold tracking-tight text-[clamp(30px,3.6vw,42px)] mt-3.5 mb-4">
              {dev ? "Self-host the rails. Own your keys." : "Open source. Because trust is the product."}
            </h2>
            <ul className="mt-6">
              {(dev
                ? [
                    ["MIT edges.", " The SDK, CLI, MCP server, and the BrandSpec format are MIT — embed them anywhere, zero license friction. (Publishing rails land as the AGPL core.)"],
                    ["BYOK.", " Your model keys, your data. Point the engine at OpenRouter or any OpenAI-compatible gateway; when publishing ships, X posting is your own key with the cost shown first."],
                    ["The BrandSpec is portable.", " Compile it, diff it, fork it, export it. Your brand's taste isn't locked in a vendor's database."],
                    ["Built in public.", " Open metrics, public roadmap, changelog that never sleeps."],
                  ]
                : [
                    ["The code is public.", " 2,800+ developers star, audit, and improve it. Your clients' data isn't a black box."],
                    ["No lock-in.", " Your templates and brand specs export in an open format. Leave anytime, take everything."],
                    ["Your keys, your accounts.", " Client credentials stay under your control — never resold, never pooled."],
                    ["Built in public.", " Revenue, roadmap, and changelog are open. You can see we'll be here next year."],
                  ]
              ).map(([b, rest]) => (
                <li key={b} className="py-3.5 border-b border-hairline-soft text-[15px] text-muted before:content-['—'] before:text-signal before:mr-3 before:font-mono">
                  <b className="text-bone font-semibold">{b}</b>
                  {rest}
                </li>
              ))}
            </ul>
          </div>
          {dev ? (
            <Terminal
              lines={[
                ["$", "npm i -g @brandrail/cli"],
                ["$", "brandrail compile acme.com && brandrail render 'summer sale' --brand acme"],
                ["✓ rendered", "5 formats · 0 violations · ./assets"],
                ["$", "npx @brandrail/mcp   # MCP server — point your agent here"],
              ]}
            />
          ) : (
            <div className="border border-hairline bg-panel p-8">
              <div className="eyebrow text-signal mb-4">Why this matters to your clients</div>
              <p className="text-muted text-[15px] leading-relaxed">
                When a client asks <b className="text-bone">&ldquo;where does our data live?&rdquo;</b> — you have a better answer than any
                closed tool can give: open code, exportable everything, credentials you control. For enterprise clients with procurement
                checklists, that answer wins deals.
              </p>
            </div>
          )}
        </div>
      </Wrap>
    );

  if (id === "pricing")
    return (
      <Wrap>
        <SecHead eyebrow="Pricing" title="Priced on output. Not seats, not posts, not tricks." />
        <div className="grid md:grid-cols-4 gap-px bg-hairline border border-hairline">
          <Plan name="Open source" price="$0" unit="self-hosted" items={["Full rails + agent framework", "50 cloud renders/mo", "Community templates", "Your own keys"]} cta="git clone →" />
          <Plan name="Studio" price="$49" unit="/mo" items={["1,000 renders/mo", "3 brands · 10 channels", "Full AI planning loop", "MCP + CLI + API"]} cta="Start free →" />
          <Plan hot name="Agency" price="$199" unit="/mo" items={["10,000 renders/mo", "25 brands · client workspaces", "Approval rails · white-label reports", "30-day slop-free guarantee"]} cta="Start free →" />
          <Plan name="Rail" price="$0.02" unit="/render" items={["Pure API / MCP access", "Usage-based, volume discounts", "For agent builders & platforms", "99.9% SLA available"]} cta="Read the docs →" />
        </div>
        <p className="font-mono text-[12.5px] text-muted mt-6">
          <b className="text-green font-medium">✓ 30-day money-back guarantee on Agency.</b> No credit-card trials. No cancellation mazes.
          We read our competitors&rsquo; Trustpilot pages so you don&rsquo;t have to.
        </p>
      </Wrap>
    );

  if (id === "cohort")
    return (
      <Wrap>
        <div className="bg-panel border border-hairline p-10 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <span className="eyebrow text-signal">Founding agency cohort</span>
            <h3 className="font-display font-bold text-2xl mt-3 mb-2.5">20 agencies. Locked pricing. Forever.</h3>
            <p className="text-muted text-[15px] max-w-[560px]">
              The first 20 agencies get Agency-tier pricing locked for life, white-glove onboarding of their first 5 clients, and a direct
              line to the founders — because your workflow requests become the roadmap. When the slots are gone, they&rsquo;re gone; the price isn&rsquo;t.
            </p>
          </div>
          <div className="font-mono text-center">
            <b className="block font-display text-[52px] text-signal font-bold leading-none">7</b>
            <span className="text-[11px] tracking-[0.14em] uppercase text-muted">slots left</span>
            <div className="flex gap-[3px] mt-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <i key={i} className={`w-2.5 h-3.5 ${i < 13 ? "bg-hairline" : "bg-signal"}`} />
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    );

  if (id === "proof")
    return (
      <Wrap>
        <SecHead eyebrow="Wall of proof" title="These were rendered by Brandrail." sub="Real output from the engine on this page — no stock photos, no AI illustration, no human touch-ups." />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { src: "/proof/carousel.png", label: "IG carousel · slide 1/4" },
            { src: "/proof/og-image.png", label: "OG image · 1200×630" },
            { src: "/proof/x-graphic.png", label: "X graphic · 1600×900" },
          ].map(({ src, label }) => (
            <div key={label} className="border border-hairline bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={label} className="w-full aspect-[4/3] object-cover object-top border-b border-hairline-soft" />
              <div className="font-mono text-[10.5px] text-[#6D6961] px-3.5 py-2.5">
                {label} · <b className="text-signal font-normal">0 violations · 0 humans</b>
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    );

  if (id === "faq")
    return (
      <Wrap>
        <SecHead eyebrow="FAQ" title="The questions you're already asking." />
        <div>
          {(dev ? DEV_FAQ : AGENCY_FAQ).map(([q, a]) => (
            <details key={q} className="border-b border-hairline-soft group">
              <summary className="cursor-pointer list-none font-display text-lg font-medium py-5.5 py-5 flex justify-between items-center">
                {q}
                <span className="font-mono text-signal text-xl group-open:hidden">+</span>
                <span className="font-mono text-signal text-xl hidden group-open:inline">–</span>
              </summary>
              <p className="text-muted text-[15px] pb-5 max-w-[760px]"><Rich html={a} /></p>
            </details>
          ))}
        </div>
      </Wrap>
    );

  return null;
}

/* ------------------------------------------------------------- primitives */
/** Renders the FAQ copy's one allowed markup — <b class='text-bone'>…</b> —
 * as real elements. No raw HTML injection: the string is split, only the exact
 * bold pattern becomes a <b>, everything else is plain text. */
function Rich({ html }: { html: string }) {
  const parts = html.split(/(<b class='text-bone'>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<b class='text-bone'>(.*?)<\/b>$/.exec(p);
        return m ? (
          <b key={i} className="text-bone font-semibold">{m[1]}</b>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </>
  );
}

function MathCell({ h, big, unit, p, win }: { h: string; big: string; unit: string; p: string; win?: boolean }) {
  return (
    <div className={`p-7 ${win ? "bg-panel outline outline-2 -outline-offset-2 outline-signal" : "bg-ink"}`}>
      <h4 className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-muted mb-3.5">{h}</h4>
      <div className={`font-display text-3xl font-bold tracking-tight ${win ? "text-signal" : ""}`}>
        {big} <small className="text-[13px] text-muted font-mono font-normal">{unit}</small>
      </div>
      <p className="text-[13px] text-muted mt-2.5">{p}</p>
    </div>
  );
}

function Station({ n, body, tag }: { n: string; body: string; tag: string }) {
  return (
    <div className="relative pt-9 before:content-[''] before:absolute before:top-0 before:left-0 before:w-4 before:h-4 before:bg-signal">
      <h3 className="font-display font-bold text-xl mb-2.5">{n}</h3>
      <p className="text-muted text-[14.5px]">{body}</p>
      <span className="font-mono text-[11.5px] text-muted block mt-3.5">{tag}</span>
    </div>
  );
}

function SpecJson() {
  return (
    <pre className="bg-panel border border-hairline font-mono text-[12.5px] leading-[1.75] p-6 text-muted overflow-x-auto">
      <span className="text-[#5B5851]">{"// brandspec v12 · acme · forked-from: agency-master v3"}</span>
      {"\n{"}
      {"\n  "}<span className="text-bone">&quot;identity&quot;</span>: {"{ "}<span className="text-bone">&quot;signal&quot;</span>: <span className="text-signal">&quot;#FF4D00&quot;</span>, <span className="text-bone">&quot;display&quot;</span>: <span className="text-signal">&quot;Space Grotesk/700&quot;</span>, <span className="text-bone">&quot;logo.distort&quot;</span>: <span className="text-signal">false</span> {"}"},
      {"\n  "}<span className="text-bone">&quot;composition&quot;</span>: {"{ "}<span className="text-bone">&quot;grid&quot;</span>: <span className="text-signal">&quot;12col/8px&quot;</span>, <span className="text-bone">&quot;density&quot;</span>: <span className="text-signal">&quot;max 3/zone&quot;</span> {"}"},
      {"\n  "}<span className="text-bone">&quot;imagery&quot;</span>: {"{ "}<span className="text-bone">&quot;photo&quot;</span>: <span className="text-signal">&quot;natural light, no stock&quot;</span>, <span className="text-bone">&quot;aiFence&quot;</span>: <span className="text-signal">&quot;bg.mask only&quot;</span> {"}"},
      {"\n  "}<span className="text-bone">&quot;voice&quot;</span>: {"{ "}<span className="text-bone">&quot;emojiMax&quot;</span>: <span className="text-signal">1</span>, <span className="text-bone">&quot;banned&quot;</span>: [<span className="text-signal">&quot;synergy&quot;</span>, <span className="text-signal">&quot;game-changing&quot;</span>] {"}"},
      {"\n  "}<span className="text-bone">&quot;judgment&quot;</span>: {"{ "}<span className="text-bone">&quot;positive&quot;</span>: <span className="text-signal">[12 ex]</span>, <span className="text-bone">&quot;negative&quot;</span>: <span className="text-signal">[9 ex]</span> {"}"}
      {"\n}"}
      {"\n"}<span className="text-[#5B5851]">{"// diffable. forkable. a brand refresh is a PR."}</span>
      {"\n"}<span className="text-[#5B5851]">{"// violations are build errors. nothing ships off-brand."}</span>
    </pre>
  );
}

function ClientGrid() {
  const rows: Array<[string, string, string, boolean, boolean, string[]]> = [
    ["ACME", "#FF4D00", "ACME.COM", false, false, ["v2 is live", "4× faster", "Zero migration", "Changelog"]],
    ["NORDIC SPA", "#7FB5A6", "NORDICSPA.SE", true, false, ["Winter rituals", "Open late", "Gift cards", "The sauna guide"]],
    ["BOLT GYM", "#F2C230", "BOLTGYM.CO", false, true, ["No excuses", "PR week", "6am club", "Join now"]],
  ];
  return (
    <div className="border border-hairline bg-panel">
      <div className="font-mono text-[11px] text-muted px-4 py-3 border-b border-hairline-soft flex justify-between">
        <span>this week · 3 clients · 12 posts</span>
        <span className="text-green">✓ 0 violations</span>
      </div>
      {rows.map(([label, color, domain, italic, upper, titles]) => (
        <div key={label} className="grid grid-cols-[90px_repeat(4,1fr)] gap-px bg-hairline-soft">
          <div className="bg-panel font-mono text-[10.5px] text-muted flex items-center px-3.5 tracking-[0.08em]">{label}</div>
          {titles.map((t, i) => (
            <div key={i} className="bg-ink aspect-square flex flex-col justify-between p-2.5">
              <div className="h-[3px] w-3/5" style={{ background: color }} />
              <div className={`font-display font-bold text-[11px] leading-tight ${italic ? "italic font-serif font-normal" : ""} ${upper ? "uppercase" : ""}`}>{t}</div>
              <div className="font-mono text-[7.5px] text-[#5B5851]">{domain}</div>
            </div>
          ))}
        </div>
      ))}
      <div className="font-mono text-[11px] text-muted px-4 py-3 flex justify-between">
        <span>every post, every client, always on-spec</span>
        <span>approved in one queue</span>
      </div>
    </div>
  );
}

function Terminal({ lines, cursor }: { lines: Array<[string, string]>; cursor?: boolean }) {
  return (
    <div className="bg-[#0D0D0F] border border-hairline font-mono text-[13.5px] leading-loose p-6 max-w-[780px]">
      {lines.map(([label, rest], i) => {
        const ok = label.startsWith("✓");
        return (
          <div key={i}>
            <span className={ok ? "text-green" : "text-muted"}>{label}</span>{" "}
            <span className={ok ? "text-[#5B5851]" : "text-bone"}>{rest}</span>
          </div>
        );
      })}
      {cursor && (
        <div>
          <span className="text-muted">$</span>{" "}
          <span className="inline-block w-2 h-[15px] bg-signal align-[-2px] motion-safe:animate-[bblink_1s_steps(1)_infinite]" />
        </div>
      )}
    </div>
  );
}

function Plan({ name, price, unit, items, cta, hot }: { name: string; price: string; unit: string; items: string[]; cta: string; hot?: boolean }) {
  return (
    <div className={`bg-ink p-7 flex flex-col relative ${hot ? "outline outline-2 -outline-offset-2 outline-signal" : ""}`}>
      {hot && <span className="absolute -top-px -right-px bg-signal text-ink font-mono text-[9.5px] tracking-[0.1em] px-2.5 py-1">AGENCIES START HERE</span>}
      <h3 className="font-display font-bold text-[17px]">{name}</h3>
      <div className="font-display text-3xl font-bold my-3.5 mb-1">{price} <small className="text-[13px] text-muted font-mono font-normal">{unit}</small></div>
      <ul className="my-4.5 my-4 flex-1">
        {items.map((it) => (
          <li key={it} className="text-[13.5px] text-muted py-1.5 border-b border-hairline-soft">{it}</li>
        ))}
      </ul>
      <a href="#top" className={hot ? "btn justify-center" : "btn-ghost justify-center"}>{cta}</a>
    </div>
  );
}

function FinalCta({ dev, url, setUrl, onSubmit }: { dev: boolean; url: string; setUrl: (v: string) => void; onSubmit: () => void }) {
  return (
    <section className="text-center pt-28 overflow-hidden">
      <div className="mx-auto max-w-[1160px] px-6">
        <blockquote className="font-display text-[clamp(24px,3vw,34px)] font-medium max-w-[760px] mx-auto mb-10 leading-snug">
          {dev ? (
            <>AI can <span className="text-signal">think</span>. It still can&rsquo;t <span className="text-signal">design</span>.<br />Teach it how your brand thinks visually.</>
          ) : (
            <>Every month you wait costs <span className="text-signal">$450 per client</span> in production labor.<br />Seeing your next 5 posts costs <span className="text-signal">60 seconds</span>.</>
          )}
        </blockquote>
        <div className="max-w-[540px] mx-auto">
          <UrlBox url={url} setUrl={setUrl} onSubmit={onSubmit} />
        </div>
        <p className="font-mono text-xs text-muted mt-4.5 mt-4">
          Social today. Ads, decks, thumbnails, email tomorrow — <b className="text-bone">same BrandSpec, same engine.</b>
        </p>
      </div>
      <div
        className="font-display font-bold text-[clamp(90px,16vw,220px)] tracking-[-0.05em] leading-[0.9] mt-20 whitespace-nowrap select-none text-transparent"
        style={{ WebkitTextStroke: "1px #2E2E32" }}
        aria-hidden
      >
        brand<span style={{ WebkitTextStroke: "1px #FF4D00" }}>rail</span>
      </div>
    </section>
  );
}

function FooterLarge() {
  const col = (h: string, links: string[]) => (
    <div>
      <h5 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted mb-4">{h}</h5>
      {links.map((l) => (
        <a key={l} href="#" className="block text-[13.5px] text-muted py-1 hover:text-bone">{l}</a>
      ))}
    </div>
  );
  return (
    <footer className="border-t-2 border-hairline pt-16 pb-10 bg-panel">
      <div className="mx-auto max-w-[1160px] px-6 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <a className="font-display font-bold text-xl" href="/">brand<span className="border-b-[3px] border-signal pb-px">rail</span></a>
          <p className="text-[13px] text-muted mt-3 max-w-[260px]">AI can think. It still can&rsquo;t design. Brandrail teaches AI how your brand thinks visually — through an open, enforceable BrandSpec.</p>
        </div>
        {col("Agents & tools", ["MCP server", "CLI", "Brandrail × Claude", "Brandrail × OpenClaw", "Brandrail × ChatGPT", "n8n node", "Public API"])}
        {col("Resources", ["Docs", "GitHub", "For agencies", "The Slop Report", "Compare: vs Postiz", "Compare: vs Canva", "Public roadmap"])}
        {col("Company", ["Pricing", "The Manifesto", "Open metrics", "Changelog", "Terms", "Privacy"])}
      </div>
      <div className="mx-auto max-w-[1160px] px-6 flex justify-between font-mono text-[11.5px] text-[#5B5851] mt-14 pt-5.5 pt-5 border-t border-hairline-soft">
        <span>© Brandrail 2026 · AGPL-3.0 · built in public</span>
        <span className="hidden sm:inline">this page: rendered by brandrail · 0 humans · 0 slop</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------- copy */
const AGENCY_FAQ: Array<[string, string]> = [
  ["Will my clients know I use Brandrail?", "Only if you tell them. Workspaces, approval links, and monthly reports are <b class='text-bone'>white-labeled as your agency</b> on the Agency plan. Your clients see your brand doing exceptional work, faster."],
  ["How long does it take to onboard a client?", "About <b class='text-bone'>15 minutes</b>: paste their website (or connect their Canva/Figma), review the compiled brand spec, connect their channels. The first calendar proposal lands the same day."],
  ["What if the AI writes something a client wouldn't say?", "Two safety nets. The voice model is trained on <b class='text-bone'>each client's own content</b> — banned words, emoji limits, and tone rules live in the brand spec and are enforced like design rules. And nothing publishes without passing your <b class='text-bone'>approval queue</b>."],
  ["What exactly is a BrandSpec?", "A versioned, machine-readable definition of how your brand thinks visually — not just colors and fonts, but <b class='text-bone'>composition rules, photo style, voice, and negative examples</b>. It's diffable and forkable like code: keep a master spec, fork a child per client, a brand refresh is a reviewed diff. The format is open (MIT)."],
  ["How is this different from Figma or Canva?", "Figma and Canva are where humans <b class='text-bone'>design</b>. Brandrail is where brands <b class='text-bone'>produce</b>: agents render finished assets through an enforced BrandSpec, at volume, reviewed in one queue. We're upstream-friendly — compile your BrandSpec <b class='text-bone'>from</b> your existing design system rather than replacing it."],
  ["How is this different from Postiz or Buffer?", "Schedulers move content; they don't make it good. Brandrail is <b class='text-bone'>rails + brain + renderer</b>: the brand spec, the deterministic design engine, and the performance-fed planner are the parts no scheduler ships."],
];
const DEV_FAQ: Array<[string, string]> = [
  ["What exactly is a BrandSpec?", "A versioned, machine-readable definition of how a brand thinks visually — identity, composition, imagery, voice, and judgment (positive + negative examples). <b class='text-bone'>Portable, diffable, forkable, MIT-licensed.</b> A brand refresh is a PR; violations are build errors."],
  ["How is this different from AI image generators?", "Diffusion models <b class='text-bone'>approximate</b> a brand; a design system <b class='text-bone'>enforces</b> it. Generative AI is allowed only inside fenced zones — backgrounds, photography. Layout, typography, color, and logos render deterministically."],
  ["How do I add it to my agent?", "MCP server + a token-cheap CLI. Point your agent at the MCP endpoint, or call <b class='text-bone'>brandrail compile</b> / <b class='text-bone'>render</b> from any pipeline. 60 seconds to first render."],
  ["Is the self-hosted version crippled?", "No. Rails, scheduler, agent framework, MCP, and CLI are all AGPL and fully functional. The <b class='text-bone'>cloud rendering engine</b> is metered (50 free renders/mo self-hosted) because that's where the heavy compute lives."],
  ["What about X's API pricing?", "X charges per post (plus a link surcharge) as of 2026, so Brandrail uses <b class='text-bone'>bring-your-own-key for X</b>: you pay X directly, and the exact cost is shown before anything ships. Every other channel runs on managed apps."],
  ["What exactly is a “render”?", "One finished asset: a carousel counts one render per slide, a static post is one, a short video is per-10-seconds. Estimates are shown before you spend anything."],
];
