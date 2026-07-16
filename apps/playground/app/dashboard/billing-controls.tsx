"use client";

import { useEffect, useState } from "react";

/** Upgrade / manage-billing controls. Checkout stays hidden until the engine
 * verifies the complete Stripe rail and its advertised monthly prices. */
export function BillingControls({ plan }: { plan: "free" | "studio" | "agency" }) {
  const [readiness, setReadiness] = useState<{ configured: boolean; verified: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/config")
      .then((r) => r.json())
      .then((d) => setReadiness({ configured: Boolean(d.configured), verified: Boolean(d.verified) }))
      .catch(() => setReadiness({ configured: false, verified: false }));
  }, []);

  async function go(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "billing error");
      window.location.href = data.url; // to Stripe (or the portal)
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (readiness === null) return null;
  if (!readiness.verified) {
    return (
      <p className="font-mono text-[11px] text-muted mt-3">
        {readiness.configured
          ? "Billing is paused until the Stripe prices match $49 Studio and $199 Agency monthly."
          : "Billing isn’t enabled on this instance — add Stripe keys, prices and the webhook secret to accept upgrades."}
      </p>
    );
  }

  return (
    <div className="mt-3">
      {plan === "free" ? (
        <div className="flex flex-wrap gap-2">
          <button className="btn !py-2 !px-3 text-xs" onClick={() => go("/api/billing/checkout", { plan: "studio" })} disabled={busy}>
            Upgrade to Studio · $49
          </button>
          <button className="btn-ghost !py-2 !px-3 text-xs" onClick={() => go("/api/billing/checkout", { plan: "agency" })} disabled={busy}>
            Agency · $199
          </button>
        </div>
      ) : (
        <button className="btn-ghost !py-2 !px-3 text-xs" onClick={() => go("/api/billing/portal")} disabled={busy}>
          Manage billing →
        </button>
      )}
      {error && <p className="text-signal font-mono text-[11px] mt-2">{error}</p>}
    </div>
  );
}
