import { BrandWordmark } from "./brand-wordmark";

type WorkspaceDestination = {
  href: string;
  label: string;
  id: string;
  plan?: "Studio" | "Agency";
};

const PRIMARY_DESTINATIONS: readonly WorkspaceDestination[] = [
  { id: "home", href: "/dashboard", label: "Home" },
  { id: "create", href: "/", label: "Create" },
  { id: "plan", href: "/program", label: "Plan" },
  { id: "inbox", href: "/inbox", label: "Inbox" },
  { id: "calendar", href: "/calendar", label: "Calendar", plan: "Studio" },
] as const;

const MORE_DESTINATIONS: readonly WorkspaceDestination[] = [
  { id: "brands", href: "/dashboard#brands", label: "Brands" },
  { id: "review", href: "/review", label: "Review workspace", plan: "Studio" },
  { id: "templates", href: "/templates", label: "Visual templates" },
  { id: "campaigns", href: "/campaigns", label: "Campaigns", plan: "Studio" },
  { id: "analytics", href: "/analytics", label: "Analytics", plan: "Studio" },
  { id: "runs", href: "/runs", label: "Agent runs" },
  { id: "activity", href: "/activity", label: "Activity" },
  { id: "agent", href: "/dashboard#agent", label: "Agent setup" },
  { id: "settings", href: "/settings", label: "Settings" },
  { id: "help", href: "/help", label: "Help" },
  { id: "sample", href: "/sample", label: "Guided sample" },
] as const;

type WorkspaceHeaderProps = {
  context: string;
  active?: string;
  plan?: "free" | "studio" | "agency";
};

function isLocked(destination: WorkspaceDestination, plan?: WorkspaceHeaderProps["plan"]): boolean {
  if (!destination.plan) return false;
  if (!plan) return true;
  if (destination.plan === "Agency") return plan !== "agency";
  return plan === "free";
}

function DestinationLink({ destination, active, plan, mobile = false }: {
  destination: WorkspaceDestination;
  active?: string;
  plan?: WorkspaceHeaderProps["plan"];
  mobile?: boolean;
}) {
  const selected = active === destination.id;
  const locked = isLocked(destination, plan);
  return (
    <a
      href={destination.href}
      aria-current={selected ? "page" : undefined}
      className={`${mobile ? "flex min-h-11 items-center justify-between border-b border-hairline-soft px-3 py-2 text-sm" : "inline-flex items-center gap-1.5 py-2 text-xs"} ${selected ? "text-signal" : "text-muted hover:text-bone"}`}
    >
      <span>{destination.label}</span>
      {destination.plan && <span className={`font-mono text-[8px] uppercase tracking-[.08em] ${locked ? "text-muted" : "text-green"}`}>{destination.plan}</span>}
    </a>
  );
}

/** One product-wide navigation contract. Native details keep the mobile and
 * overflow menus keyboard-accessible without adding client state. */
export function WorkspaceHeader({ context, active, plan }: WorkspaceHeaderProps) {
  return (
    <header className="relative z-40 flex min-w-0 items-center gap-3 border-b border-hairline pb-5">
      <a href="/dashboard" aria-label="Brandrail workspace home" className="shrink-0">
        <BrandWordmark size="sm" />
      </a>
      <span className="hidden border-l border-hairline pl-3 font-mono text-[9px] uppercase tracking-[.14em] text-muted sm:inline">
        {context}
      </span>

      <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Workspace navigation">
        {PRIMARY_DESTINATIONS.map((destination) => (
          <DestinationLink key={destination.id} destination={destination} active={active} plan={plan} />
        ))}
        <details className="group relative">
          <summary className="cursor-pointer list-none py-2 text-xs text-muted hover:text-bone">More <span aria-hidden>⌄</span></summary>
          <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-hairline bg-panel p-2 shadow-[8px_8px_0_#0A0A0B]">
            {MORE_DESTINATIONS.map((destination) => (
              <DestinationLink key={destination.id} destination={destination} active={active} plan={plan} mobile />
            ))}
          </div>
        </details>
      </nav>

      <details className="group relative ml-auto lg:hidden">
        <summary className="btn-ghost min-h-10 cursor-pointer list-none !px-3 !py-2 text-xs">Menu</summary>
        <nav className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[min(310px,calc(100vw-2rem))] overflow-y-auto border border-hairline bg-panel p-2 shadow-[8px_8px_0_#0A0A0B]" aria-label="Mobile workspace navigation">
          <p className="border-b border-hairline px-3 pb-2 font-mono text-[9px] uppercase tracking-[.14em] text-muted sm:hidden">{context}</p>
          {PRIMARY_DESTINATIONS.map((destination) => (
            <DestinationLink key={destination.id} destination={destination} active={active} plan={plan} mobile />
          ))}
          <p className="px-3 pb-1 pt-4 font-mono text-[8px] uppercase tracking-[.14em] text-muted">More</p>
          {MORE_DESTINATIONS.map((destination) => (
            <DestinationLink key={destination.id} destination={destination} active={active} plan={plan} mobile />
          ))}
        </nav>
      </details>
    </header>
  );
}
