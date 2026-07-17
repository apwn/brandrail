"use client";

import { useEffect } from "react";
import { trackConversion } from "@/lib/conversion";

/** The activation checklist: the shortest path from signup to shipped post.
 * Its state remains server-derived; the client boundary only records a
 * privacy-light activation funnel and never includes user content. */
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
  intent,
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
  intent: "studio" | "agent";
}) {
  const accountSteps = [
    { done: verified, label: "Verify your email", hint: "one magic link — makes this workspace recoverable", href: "#account" },
    { done: hasBrand, label: "Compile your first brand", hint: "give the agent enforceable context", href: "/" },
  ];
  const agentSteps = [
    ...accountSteps,
    { done: hasAgent, label: "Verify your agent connection", hint: "create a minimal key and complete a live MCP handshake", href: "#agent" },
    { done: hasAgentRun, label: "Preview your first dry plan", hint: "inspect the exact steps before approving production", href: "/runs?new=1" },
    { done: hasRender, label: "Render one approved plan", hint: "see reversible work complete without publishing", href: "/runs" },
  ];
  const studioSteps = [
    ...accountSteps,
    { done: hasRender, label: "Create your first asset", hint: "see the BrandSpec become finished channel-ready output", href: firstBrand ? `/?brand=${encodeURIComponent(firstBrand)}` : "/" },
    ...(canProgram ? [{ done: hasProgram, label: "Plan your next 4 weeks", hint: "turn one outcome into a rolling content calendar", href: "/program" }] : []),
    ...(canReview ? [{ done: hasApproved, label: "Approve your first asset", hint: "record the decision before delivery", href: "/review" }] : []),
    ...(canPublish ? [{ done: hasChannel, label: "Connect a channel", hint: "publishing credentials stay encrypted", href: "#channels" }] : []),
    ...(canPublish ? [{ done: hasScheduled, label: "Schedule your first post", hint: "put approved work on the calendar", href: "/calendar" }] : []),
  ];
  const steps = intent === "agent" ? agentSteps : studioSteps;
  const remaining = steps.filter((s) => !s.done).length;
  const completed = steps.length - remaining;
  useEffect(() => {
    trackConversion("onboarding_checklist_viewed", { intent, completed, total: steps.length });
  }, [completed, intent, steps.length]);
  if (remaining === 0) return null;

  return (
    <section className="panel p-5 mt-10 border-signal/40">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-bone">{intent === "agent" ? "CONNECT YOUR FIRST AGENT" : canPublish ? "FROM BRAND SYSTEM TO FIRST SHIPPED POST" : "CREATE YOUR FIRST CAMPAIGN"}</p>
        <span className="font-mono text-[11px] text-muted">{completed}/{steps.length}</span>
      </div>
      <ol className="mt-4 grid sm:grid-cols-2 gap-3">
        {steps.map((s, i) => (
          <li key={s.label}>
            <a href={s.href} onClick={() => trackConversion("onboarding_step_clicked", { intent, step: i + 1, completed: s.done })} className={`flex items-start gap-3 group ${s.done ? "opacity-50" : ""}`}>
              <span className={`font-mono text-sm mt-px ${s.done ? "text-green" : "text-signal"}`}>{s.done ? "✓" : `${i + 1}.`}</span>
              <span>
                <span className={`block text-sm ${s.done ? "line-through text-muted" : "text-bone group-hover:text-signal"}`}>{s.label}</span>
                <span className="block font-mono text-[11px] text-muted mt-0.5">{s.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hairline pt-4 text-xs text-muted">
        <a href="/sample" className="text-signal hover:text-bone">See the complete sample first →</a>
        <span aria-hidden>·</span>
        {intent === "agent" ? <><span>Prefer to create here first?</span><a href="/" className="text-signal hover:text-bone">Open Create →</a></> : <><span>Want your agent to operate this workspace?</span><a href="#agent" className="text-signal hover:text-bone">Open agent setup →</a></>}
      </div>
    </section>
  );
}
