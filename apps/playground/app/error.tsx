"use client";

import { useEffect } from "react";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">
      <section className="panel w-full max-w-xl p-7 sm:p-9" role="alert">
        <p className="eyebrow text-signal">THIS VIEW DIDN&apos;T LOAD</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Your work is still safe.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">The service could not load this screen. Try it again; if the problem continues, return to the workspace and open the area once more.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={reset}>Try again →</button>
          <a className="btn-ghost" href="/dashboard">Workspace home</a>
          <a className="btn-ghost" href="/help">Product help</a>
        </div>
        {error.digest && <p className="mt-5 font-mono text-[9px] text-muted">REFERENCE · {error.digest}</p>}
      </section>
    </main>
  );
}
