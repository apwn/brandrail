/** The activation checklist: the shortest path from signup to shipped post.
 * Server-rendered from real state — it disappears once every step is done. */
export function OnboardingChecklist({
  verified,
  hasBrand,
  hasChannel,
  hasApproved,
  hasScheduled,
  canPublish,
  canReview,
}: {
  verified: boolean;
  hasBrand: boolean;
  hasChannel: boolean;
  hasApproved: boolean;
  hasScheduled: boolean;
  canPublish: boolean;
  canReview: boolean;
}) {
  const steps = [
    { done: hasBrand, label: "Compile your first brand", hint: "paste a site URL — 60 seconds", href: "/" },
    { done: verified, label: "Verify your email", hint: "one magic link — makes this workspace recoverable", href: "#account" },
    ...(canPublish ? [{ done: hasChannel, label: "Connect a channel", hint: "direct or OAuth — credentials stay encrypted", href: "#channels" }] : []),
    ...(canReview ? [{ done: hasApproved, label: "Approve your first asset", hint: "make the judgment once; the rail remembers", href: "/review" }] : []),
    ...(canPublish ? [{ done: hasScheduled, label: "Schedule your first post", hint: "place it on the calendar and let the rail ship", href: "/calendar" }] : []),
  ];
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <section className="panel p-5 mt-10 border-signal/40">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-bone">{canPublish ? "GET TO YOUR FIRST SHIPPED POST" : "FINISH YOUR BRAND FOUNDATION"}</p>
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
