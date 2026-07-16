import { BrandWordmark } from "./brand-wordmark";

type NavLink = {
  href: string;
  label: string;
};

type PublicNavProps = {
  context?: string;
  links: readonly NavLink[];
  ctaHref?: string;
  ctaLabel?: string;
  mobileLink?: NavLink;
};

export function PublicNav({
  context,
  links,
  ctaHref = "/login?agent=1",
  ctaLabel = "Connect your agent",
  mobileLink,
}: PublicNavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-ink/95 backdrop-blur" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-5 sm:px-6">
        <a
          href="/"
          aria-label="Brandrail home"
          className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
        >
          <BrandWordmark />
        </a>
        {context && (
          <span className="hidden border-l border-hairline pl-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted sm:inline">
            {context}
          </span>
        )}
        <div className="ml-auto hidden items-center gap-6 text-sm text-muted lg:flex">
          {links.map((link) => (
            <a key={`${link.href}-${link.label}`} href={link.href} className="transition-colors hover:text-bone">
              {link.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 lg:ml-2">
          {mobileLink && (
            <a href={mobileLink.href} className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-bone lg:hidden">
              {mobileLink.label}
            </a>
          )}
          <a href="/login" className="hidden text-sm text-muted transition-colors hover:text-bone sm:inline">
            Log in
          </a>
          <a href={ctaHref} className="btn min-h-10 !px-3.5 !py-2 !text-xs sm:!px-4">
            {ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
