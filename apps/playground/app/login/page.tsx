import { LoginForm } from "./login-form";
import { BrandWordmark } from "../components/brand-wordmark";

export const metadata = { title: "Sign in — Brandrail" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ plan?: string; agent?: string; return?: string }> }) {
  const { plan, agent, return: requestedReturn } = await searchParams;
  const selected = plan === "studio" || plan === "agency" ? plan : undefined;
  const connectingAgent = agent === "1";
  const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : undefined;
  const story = selected && returnTo === "/program"
    ? { eyebrow: "ACTIVATE THE PLAN YOU APPROVED", title: "Turn this calendar into finished content every week.", body: "Your strategy and exact 30-day preview stay with you through sign-in and checkout." }
    : selected
    ? { eyebrow: "FROM CREATION TO OPERATION", title: "Stop rebuilding the workflow every week.", body: "Your verified workspace keeps brands, assets, approvals and billing attached to one recoverable identity." }
    : connectingAgent
      ? { eyebrow: "YOUR FIRST AGENT RUN", title: "Give your agent a brand it cannot break.", body: "Create one free, scoped key. Connect the agent you already use and keep approval between its work and the publish button." }
      : { eyebrow: "YOUR BRAND SYSTEM, STILL YOURS", title: "Your brands and approvals, ready when you are.", body: "No password to remember. One secure link restores your recoverable workspace on this device." };
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden border-r border-hairline bg-panel p-12 lg:flex lg:flex-col lg:justify-between">
        <a href="/" aria-label="Brandrail home" className="inline-flex"><BrandWordmark /></a>
        <div className="max-w-lg">
          <div className="rail w-14 mb-7" />
          <p className="eyebrow text-signal">{story.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02]">{story.title}</h1>
          <p className="mt-5 text-muted leading-relaxed">{story.body}</p>
        </div>
        <p className="font-mono text-xs text-muted">Portable BrandSpecs · recoverable workspace · no lock-in</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
          <p className="eyebrow text-signal mt-12">{selected ? `${selected.toUpperCase()} SELECTED` : connectingAgent ? "FREE AGENT KEY" : "SECURE WORKSPACE"}</p>
          <h2 className="font-display text-4xl font-bold mt-3">{selected ? `Start with ${selected[0].toUpperCase()}${selected.slice(1)}` : connectingAgent ? "Connect your agent" : "Open your workspace"}</h2>
          <p className="text-muted mt-3">Enter your email. The link signs you in and {selected ? "continues to secure checkout" : connectingAgent ? "opens the agent setup panel" : "restores your workspace"}.</p>
          <LoginForm plan={selected} agent={connectingAgent} returnTo={returnTo} />
          <p className="font-mono text-[11px] text-muted mt-5">No password · no card for Free · one-use link expires in 15 minutes.</p>
        </div>
      </section>
    </main>
  );
}
