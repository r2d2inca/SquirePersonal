/** Compact dark hero for secondary marketing pages (About/Features/Beta). */
export function MarketingPageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #2a1f13, #0f0d0a 70%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(230,184,53,.14), transparent 60%)' }} />
      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="mkt-rise font-mono text-xs uppercase tracking-[0.42em] text-gold-400">{eyebrow}</p>
        <h1 className="mkt-rise mt-3 font-display text-4xl text-parchment-50 sm:text-6xl" style={{ animationDelay: '.08s' }}>{title}</h1>
        {subtitle && (
          <p className="mkt-rise mx-auto mt-4 max-w-xl text-lg leading-relaxed text-parchment-200/90" style={{ animationDelay: '.16s' }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
