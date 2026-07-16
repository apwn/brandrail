"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MarketingLanding } from "./marketing";

const Playground = dynamic(() => import("./playground-client"), {
  loading: () => <main className="mx-auto max-w-5xl px-6 py-16 font-mono text-sm text-muted">Opening the creation studio…</main>,
});

export function LandingClient() {
  const [url, setUrl] = useState("");
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [openExisting, setOpenExisting] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("brand")) setOpenExisting(true);
  }, []);

  if (launchUrl !== null) return <Playground initialUrl={launchUrl} />;
  if (openExisting) return <Playground />;
  return <MarketingLanding url={url} setUrl={setUrl} onSubmit={() => { if (url.trim()) setLaunchUrl(url.trim()); }} error={null} />;
}
