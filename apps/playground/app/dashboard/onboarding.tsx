/** The activation checklist: the shortest path from signup to shipped post.
 * Server-rendered from real state — it disappears once every step is done. */
export function OnboardingChecklist({
  verified,
  hasBrand,
  hasRender,
  firstBrand,
  hasAgent,
  hasAgentRun,
  hasChannel,
  hasApproved,
  hasScheduled,
  canPublish,
  canReview,
  canProgram,
  hasProgram,
}: {
  verified: boolean;
  hasBrand: boolean;
  hasRender: boolean;
  firstBrand?: string;
  hasAgent: boolean;
  hasAgentRun: boolean;
  hasChannel: boolean;
  hasApproved: boolean;
  hasScheduled: boolean;
  canPublish: boolean;
  canReview: boolean;
  canProgram: boolean;
  hasProgram: boolean;
}) {
  const steps = [
    { done: verified, label: "Verify your email", hint: "one magic link — makes this workspace recoverable", href: "#account" },
    { done: hasBrand, label: "Compile your first brand", hint: "give the agent enforceable context", href: "/" },
    { done: hasRender, label: "Create your first asset", hint: "see the BrandSpec become finished channel-ready output", href: firstBrand ? `/?brand=${encodeURIComponent(firstBrand)}` : "/" },
    { done: hasAgent, label: "Connect your agent", hint: "one hosted MCP connection", href: "#agent" },
    { done: hasAgentRun, label: "Run your first dry plan", hint: "ask the agent what it would do before it mutates", href: "#agent" },
    ...(canPublish ? [{ done: hasChannel, label: "Connect a channel", hint: "direct or OAuth — credentials stay encrypted", href: "#channels" }] : []),
    ...(canProgram ? [{ done: hasProgram, label: "Plan your next 4 weeks", hint: "one outcome becomes a rolling, adaptive content program", href: "/program" }] : []),
    ...(canReview ? [{ done: hasApproved, label: "Approve your first asset", hint: "make the judgment once; the rail remembers", href: "/review" }] : []),
    ...(canPublish ? [{ done: hasScheduled, label: "Schedule your first post", hint: "place it on the calendar and let the rail ship", href: "/calendar" }] : []),
  ];
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <section className="panel p-5 mt-10 border-signal/40">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-bone">{canPublish ? "FROM BRAND SYSTEM TO FIRST SHIPPED POST" : "ACTIVATE YOUR BRAND SYSTEM"}</p>
        <span className="font-mono text-[11px] text-muted">{steps.length - remaining}/{steps.length}</span>
      </div>
      <ol className="mt-4 grid sm:grid-cols-2 gap-3">
        {steps.map((s, i) => (
          <li key={s.label}>
            <a href={s.href} className={`flex items-start gap-3 group ${s.done ? "opacity-50" : ""}`}>
              <span className={`font-mono text-sm mt-px ${s.done ? "text-green" : "text-signal"}`}>{s.done ? "✓" : `${i + 1}.`}</span>
              <span>
                <span className={`block text-sm ${s.done ? "line-through text-muted" : "text-bone group-hover:text-signal"}`}>{s.label}</span>
                <span className="block font-mono text-[11px] text-muted mt-0.5">{s.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
