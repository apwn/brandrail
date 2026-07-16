"use client";

import { useEffect, useRef, useState } from "react";

type CopyCodeProps = {
  children: string;
  label?: string;
};

export function CopyCode({ children, label = "Code example" }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative mt-3 overflow-hidden border border-hairline bg-panel">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-8 px-2 text-bone transition-colors hover:text-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
      <pre className="overflow-x-auto overscroll-x-contain p-4 font-mono text-[12px] leading-relaxed text-bone sm:text-[12.5px]">
        <code>{children}</code>
      </pre>
    </div>
  );
}
