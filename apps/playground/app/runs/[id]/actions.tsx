"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  runId: string;
  status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled";
  currentStep: string;
  batchId?: string;
  reviewReady?: boolean;
};

export function AgentRunActions({ runId, status, currentStep, batchId, reviewReady }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function mutate(action: "input" | "retry" | "cancel" | "sync-review", body?: Record<string, unknown>) {
    if (action === "cancel" && !window.confirm("Cancel this run? Queued deliveries will be cancelled. Finished assets and posts already published will remain.")) return;
    setPending(action);
    setError("");
    try {
      const response = await fetch(`/api/agent/runs/${encodeURIComponent(runId)}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The run could not be updated.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The run could not be updated.");
    } finally {
      setPending(null);
    }
  }

  const active = !["completed", "failed", "cancelled"].includes(status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStep === "confirm_plan" && status === "input_required" && (
        <button className="btn !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("input", { input: { approved: true } })}>
          {pending === "input" ? "Continuing…" : "Approve plan & continue →"}
        </button>
      )}
      {["human_review", "resolve_review_flags"].includes(currentStep) && batchId && (
        <a href={`/review?batch=${encodeURIComponent(batchId)}`} className="btn !px-4 !py-2 text-xs">Open review queue →</a>
      )}
      {["human_review", "resolve_review_flags"].includes(currentStep) && batchId && reviewReady && (
        <button className="btn-ghost !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("sync-review", { batchId })}>
          {pending === "sync-review" ? "Checking…" : "Continue approved run"}
        </button>
      )}
      {currentStep === "scheduled" && <a href="/calendar" className="btn !px-4 !py-2 text-xs">Open delivery calendar →</a>}
      {["failed", "cancelled"].includes(status) && (
        <button className="btn-ghost !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("retry")}>
          {pending === "retry" ? "Retrying…" : "Retry run"}
        </button>
      )}
      {active && (
        <button className="btn-ghost !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("cancel")}>
          {pending === "cancel" ? "Cancelling…" : "Cancel run"}
        </button>
      )}
      {error && <p className="w-full font-mono text-[10px] text-signal" role="alert">{error}</p>}
    </div>
  );
}
