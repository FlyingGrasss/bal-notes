function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-paper-deep ${className}`} />;
}

export function ProfileLoading() {
  return (
    <div className="container-shell py-10 sm:py-14" aria-busy="true" aria-label="Profil yükleniyor">
      <div className="mx-auto max-w-4xl">
        <header className="paper-card mb-8 flex items-center gap-4 p-5 sm:p-7">
          <Block className="size-15 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Block className="h-3 w-24" />
            <Block className="h-7 w-44" />
            <Block className="h-3 w-56 max-w-full rounded-full" />
          </div>
        </header>

        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <Block className="h-7 w-36" />
              <Block className="h-9 w-24 rounded-xl" />
            </div>
            <div className="space-y-3">
              {[0, 1].map((item) => (
                <article key={item} className="paper-card p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex gap-2">
                        <Block className="h-6 w-20 rounded-full" />
                        <Block className="h-6 w-32 rounded-full" />
                      </div>
                      <Block className="h-6 w-2/3" />
                      <Block className="h-3 w-40 rounded-full" />
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Block className="h-9 w-16 rounded-xl" />
                      <Block className="h-9 w-20 rounded-xl" />
                      <Block className="h-9 w-20 rounded-xl" />
                      <Block className="size-9 rounded-xl" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <Block className="h-7 w-48" />
            </div>
            <div className="space-y-3">
              <article className="paper-card p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1 space-y-3">
                    <Block className="h-6 w-20 rounded-full" />
                    <Block className="h-7 w-4/5" />
                    <Block className="h-3 w-64 max-w-full rounded-full" />
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Block className="h-9 w-20 rounded-xl" />
                    <Block className="size-9 rounded-xl" />
                  </div>
                </div>
              </article>
            </div>
          </section>

          <div className="border-t border-line pt-6">
            <Block className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
