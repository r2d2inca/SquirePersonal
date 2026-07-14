import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Wand2, HeartPulse, Sparkles, Users, BookOpen, Smartphone } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { Crest } from '@/components/brand/Logo'
import { IntroOverlay } from '@/components/marketing/IntroOverlay'
import { ctaClassLg, ghostClassLg } from '@/components/marketing/styles'
import { usePageMeta } from '@/hooks/usePageMeta'

const SLOGAN = 'Every hero needs a Squire.'

const FEATURES = [
  { icon: Wand2, title: 'Character builder', body: 'Guided 2024 creation — species, class, background, feats, spells, and equipment. Multiclass and homebrew supported.' },
  { icon: HeartPulse, title: 'A living character sheet', body: 'HP, AC, conditions, concentration, spell slots, inventory and magic items — all computed and always current.' },
  { icon: Sparkles, title: 'Echo, your AI assistant', body: 'Ask "what can I do right now?" Echo knows your character, your items, and the rules, and answers in plain terms.' },
  { icon: Users, title: 'Dungeon Master tools', body: 'A campaign hub, party overview, XP awards, shareable lore, and a real-time combat tracker with battle maps.' },
  { icon: BookOpen, title: 'Built for 2024 (5.5e)', body: 'Accurate to the 2024 Player’s Handbook: prepared spellcasting, updated subclasses, and current spell text.' },
  { icon: Smartphone, title: 'Anywhere you play', body: 'Install it on your phone, use it at the table, and keep going offline. Your character comes with you.' },
]

const PILLARS = [
  { title: 'For players', body: 'Build a character, then just play it. Squire keeps the numbers honest so you can stay in the scene.' },
  { title: 'For Dungeon Masters', body: 'Run your table with a campaign hub, live combat, party tracking, and lore you reveal on your terms.' },
  { title: 'Meet Echo', body: 'An AI companion that reads your sheet and the rules, so "can I do this?" gets a real answer.' },
]

export function LandingPage() {
  usePageMeta(
    'Squire — Every Hero Needs a Squire',
    'Squire is your D&D 5e (2024) companion — it builds your character, tracks every number, and keeps the rules straight, so you stay in the story.',
  )

  // First-visit intro (once per browser session): a full-screen crest + slogan animation that
  // swipes up to reveal the site. Skipped under reduced motion or if already seen this session.
  const [showIntro, setShowIntro] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced && !sessionStorage.getItem('squire_intro_seen')) {
      sessionStorage.setItem('squire_intro_seen', '1')
      setShowIntro(true)
      document.body.style.overflow = 'hidden' // lock scroll behind the overlay
    }
    return () => { document.body.style.overflow = '' }
  }, [])
  const endIntro = () => {
    setShowIntro(false)
    document.body.style.overflow = ''
  }

  return (
    <MarketingLayout>
      {showIntro && <IntroOverlay onDone={endIntro} />}
      {/* ── Hero (cinematic dark) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 28%, #2a1f13 0%, #1e160e 42%, #0f0d0a 100%)' }} />
        <div
          className="pointer-events-none absolute left-1/2 top-[10%] h-[560px] w-[560px] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(230,184,53,.28), rgba(230,184,53,0) 62%)' }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(0,0,0,.55) 100%)' }} />

        <div className="relative mx-auto flex min-h-[86vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mkt-rise mb-6" style={{ filter: 'drop-shadow(0 0 22px rgba(230,184,53,.4))' }}>
            <Crest className="h-28 w-28 text-gold-400" />
          </div>
          <p className="mkt-rise mb-4 font-mono text-xs uppercase tracking-[0.42em] text-gold-400" style={{ animationDelay: '.05s' }}>
            D&amp;D 5E · 2024 Rules
          </p>
          <h1 className="mkt-rise font-display text-5xl leading-[1.05] text-parchment-50 sm:text-7xl" style={{ animationDelay: '.1s' }}>
            {SLOGAN}
          </h1>
          <p className="mkt-rise mt-6 max-w-xl text-lg leading-relaxed text-parchment-200/90" style={{ animationDelay: '.26s' }}>
            Squire builds your character, tracks every number, and keeps the rules straight — so you stay in the
            story. Fully updated for the 2024 ruleset.
          </p>
          <div className="mkt-rise mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: '.34s' }}>
            <Link to="/login" className={ctaClassLg}>Log in / Sign up</Link>
            <a href="#features" className={ghostClassLg}>See what it does</a>
          </div>
        </div>
      </section>

      {/* ── What is Squire (parchment) ── */}
      <section className="bg-parchment-200 px-6 py-20 text-ink-900 shadow-[inset_0_14px_30px_rgba(0,0,0,0.35)]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-gold-700">What is Squire</p>
          <h2 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Your party&apos;s second in command.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
            The knight rides into battle; the squire carries the gear, keeps the ledger, and readies the armor.
            Squire does the same for your table — the busywork, the math, and the rules lookups — so players and
            Dungeon Masters can focus on the adventure.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-lg border border-parchment-400 bg-parchment-100 p-6 text-center shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
              <h3 className="font-display text-xl text-ink-900">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid (parchment) ── */}
      <section id="features" className="bg-parchment-100 px-6 py-20 text-ink-900">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-gold-700">What it does</p>
          <h2 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Everything at the table, handled.</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-parchment-400 bg-parchment-50 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gold-400/18 text-gold-700">
                <Icon size={22} />
              </div>
              <h3 className="font-display text-xl text-ink-900">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Differentiator band (dark) ── */}
      <section className="relative overflow-hidden bg-leather-900 px-6 py-20 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(230,184,53,.14), transparent 60%)' }} />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-3xl text-parchment-50 sm:text-4xl">Keep the game moving.</h2>
          <p className="mt-5 text-lg leading-relaxed text-parchment-200/90">
            No flipping through books mid-turn. No recalculating your AC every time you swap armor. No forgetting
            the spell you prepared. Squire keeps the numbers honest and the rules current, so the story never stalls
            on paperwork.
          </p>
        </div>
      </section>

      {/* ── Beta CTA (parchment) ── */}
      <section className="bg-parchment-200 px-6 py-20 text-center text-ink-900">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-gold-700">Now in beta</p>
          <h2 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Take Squire to your next session.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-700">
            Create your account and start building. It&apos;s free while we&apos;re in beta.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/login" className={ctaClassLg}>Log in / Sign up</Link>
            <Link to="/beta" className="inline-block rounded-sm border border-ink-500 px-5 py-2.5 font-display text-sm uppercase tracking-wider text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 sm:px-7 sm:py-3.5 sm:text-base">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
