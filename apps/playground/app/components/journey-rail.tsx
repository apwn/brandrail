type JourneyStep = {
  id: "brand" | "plan" | "review" | "schedule" | "learn";
  label: string;
  href: string;
};

const JOURNEY_STEPS: readonly JourneyStep[] = [
  { id: "brand", label: "Brand", href: "/dashboard#brands" },
  { id: "plan", label: "Plan", href: "/program" },
  { id: "review", label: "Review", href: "/inbox" },
  { id: "schedule", label: "Schedule", href: "/calendar" },
  { id: "learn", label: "Learn", href: "/analytics" },
] as const;

export function JourneyRail({ active, completed = [] }: {
  active?: JourneyStep["id"];
  completed?: JourneyStep["id"][];
}) {
  return (
    <nav className="mt-5 border border-hairline bg-panel" aria-label="Core Brandrail workflow">
      <ol className="grid grid-cols-5">
        {JOURNEY_STEPS.map((step, index) => {
          const done = completed.includes(step.id);
          const current = active === step.id;
          return (
            <li key={step.id} className="min-w-0 border-r border-hairline last:border-0">
              <a
                href={step.href}
                aria-current={current ? "step" : undefined}
                className={`block min-h-14 px-2 py-3 text-center transition-colors sm:min-h-16 sm:px-4 ${current ? "bg-signal text-ink" : "hover:bg-white/[.025]"}`}
              >
                <span className={`block font-mono text-[8px] sm:text-[9px] ${current ? "text-ink/70" : done ? "text-green" : "text-muted"}`}>
                  {done ? "✓" : String(index + 1).padStart(2, "0")}
                </span>
                <span className={`mt-1 block truncate text-[10px] sm:text-xs ${current ? "font-semibold text-ink" : "text-bone"}`}>{step.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
