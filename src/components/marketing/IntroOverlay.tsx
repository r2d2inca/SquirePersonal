import { useEffect, useState } from 'react'
import { AnimatedCrest } from './AnimatedCrest'

const SLOGAN = 'Every hero needs a Squire.'

/**
 * Full-screen first-visit intro: the crest's sword & quill cross in while the slogan spells out
 * letter by letter, then the whole panel swipes up to reveal the site. Auto-leaves after the
 * animation, or immediately on any interaction (skip). Rendered by LandingPage only when it should
 * play (once per session, not under reduced motion); `onDone` unmounts it and restores scrolling.
 */
export function IntroOverlay({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leave = () => setLeaving(true)
    const t = setTimeout(leave, 2700)
    window.addEventListener('pointerdown', leave)
    window.addEventListener('keydown', leave)
    window.addEventListener('wheel', leave, { passive: true })
    window.addEventListener('touchstart', leave, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', leave)
      window.removeEventListener('keydown', leave)
      window.removeEventListener('wheel', leave)
      window.removeEventListener('touchstart', leave)
    }
  }, [])

  // Letter index runs continuously across words; each word is a non-breaking unit so the
  // slogan only wraps at spaces (never mid-word).
  let letter = 0

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-6 text-center transition-transform duration-700 ease-in-out ${leaving ? '-translate-y-full' : ''}`}
      style={{ background: 'radial-gradient(120% 90% at 50% 34%, #2a1f13 0%, #1e160e 45%, #0f0d0a 100%)' }}
      onTransitionEnd={() => { if (leaving) onDone() }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[16%] h-[560px] w-[560px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(230,184,53,.24), transparent 62%)' }}
      />
      <div className="relative mb-7" style={{ filter: 'drop-shadow(0 0 22px rgba(230,184,53,.4))' }}>
        <AnimatedCrest className="h-32 w-32 text-gold-400" />
      </div>
      <p className="mkt-rise relative mb-4 font-mono text-xs uppercase tracking-[0.42em] text-gold-400" style={{ animationDelay: '1.5s' }}>
        D&amp;D 5E · 2024 Rules
      </p>
      <h1 className="relative font-display text-5xl leading-[1.05] text-parchment-50 sm:text-7xl">
        {SLOGAN.split(' ').map((word, wi, arr) => (
          <span key={wi}>
            <span className="inline-block whitespace-nowrap">
              {word.split('').map((ch) => {
                const idx = letter++
                return <span key={idx} className="mkt-letter" style={{ animationDelay: `${350 + idx * 55}ms` }}>{ch}</span>
              })}
            </span>
            {wi < arr.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h1>
    </div>
  )
}
