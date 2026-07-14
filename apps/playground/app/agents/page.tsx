export const metadata = { title: "Connect your agent · Brandrail" };

const TOOLS = [
  ["UNDERSTAND", "list_brands · compile_brand · get_brand"],
  ["PLAN", "plan_campaign · list_campaigns"],
  ["CREATE", "render_assets · create_review_batch"],
  ["PAUSE", "get_review_status"],
  ["OPERATE", "list_channels · schedule_post · list_calendar"],
  ["LEARN", "get_analytics · get_audit_log"],
];

export default function AgentsPage() {
  return (
    <main>
      <nav className="border-b border-hairline"><div className="mx-auto flex h-16 max-w-[1080px] items-center gap-3 px-6"><div className="rail w-10" aria-hidden /><a href="/" className="font-display font-bold text-lg">brandrail</a><span className="eyebrow">AGENT-NATIVE</span><a href="/docs" className="eyebrow ml-auto text-muted hover:text-bone">DOCS →</a></div></nav>
      <section className="border-b border-hairline-soft py-16 md:py-24"><div className="mx-auto grid max-w-[1080px] gap-12 px-6 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div><p className="eyebrow text-signal">THE OPERATING LAYER FOR BRANDED CONTENT</p><h1 className="mt-4 font-display text-[clamp(42px,6vw,66px)] font-bold leading-[.98] tracking-[-.045em]">Your agent can write.<br /><span className="text-signal">Now it can ship on-brand.</span></h1><p className="mt-6 max-w-[650px] text-lg leading-relaxed text-muted">Connect ChatGPT, Claude, Codex, Cursor or any MCP client. Brandrail gives it an enforceable BrandSpec, deterministic rendering, human approval pauses, publishing, and a performance loop.</p><div className="mt-8 flex flex-wrap gap-3"><a className="btn" href="/login?agent=1">Connect your agent free →</a><a className="btn-ghost" href="/#top">Try it with your website</a></div><p className="mt-4 font-mono text-[11px] text-muted">1 free connection · 14 lifecycle tools · no card</p></div>
        <div className="border border-hairline bg-panel shadow-[12px_12px_0_#0A0A0B,12px_12px_0_1px_#2E2E32]"><div className="flex items-center justify-between border-b border-hairline px-4 py-3 font-mono text-[10px] text-muted"><span>AGENT / CAMPAIGN RUN</span><span className="text-green">● CONTROLLED</span></div><div className="space-y-4 p-5 font-mono text-xs"><p className="text-bone"><span className="text-signal">you ›</span> Turn our launch brief into a five-post campaign. Get approval before anything goes live.</p>{[["01", "BrandSpec loaded", "northstar@12"], ["02", "Execution plan", "0 blockers"], ["03", "Assets rendered", "5 · 0 violations"], ["04", "Human review", "paused"], ["05", "Publish", "waiting"]].map(([n, label, status]) => <div key={n} className="grid grid-cols-[28px_1fr_auto] gap-2 border-t border-hairline-soft pt-3"><span className="text-muted">{n}</span><span>{label}</span><span className={status === "paused" || status === "waiting" ? "text-signal" : "text-green"}>{status}</span></div>)}</div><div className="border-t border-hairline px-5 py-3 font-mono text-[10px] text-muted">Nothing publishes without an approval reference or explicit confirmation.</div></div>
      </div></section>
      <section className="border-b border-hairline-soft bg-panel py-16 md:py-20"><div className="mx-auto max-w-[1080px] px-6"><p className="eyebrow text-signal">ONE REMOTE CONNECTION</p><h2 className="mt-3 font-display text-3xl font-bold">No local server. No five-tool demo.</h2><p className="mt-3 max-w-2xl text-muted">Mint one workspace key and point your agent at the hosted MCP endpoint. The same key also works with the CLI, SDK and REST API.</p><pre className="mt-7 overflow-x-auto border border-hairline bg-ink p-5 font-mono text-xs text-bone">{`{
  "mcpServers": {
    "brandrail": {
      "type": "http",
      "url": "https://playground.brandrail.dev/api/mcp",
      "headers": { "Authorization": "Bearer brk_…" }
    }
  }
}`}</pre></div></section>
      <section className="border-b border-hairline-soft py-16 md:py-20"><div className="mx-auto max-w-[1080px] px-6"><p className="eyebrow text-signal">THE FULL LOOP</p><h2 className="mt-3 font-display text-3xl font-bold">Tools organized around outcomes, not endpoints.</h2><div className="mt-8 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">{TOOLS.map(([phase, tools]) => <article key={phase} className="bg-ink p-5"><span className="font-mono text-[10px] text-signal">{phase}</span><p className="mt-3 font-mono text-xs leading-relaxed text-muted">{tools}</p></article>)}</div></div></section>
      <section className="border-b border-hairline-soft bg-bone py-16 text-ink md:py-20"><div className="mx-auto grid max-w-[1080px] gap-8 px-6 md:grid-cols-3">{[["Brand-locked", "The agent cannot improvise fonts, colors, logos or composition outside the BrandSpec."], ["Human-controlled", "Review is a resumable state, not a Slack message. Publishing requires approval or explicit confirmation."], ["Observable", "Every mutation records who did what. Signed webhooks let external orchestrators resume on real events."]].map(([title, body]) => <article key={title} className="border-t-2 border-[#A83200] pt-5"><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#514D47]">{body}</p></article>)}</div></section>
      <section className="py-20 text-center"><div className="mx-auto max-w-2xl px-6"><p className="eyebrow text-signal">START WITH THE AGENT YOU ALREADY USE</p><h2 className="mt-4 font-display text-4xl font-bold">Give it a brand. Keep the final say.</h2><p className="mt-4 text-muted">Free includes one agent connection, one active BrandSpec and 50 finished assets each month.</p><div className="mt-7 flex justify-center gap-3"><a href="/login?agent=1" className="btn">Connect free →</a><a href="https://github.com/apwn/brandrail/tree/main/skills/brandrail" className="btn-ghost">Install the skill</a></div></div></section>
    </main>
  );
}
