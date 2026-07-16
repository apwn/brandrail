import { BrandWordmark } from "./brand-wordmark";

export function WorkspaceLockup({ context, href = "/" }: { context: string; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <a href={href} aria-label="Brandrail home" className="shrink-0">
        <BrandWordmark size="sm" />
      </a>
      <span className="border-l border-hairline pl-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px]">
        {context}
      </span>
    </div>
  );
}
