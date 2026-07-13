/**
 * The dev funnel's landing: not marketing — the actual on-ramp. A developer
 * should leave this page with a working agent integration, not a scroll anchor.
 */
export const metadata = { title: "Brandrail for agent builders" };

const STEPS: Array<{ n: string; title: string; body: React.ReactNode; code?: string }> = [
  {
    n: "01",
    title: "Get an API key",
    body: (
      <>
        Sign in (one magic link) and mint a key in{" "}
        <a href="/dashboard#api-keys" className="text-signal">your workspace → API keys</a>. The key scopes your agent to
        your brands — it&rsquo;s shown once, treat it like a password.
      </>
    ),
  },
  {
    n: "02",
    title: "Point your agent at the MCP server",
    body: <>One command for Claude Code; any MCP-capable agent takes the same server + env config.</>,
    code: `claude mcp add brandrail \\
  -e BRANDRAIL_API_URL=https://api.brandrail.dev \\
  -e BRANDRAIL_API_KEY=brk_… \\
  -- npx -y @brandrail/mcp`,
  },
  {
    n: "03",
    title: "Compile once, render forever",
    body: (
      <>
        Your agent gets five tools: <code className="text-bone">compile_brand</code>, <code className="text-bone">render_assets</code>,{" "}
        <code className="text-bone">get_spec</code>, <code className="text-bone">list_templates</code>,{" "}
        <code className="text-bone">diff_spec</code>. Violations come back as structured errors — the agent can&rsquo;t ship
        off-brand even if it tries.
      </>
    ),
    code: `> compile https://acme.com into a brand spec
✓ BrandSpec v1 · confidence 0.92 · fonts+photos pinned

> render "Summer promotion" for acme
✓ 5 assets · 0 violations · deterministic`,
  },
];

export default function AgentsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center gap-3">
        <div className="rail w-10" aria-hidden />
        <a href="/" className="font-display font-bold text-lg tracking-tight">brandrail</a>
        <span className="eyebrow mt-[2px]">FOR AGENT BUILDERS</span>
        <a href="/docs" className="eyebrow text-muted hover:text-bone ml-auto">DOCS →</a>
      </header>

      <h1 className="font-display font-bold tracking-tight leading-[1.05] text-[clamp(32px,5vw,44px)] mt-12">
        AI can think.<br />It still can&rsquo;t <span className="text-signal">design.</span>
      </h1>
      <p className="text-muted text-[16px] leading-relaxed max-w-[560px] mt-4">
        Brandrail is the design layer for your agent: compile any site into a portable, enforceable{" "}
        <b className="text-bone">BrandSpec</b>, then render assets through it deterministically. Same brief in, same
        quality out — type, color and logos never hallucinate.
      </p>

      <ol className="mt-12 flex flex-col gap-8">
        {STEPS.map((s) => (
          <li key={s.n} className="grid md:grid-cols-[52px_1fr] gap-4">
            <span className="font-mono text-signal text-sm pt-1">{s.n}</span>
            <div>
              <h2 className="font-display font-bold text-xl">{s.title}</h2>
              <p className="text-muted text-sm mt-2 leading-relaxed">{s.body}</p>
              {s.code && (
                <pre className="panel mt-3 p-4 font-mono text-[12.5px] text-bone overflow-x-auto whitespace-pre">{s.code}</pre>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="panel p-5 mt-12 border-signal/40">
        <p className="eyebrow text-bone">HONEST STATUS</p>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          The MCP server, CLI and SDK are built and tested in this repo; the npm packages publish with the first public
          release — until then, <a href="https://github.com/apwn/brandrail" className="text-signal">clone the repo</a>{" "}
          and run them from source, or self-host the whole engine (AGPL, no key needed in dev mode).
        </p>
      </div>

      <div className="flex gap-3 mt-10">
        <a className="btn" href="/dashboard#api-keys">Get your API key →</a>
        <a className="btn-ghost" href="/docs">Read the docs</a>
      </div>
    </main>
  );
}
