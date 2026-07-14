import { Link } from 'react-router'
import { Wordmark } from '@/components/brand/Logo'

export function MarketingFooter() {
  return (
    <footer className="border-t border-gold-400/15 bg-leather-900 px-6 py-12 text-parchment-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Wordmark crestClassName="w-9 h-9 text-gold-400" textClassName="text-2xl text-parchment-50" />
          <p className="mt-3 font-body italic text-parchment-200/80">Every hero needs a Squire.</p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          <Link to="/" className="font-display text-sm uppercase tracking-wider hover:text-gold-300">Home</Link>
          <Link to="/features" className="font-display text-sm uppercase tracking-wider hover:text-gold-300">Features</Link>
          <Link to="/about" className="font-display text-sm uppercase tracking-wider hover:text-gold-300">About</Link>
          <Link to="/beta" className="font-display text-sm uppercase tracking-wider hover:text-gold-300">Beta</Link>
          <Link to="/login" className="font-display text-sm uppercase tracking-wider hover:text-gold-300">Log in</Link>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-leather-700 pt-6 text-xs text-parchment-200/60">
        <p>© {new Date().getFullYear()} Squire. Taking the drag out of Dungeons &amp; Dragons.</p>
        <p className="mt-1">Squire is an independent companion tool and is not affiliated with or endorsed by Wizards of the Coast.</p>
      </div>
    </footer>
  )
}
