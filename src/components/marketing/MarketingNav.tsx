import { useState } from 'react'
import { Link } from 'react-router'
import { Menu, X, UserRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark } from '@/components/brand/Logo'
import { ctaClass } from './styles'

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/about', label: 'About' },
  { to: '/beta', label: 'Beta' },
]

export function MarketingNav() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const loggedIn = !!user

  // When signed in, the nav makes the session obvious: a "logged in" chip + Log out, and the
  // primary button becomes "Go to Dashboard". Signed out shows "Log in / Sign up".
  const cta = loggedIn ? { label: 'Go to Dashboard', to: '/dashboard' } : { label: 'Log in / Sign up', to: '/login' }

  return (
    <header className="sticky top-0 z-30 border-b border-gold-400/15 bg-leather-900/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link to="/" aria-label="Squire home">
          <Wordmark crestClassName="w-9 h-9 text-gold-400" textClassName="text-2xl text-parchment-50" />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="font-display text-sm uppercase tracking-wider text-parchment-200/85 transition-colors hover:text-gold-300"
            >
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-gold-300" title="You're signed in">
                <UserRound size={13} /> Signed in
              </span>
              <button
                onClick={() => signOut()}
                className="font-display text-sm uppercase tracking-wider text-parchment-200/70 transition-colors hover:text-gold-300 cursor-pointer"
              >
                Log out
              </button>
            </>
          )}
          <Link to={cta.to} className={ctaClass}>{cta.label}</Link>
        </div>

        <button
          className="text-parchment-100 md:hidden cursor-pointer"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gold-400/15 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-display text-sm uppercase tracking-wider text-parchment-200/85 hover:text-gold-300"
              >
                {l.label}
              </Link>
            ))}
            {loggedIn && (
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="text-left font-display text-sm uppercase tracking-wider text-parchment-200/70 hover:text-gold-300 cursor-pointer"
              >
                Log out
              </button>
            )}
            <Link to={cta.to} onClick={() => setOpen(false)} className={`${ctaClass} text-center`}>{cta.label}</Link>
          </div>
        </div>
      )}
    </header>
  )
}
