import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Wand2, Users, Sparkles, Smartphone, Wifi, Star } from 'lucide-react'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader'
import { Crest } from '@/components/brand/Logo'
import { ctaClassLg } from '@/components/marketing/styles'
import { usePageMeta } from '@/hooks/usePageMeta'

const GREEN = '#2d6b3f', YELLOW = '#d4a017', RED = '#8b2d2d', ARCANE = '#6a5acd'

/** HP-bar fill color by remaining percent: green (high) → yellow (mid) → red (low). */
function hpColor(pct: number) {
  return pct > 60 ? GREEN : pct >= 30 ? YELLOW : RED
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-parchment-400 bg-parchment-50 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">{children}</div>
}
function Muted({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">{children}</div>
}
function HpBar({ pct }: { pct: number }) {
  return <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-parchment-200"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: hpColor(pct) }} /></div>
}
function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-parchment-400 bg-parchment-50 px-3 py-1.5 font-mono text-xs text-ink-700">{children}</span>
}

// ── vignettes ──
function SheetVignette() {
  return (
    <Card>
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        {[['AC', '18'], ['Speed', '30'], ['Init', '+3']].map(([lbl, val]) => (
          <div key={lbl} className="rounded-xl border border-parchment-400 bg-parchment-100 p-2.5 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">{lbl}</div>
            <div className="font-display text-2xl leading-none text-ink-900">{val}</div>
          </div>
        ))}
      </div>
      <Muted>Hit Points</Muted>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-[13px] text-ink-700">37 / 44</span>
        <span className="rounded bg-gold-400/20 px-2 py-0.5 font-display text-[11px] uppercase tracking-wider text-gold-700">+5 temp</span>
      </div>
      <HpBar pct={84} />
      <div className="mt-3 flex items-center justify-between">
        <Muted>Level 3 Spell Slots</Muted>
        <span className="flex gap-1.5">
          <i className="h-3.5 w-3.5 rounded-full border-[1.5px] border-gold-500 bg-gold-400" />
          <i className="h-3.5 w-3.5 rounded-full border-[1.5px] border-gold-500 bg-gold-400" />
          <i className="h-3.5 w-3.5 rounded-full border-[1.5px] border-gold-500" />
        </span>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <span className="rounded px-2 py-0.5 font-display text-[11px] uppercase tracking-wider" style={{ background: 'rgba(106,90,205,.16)', color: ARCANE }}>Concentration: Bless</span>
        <span className="rounded bg-gold-400/20 px-2 py-0.5 font-display text-[11px] uppercase tracking-wider text-gold-700">Mage Armor</span>
      </div>
    </Card>
  )
}

const COMBATANTS = [
  { init: 22, name: 'Bink Darkbottom', pct: 100, active: false },
  { init: 19, name: 'Figras Orcsblade', pct: 50, active: false },
  { init: 17, name: 'Theodore Fairbrook (you)', pct: 85, active: true },
  { init: 14, name: 'Falkar Ergot', pct: 22, active: false },
  { init: 8, name: 'Veil Harmona', pct: 55, active: false },
]
function InitiativeVignette() {
  return (
    <Card>
      <Muted>Initiative — Round 2</Muted>
      <div className="mt-2 flex flex-col gap-2">
        {COMBATANTS.map((c) => (
          <div key={c.name} className={`flex items-center gap-3 rounded-xl border bg-parchment-100 px-3 py-2.5 ${c.active ? 'border-gold-500 shadow-[inset_0_0_0_1px_var(--color-gold-500)]' : 'border-parchment-400'}`}>
            <span className="w-7 text-center font-display text-lg text-gold-700">{c.init}</span>
            <span className="flex-1 text-[15px] text-ink-900">{c.name}</span>
            <span className="w-16"><HpBar pct={c.pct} /></span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function EchoVignette() {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-leather-700 px-4 py-2.5 text-[15px] text-parchment-50">
          What can I do right now?
        </div>
        <div className="max-w-[92%] self-start rounded-2xl rounded-bl-sm border border-parchment-400 bg-parchment-100 px-4 py-2.5 text-[15px] text-ink-900">
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: ARCANE }}><Sparkles size={11} /> Echo</div>
          You have your action, a bonus action, and your reaction left. Your Cloak of the Manta Ray lets you breathe and move underwater — and you can still cast Shield as a reaction from a 1st-level slot if you&apos;re hit.
        </div>
      </div>
    </Card>
  )
}

function AnywhereVignette() {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-28 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-parchment-400 bg-parchment-100">
          <Crest className="h-8 w-8 text-gold-500" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-parchment-400 bg-parchment-100 px-3 py-1.5 font-mono text-xs text-ink-700"><Smartphone size={13} /> Installed on your phone</span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-parchment-400 bg-parchment-100 px-3 py-1.5 font-mono text-xs text-ink-700"><Wifi size={13} /> Works offline</span>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-parchment-400 bg-parchment-100 px-3 py-1.5 font-mono text-xs text-ink-700"><Star size={13} /> Light &amp; dark themes</span>
        </div>
      </div>
    </Card>
  )
}

const SECTIONS: { icon: typeof Wand2; title: string; blurb: string; chips: string[]; vignette: ReactNode }[] = [
  {
    icon: Wand2,
    title: 'For players',
    blurb: 'Build a character in minutes, then just play it. Squire keeps every number honest and up to date.',
    chips: ['Guided 2024 builder', 'Live HP · AC · saves', 'Conditions & buffs', 'Prepared spellcasting', 'Multiclass', 'Import JSON / PDF'],
    vignette: <SheetVignette />,
  },
  {
    icon: Users,
    title: 'For Dungeon Masters',
    blurb: 'Run the table from one place, in real time — initiative, HP, and reveals that sync to your players live.',
    chips: ['Party overview', 'Award XP', 'Combat tracker', 'Battle maps', 'Lore visibility', 'Campaign chat'],
    vignette: <InitiativeVignette />,
  },
  {
    icon: Sparkles,
    title: 'Meet Echo',
    blurb: 'A rules-aware assistant that actually knows your character. Ask what you can do — get a real answer.',
    chips: ['Reads your sheet', 'Knows your items', 'Plain-language rules', 'Grounded recaps'],
    vignette: <EchoVignette />,
  },
  {
    icon: Smartphone,
    title: 'Anywhere you play',
    blurb: 'At the table, on the couch, or on the road — Squire installs like an app and keeps working offline.',
    chips: ['Installable app', 'Offline-ready', 'Phone & desktop'],
    vignette: <AnywhereVignette />,
  },
]

export function FeaturesPage() {
  usePageMeta('Features — Squire', 'Everything Squire does for players and Dungeon Masters: character builder, living sheet, DM tools, the Echo AI assistant, homebrew, and cross-platform play.')

  return (
    <MarketingLayout>
      <MarketingPageHeader
        eyebrow="Features"
        title="One companion, the whole campaign."
        subtitle="From the first character to the final boss — Squire runs the numbers, the rules, and the table, so the story keeps moving."
      />

      <div className="bg-parchment-100 text-ink-900">
        {SECTIONS.map(({ icon: Icon, title, blurb, chips, vignette }, i) => (
          <div key={title}>
            {i > 0 && (
              <div className="mx-auto flex max-w-5xl items-center gap-4 px-6">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-parchment-400 to-transparent" />
                <Crest className="h-6 w-6 text-gold-500" />
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-parchment-400 to-transparent" />
              </div>
            )}
            <section className={i % 2 === 1 ? 'bg-parchment-200' : ''}>
              <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2">
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/18 text-gold-700"><Icon size={24} /></div>
                  <h2 className="font-display text-2xl text-ink-900 sm:text-3xl">{title}</h2>
                  <p className="mt-2 text-[16px] leading-relaxed text-ink-500">{blurb}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {chips.map((c) => <Chip key={c}>{c}</Chip>)}
                  </div>
                </div>
                <div className={i % 2 === 1 ? 'md:order-1' : ''}>{vignette}</div>
              </div>
            </section>
          </div>
        ))}
      </div>

      <section className="bg-leather-900 px-6 py-16 text-center">
        <h2 className="font-display text-3xl text-parchment-50">Ready to try it?</h2>
        <div className="mt-6"><Link to="/login" className={ctaClassLg}>Log in / Sign up</Link></div>
      </section>
    </MarketingLayout>
  )
}
