import type { ReactNode } from "react";
import { BrandWordmark } from "./brand-wordmark";

export function PublicFooter({ note }: { note?: ReactNode }) {
  return (
    <footer className="border-t border-hairline bg-panel py-10 sm:py-12">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 sm:px-6 md:grid-cols-[1.45fr_1fr_1fr]">
        <div>
          <a href="/" aria-label="Brandrail home" className="inline-flex">
            <BrandWordmark />
          </a>
          <p className="mt-4 max-w-[360px] text-sm leading-relaxed text-muted">
            The agent-native operating layer for branded content—from intent to measured campaign, with the human still in control.
          </p>
          {note && <div className="mt-4 font-mono text-[10px] leading-relaxed text-muted">{note}</div>}
        </div>
        <div>
          <h2 className="eyebrow text-bone">Product</h2>
          <div className="mt-4 space-y-2.5 text-sm text-muted">
            <a className="block hover:text-bone" href="/#how-it-works">How it works</a>
            <a className="block hover:text-bone" href="/#use-cases">Use cases</a>
            <a className="block hover:text-bone" href="/#pricing">Pricing</a>
            <a className="block hover:text-bone" href="/login">Workspace</a>
          </div>
        </div>
        <div>
          <h2 className="eyebrow text-bone">For agents</h2>
          <div className="mt-4 space-y-2.5 text-sm text-muted">
            <a className="block hover:text-bone" href="/agents">Agent platform</a>
            <a className="block hover:text-bone" href="/docs">Documentation</a>
            <a className="block hover:text-bone" href="/help">Product help</a>
            <a className="block hover:text-bone" href="https://github.com/apwn/brandrail">GitHub</a>
            <a className="block text-signal hover:text-bone" href="/login?agent=1">Connect your agent →</a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1180px] flex-col gap-2 border-t border-hairline px-5 pt-5 font-mono text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>© Brandrail 2026 · built in public</span>
        <span>Agent-operated · BrandSpec-enforced · human-controlled</span>
      </div>
    </footer>
  );
}
