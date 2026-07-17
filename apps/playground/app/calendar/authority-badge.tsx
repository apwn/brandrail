type DeliverySource = "human-approved" | "manual" | "agent-confirmed" | "autopilot";

const AUTHORITY_COPY: Record<DeliverySource, { label: string; title: string; body: string; tone: string }> = {
  "human-approved": {
    label: "HUMAN APPROVAL",
    title: "Approved before scheduling",
    body: "This calendar item is attached to an exact review decision.",
    tone: "border-green/50 bg-green/10 text-green",
  },
  manual: {
    label: "MANUAL SCHEDULE",
    title: "Scheduled by a workspace owner",
    body: "The owner made the publishing decision directly in the product.",
    tone: "border-hairline bg-ink/40 text-bone",
  },
  "agent-confirmed": {
    label: "LEGACY AGENT AUTHORITY",
    title: "Scheduled under the previous confirmation policy",
    body: "New agent deliveries require an exact human review decision. This historical item predates that gate.",
    tone: "border-signal/50 bg-signal/10 text-signal",
  },
  autopilot: {
    label: "AUTOPILOT AUTHORITY",
    title: "Scheduled under workspace trust",
    body: "The workspace owner enabled automatic scheduling for this cadence.",
    tone: "border-signal/50 bg-signal/10 text-signal",
  },
};

export function AuthorityBadge({ source, approval }: { source?: DeliverySource; approval?: { batchId: string; itemId: string } }) {
  if (!source) {
    return (
      <div className="mt-4 border border-hairline bg-ink/40 p-3">
        <p className="font-mono text-[9px] tracking-[.15em] text-muted">ORIGIN UNRECORDED</p>
        <p className="mt-1 text-xs text-muted">This item predates delivery provenance tracking.</p>
      </div>
    );
  }
  const copy = AUTHORITY_COPY[source];
  return (
    <div className={`mt-4 border p-3 ${copy.tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] tracking-[.15em]">{copy.label}</p>
        {approval && <a className="font-mono text-[9px] underline underline-offset-2 hover:text-bone" href={`/review?batch=${encodeURIComponent(approval.batchId)}`}>OPEN DECISION →</a>}
      </div>
      <p className="mt-2 text-sm font-semibold text-bone">{copy.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{copy.body}</p>
      {approval && <p className="mt-2 truncate font-mono text-[9px] text-muted">{approval.batchId} · {approval.itemId}</p>}
    </div>
  );
}
