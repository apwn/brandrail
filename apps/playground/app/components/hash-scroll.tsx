"use client";

import { useEffect } from "react";

/** Re-apply deep-link positioning after fonts and hydration settle. */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const scroll = () => document.getElementById(hash)?.scrollIntoView();
    const timers = [0, 250, 750].map((delay) => window.setTimeout(scroll, delay));
    void document.fonts.ready.then(() => window.requestAnimationFrame(scroll));

    return () => timers.forEach(window.clearTimeout);
  }, []);

  return null;
}
