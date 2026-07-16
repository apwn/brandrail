"use client";

import { useEffect, useRef, useState } from "react";

type Plan = "free" | "studio" | "agency";

export function CheckoutIntent({ checkout, upgraded, currentPlan, returnTo }: { checkout?: string; upgraded?: string; currentPlan: Plan; returnTo?: string }) {
  const [state, setState] = useState<"idle" | "starting" | "waiting" | "done" | "error">(upgraded ? "waiting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if ((checkout !== "studio" && checkout !== "agency") || started.current) return;
    started.current = true;
    setState("starting");
    fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: checkout, ...(returnTo ? { returnTo } : {}) }),
    }).then(async (res) => {
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Checkout is temporarily unavailable");
      location.assign(body.url);
    }).catch((e) => {
      setError((e as Error).message);
      setState("error");
    });
  }, [checkout]);

  useEffect(() => {
    if (upgraded !== "studio" && upgraded !== "agency") return;
    if (currentPlan === upgraded || (upgraded === "studio" && currentPlan === "agency")) {
      setState("done");
      if (returnTo) location.replace(returnTo);
      return;
    }
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const body = (await res.json()) as { user?: { plan?: Plan } };
      if (body.user?.plan === upgraded || (upgraded === "studio" && body.user?.plan === "agency")) {
        clearInterval(timer);
        setState("done");
        location.replace(returnTo || "/dashboard?welcome=upgraded");
      } else if (tries >= 12) {
        clearInterval(timer);
        setError("Payment succeeded, but activation is still syncing. Refresh in a moment; you will not be charged twice.");
        setState("error");
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [upgraded, currentPlan, returnTo]);

  if (checkout === "cancelled") return <Notice tone="muted">Checkout cancelled — nothing was charged. Your workspace is unchanged.</Notice>;
  if (state === "starting") return <Notice tone="signal">Opening secure checkout…</Notice>;
  if (state === "waiting") return <Notice tone="signal">Payment received. Activating your plan…</Notice>;
  if (state === "done") return <Notice tone="green">Plan active. Your new limits and workflow are ready.</Notice>;
  if (state === "error") return <Notice tone="signal">{error}</Notice>;
  return null;
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "muted" | "signal" | "green" }) {
  const color = tone === "green" ? "text-green" : tone === "signal" ? "text-signal" : "text-muted";
  return <div className="panel mt-8 px-4 py-3 text-sm"><span className={`font-mono ${color}`}>●</span> {children}</div>;
}
