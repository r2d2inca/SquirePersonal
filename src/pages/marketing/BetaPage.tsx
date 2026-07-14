import { Link } from 'react-router'
import { HelpCircle } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader'
import { Crest } from '@/components/brand/Logo'
import { ctaClassLg } from '@/components/marketing/styles'
import { usePageMeta } from '@/hooks/usePageMeta'

const FAQ = [
  { q: 'What is Squire?', a: 'A companion app for Dungeons & Dragons 5e. It builds and runs your character, gives Dungeon Masters tools to run their table, and includes Echo, an AI assistant that knows your character and the rules.' },
  { q: 'What does it cost?', a: 'It’s free while we’re in beta. Create an account and start playing.' },
  { q: 'Which rules does it use?', a: 'The 2024 ruleset (5.5e) — updated species, prepared spellcasting, current subclasses and spell text.' },
  { q: 'Do I have to be a Dungeon Master?', a: 'No. Squire is built for players first. If you do run games, the DM tools are there when you want them.' },
  { q: 'What platforms does it run on?', a: 'Any modern browser, and it installs as an app on phone and desktop. It works offline, too.' },
  { q: 'Can I bring an existing character?', a: 'Yes — import from a Squire JSON export or from a D&D 5e character sheet PDF.' },
  { q: 'Is my data safe?', a: 'Your characters and campaigns are tied to your account and aren’t shared with other players unless you choose to (for example, joining a campaign).' },
  { q: 'When does it launch?', a: 'We’re actively in beta with adventuring parties now and adding features quickly. Sign up to play as we build toward launch.' },
]

export function BetaPage() {
  usePageMeta('Beta & FAQ — Squire', 'Squire is free in beta. Create an account to start playing, and read answers to common questions about rules, platforms, importing characters, and more.')

  return (
    <MarketingLayout>
      <MarketingPageHeader
        eyebrow="Now in beta"
        title="Get started"
        subtitle="Squire is free while we’re in beta. Create your account and take it to your next session."
      />

      <section className="bg-parchment-200 px-6 py-16 text-ink-900">
        <div className="mx-auto max-w-xl rounded-2xl border border-parchment-400 bg-parchment-50 px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <Crest className="mx-auto mb-4 h-10 w-10 text-gold-500" />
          <h2 className="font-display text-2xl text-ink-900">Free while we&apos;re in beta</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-500">Make an account, build a character, and bring Squire to your next session.</p>
          <div className="mt-6"><Link to="/login" className={ctaClassLg}>Create your account</Link></div>
          <p className="mt-4 text-[14px] text-ink-500">Already have one? <Link to="/login" className="underline decoration-gold-500 underline-offset-2 hover:text-ink-900">Log in</Link>.</p>
        </div>
      </section>

      <section className="bg-parchment-100 px-6 py-20 text-ink-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-center font-mono text-xs uppercase tracking-[0.34em] text-gold-700">Questions</p>
          <h2 className="mt-2 text-center font-display text-3xl text-ink-900 sm:text-4xl">Good to know</h2>
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="flex gap-4 rounded-xl border border-parchment-400 bg-parchment-50 p-5 shadow-[0_3px_10px_rgba(0,0,0,0.06)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-400/18 text-gold-700"><HelpCircle size={18} /></span>
                <div>
                  <div className="font-display text-lg text-ink-900">{q}</div>
                  <div className="mt-1.5 text-[15px] leading-relaxed text-ink-700">{a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
