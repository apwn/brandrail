import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Brandrail" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ plan?: string; agent?: string }> }) {
  const { plan, agent } = await searchParams;
  const selected = plan === "studio" || plan === "agency" ? plan : undefined;
  const connectingAgent = agent === "1";
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden border-r border-hairline bg-panel p-12 lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="font-display text-xl font-bold">brandrail</a>
        <div className="max-w-lg">
          <div className="rail w-14 mb-7" />
          <p className="eyebrow text-signal">YOUR BRAND SYSTEM, STILL YOURS</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02]">Come back to every brand, asset and approval.</h1>
          <p className="mt-5 text-muted leading-relaxed">No password to remember. We email one secure link and bring the workspace you already started onto this device.</p>
        </div>
        <p className="font-mono text-xs text-muted">Portable BrandSpecs · recoverable workspace · no lock-in</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <a href="/" className="eyebrow hover:text-bone">← BRANDRAIL</a>
          <p className="eyebrow text-signal mt-12">{selected ? `${selected.toUpperCase()} SELECTED` : connectingAgent ? "FREE AGENT CONNECTION" : "WELCOME BACK"}</p>
          <h2 className="font-display text-4xl font-bold mt-3">{selected ? `Start with ${selected[0].toUpperCase()}${selected.slice(1)}` : connectingAgent ? "Connect your agent" : "Open your workspace"}</h2>
          <p className="text-muted mt-3">Enter your email. The link signs you in and {selected ? "continues to secure checkout" : connectingAgent ? "opens the agent connection panel" : "restores your workspace"}.</p>
          <LoginForm plan={selected} agent={connectingAgent} />
          <p className="font-mono text-[11px] text-muted mt-5">The link expires in 15 minutes and can be used once.</p>
        </div>
      </section>
    </main>
  );
}
