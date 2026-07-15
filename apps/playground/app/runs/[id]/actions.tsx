"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  runId: string;
  status: "planning" | "working" | "input_required" | "completed" | "failed" | "cancelled";
  currentStep: string;
  batchId?: string;
  reviewReady?: boolean;
  canReview?: boolean;
};

export function AgentRunActions({ runId, status, currentStep, batchId, reviewReady, canReview }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const active = !["completed", "failed", "cancelled"].includes(status);

  useEffect(() => {
    if (!active || pending) return;
    const timer = window.setInterval(() => router.refresh(), 12_000);
    return () => window.clearInterval(timer);
  }, [active, pending, router]);

  async function mutate(action: "input" | "retry" | "cancel" | "sync-review" | "execute-render" | "create-review" | "complete", body?: Record<string, unknown>) {
    if (action === "cancel" && !window.confirm("Cancel this run? Queued deliveries will be cancelled. Finished assets and posts already published will remain.")) return;
    setPending(action);
    setError("");
    try {
      const response = await fetch(`/api/agent/runs/${encodeURIComponent(runId)}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const result = await response.json().catch(() => ({})) as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The run could not be updated.");
      if (action === "create-review" && result.id) {
        router.push(`/review?batch=${encodeURIComponent(result.id)}`);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The run could not be updated.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStep === "confirm_plan" && status === "input_required" && (
        <button className="btn !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("input", { input: { approved: true } })}>
          {pending === "input" ? "Continuing…" : "Approve plan & continue →"}
        </button>
      )}
      {currentStep === "render" && status === "working" && (
        <button className="btn !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("execute-render")}>
          {pending === "execute-render" ? "Producing assets…" : "Produce assets →"}
        </button>
      )}
      {currentStep === "review_or_confirm" && canReview && (
        <button className="btn !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("create-review")}>
          {pending === "create-review" ? "Creating review…" : "Send to human review →"}
        </button>
      )}
      {currentStep === "review_or_confirm" && (
        <button className="btn-ghost !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("complete")}>
          {pending === "complete" ? "Finishing…" : "Accept assets & finish"}
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
      {currentStep === "publish" && (
        <button className="btn-ghost !px-4 !py-2 text-xs" disabled={Boolean(pending)} onClick={() => mutate("complete")}>
          {pending === "complete" ? "Finishing…" : "Finish without publishing"}
        </button>
      )}
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
