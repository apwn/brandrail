export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-6" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-center justify-between border-b border-hairline pb-5">
        <span className="h-5 w-28 animate-pulse bg-hairline" />
        <span className="h-9 w-16 animate-pulse border border-hairline" />
      </div>
      <section className="mt-10 max-w-3xl">
        <p className="eyebrow text-signal">LOADING WORKSPACE</p>
        <div className="mt-4 h-10 w-3/4 animate-pulse bg-hairline" />
        <div className="mt-4 h-4 w-full animate-pulse bg-hairline/70" />
        <div className="mt-2 h-4 w-2/3 animate-pulse bg-hairline/70" />
      </section>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="panel h-40 animate-pulse" />)}
      </div>
    </main>
  );
}
