import { Link } from 'react-router'
import { BookOpen, Swords, Crown, Zap, Smartphone, Sparkles } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader'
import { Crest } from '@/components/brand/Logo'
import { ctaClassLg } from '@/components/marketing/styles'
import { usePageMeta } from '@/hooks/usePageMeta'

const ARCANE = '#6a5acd'

const HIGHLIGHTS = [
  { icon: BookOpen, big: '2024', label: 'Built on the current 5.5e ruleset' },
  { icon: Swords, big: '13+', label: 'Classes and subclasses to play' },
  { icon: Crown, big: 'Both sides', label: 'Made for players and Dungeon Masters' },
  { icon: Zap, big: 'Real-time', label: 'Live combat and campaign sync' },
  { icon: Smartphone, big: 'Offline', label: 'Installs on your phone, plays anywhere' },
  { icon: Sparkles, big: 'Echo', label: 'An AI that knows your sheet and the rules' },
]

export function AboutPage() {
  usePageMeta('About — Squire', 'Why Squire exists: Dungeons & Dragons is the best game in the world and the most paperwork. We built Squire to take the drag out of it.')

  return (
    <MarketingLayout>
      <MarketingPageHeader eyebrow="About" title="Why Squire" subtitle="Built at the table, for the table." />

      <div className="bg-parchment-100">
        {/* statement */}
        <section className="mx-auto max-w-4xl px-6 pb-8 pt-[72px] text-center">
          <h2 className="font-display text-5xl leading-[1.04] text-ink-900 sm:text-6xl">
            Less admin.<br /><span className="text-gold-700">More adventure.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Squire runs the numbers, the rules, and the table — so the night belongs to the story, not the paperwork.
          </p>
        </section>

        {/* highlights */}
        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-12 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, big, label }) => (
            <div key={big} className="flex items-start gap-3.5 rounded-2xl border border-parchment-400 bg-parchment-50 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/18 text-gold-700"><Icon size={20} /></span>
              <div>
                <div className="font-display text-2xl leading-none text-ink-900">{big}</div>
                <div className="mt-1.5 text-sm leading-snug text-ink-500">{label}</div>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* showcase: Echo */}
      <section className="bg-parchment-200 px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-11 md:grid-cols-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-gold-700">What that feels like</div>
            <h3 className="mt-2.5 font-display text-3xl text-ink-900">Answers, not rulebooks.</h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-ink-700">
              Mid-fight, you shouldn&apos;t have to stop and look things up. Ask Echo — it reads your character and the
              rules and tells you what you can actually do, right now.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-parchment-400 bg-parchment-50 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
            <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-leather-700 px-4 py-2.5 text-[15px] text-parchment-50">What can I do right now?</div>
            <div className="max-w-[92%] self-start rounded-2xl rounded-bl-sm border border-parchment-400 bg-parchment-100 px-4 py-2.5 text-[15px] text-ink-900">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: ARCANE }}><Sparkles size={11} /> Echo</div>
              You have your action, a bonus action, and your reaction left. Your Cloak of the Manta Ray lets you breathe and move underwater — and you can still cast Shield as a reaction from a 1st-level slot if you&apos;re hit.
            </div>
          </div>
        </div>
      </section>

      {/* why we built it */}
      <section className="bg-leather-900 px-6 py-[72px] text-center">
        <Crest className="mx-auto mb-5 h-8 w-8 text-gold-400" />
        <div className="font-mono text-xs uppercase tracking-[0.42em] text-gold-400">Why we built it</div>
        <div className="mx-auto mt-4 max-w-2xl space-y-4 text-lg leading-relaxed text-parchment-200/90">
          <p>We built Squire at our own table — because we love this game, and hated watching half of every session vanish into rulebooks and re-added modifiers.</p>
          <p>The tools we tried felt like spreadsheets: powerful, but cold, and never quite made for the moment you&apos;re actually in.</p>
          <p>So we made the companion we wanted — one that speaks the 2024 rules fluently, quietly handles the busywork, and hands the night back to the story.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-parchment-200 px-6 py-16 text-center">
        <div className="mb-5 font-display text-2xl text-ink-900">Every hero needs a Squire.</div>
        <Link to="/login" className={ctaClassLg}>Log in / Sign up</Link>
      </section>
    </MarketingLayout>
  )
}
