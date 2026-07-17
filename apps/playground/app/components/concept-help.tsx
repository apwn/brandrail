const DEFINITIONS = {
  brandspec: ["BrandSpec", "The versioned rules Brandrail extracts from your site: colors, type, logo, imagery, voice and composition constraints."],
  savedLook: ["Saved look", "A reusable choice of templates and approved imagery. New briefs get fresh copy while the visual direction stays consistent."],
  templateFamily: ["Template family", "A safe, versioned custom layout. Its editable content areas can change, while brand-critical rules remain protected."],
  dryPlan: ["Plan preview", "The exact proposed steps, allowance impact and blockers. Creating the preview records a durable run, but production and delivery remain paused."],
  planApproval: ["Plan approval", "A browser-only decision bound to this exact plan version and hash. If the plan changes or a run is retried, approval is required again."],
  durableRun: ["Durable run", "A reconnect-safe job with its own ID, plan, progress, artifacts, review state and delivery history."],
  idempotency: ["Idempotency key", "A caller-supplied retry key that makes repeated delivery requests resolve to the same calendar item instead of creating duplicates."],
  scopedKey: ["Scoped agent key", "A revocable connection that grants only the capabilities you choose. New keys can read, dry-plan and render; workflow and delivery authority are separate opt-ins."],
  approvalMode: ["Approval mode", "Review mode pauses every production week for a person. Automatic mode must be enabled explicitly and needs connected channels."],
} as const;

export type Concept = keyof typeof DEFINITIONS;

export function ConceptHelp({ concept, className = "" }: { concept: Concept; className?: string }) {
  const [label, definition] = DEFINITIONS[concept];
  return (
    <details className={`group relative inline-block align-middle ${className}`}>
      <summary className="inline-flex h-5 w-5 cursor-help list-none items-center justify-center rounded-full border border-hairline font-mono text-[9px] text-muted hover:border-signal hover:text-bone" aria-label={`What is ${label}?`}>?</summary>
      <div className="absolute left-0 top-7 z-50 w-72 border border-hairline bg-panel p-3 text-left shadow-[8px_8px_0_#0A0A0B]">
        <b className="font-display text-xs text-bone">{label}</b>
        <p className="mt-1 text-xs normal-case leading-relaxed tracking-normal text-muted">{definition}</p>
        <a href="/help#glossary" className="mt-2 inline-block font-mono text-[8px] uppercase text-signal hover:text-bone">Open glossary →</a>
      </div>
    </details>
  );
}
