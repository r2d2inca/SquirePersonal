import type { ReactNode } from 'react'
import { MarketingNav } from './MarketingNav'
import { MarketingFooter } from './MarketingFooter'

/** Public marketing shell (separate from the app's AppShell/DmShell). Fixed dark palette so the
 *  landing looks the same for everyone, independent of the in-app light/dark theme toggle. */
export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-leather-900 text-parchment-100">
      {/* Scoped marketing animations (staggered via inline animation-delay); disabled for reduced motion. */}
      <style>{`
        @keyframes mkt-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .mkt-rise { animation: mkt-rise .9s ease-out both; }
        @keyframes mkt-letter { to { opacity: 1; transform: none; } }
        .mkt-letter { display: inline-block; white-space: pre; opacity: 0; transform: translateY(10px); animation: mkt-letter .5s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .mkt-rise { animation: none; }
          .mkt-letter { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
