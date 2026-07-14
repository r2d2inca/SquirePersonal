import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ECHO_INTRO, ECHO_STEP_COPY, type EchoStep } from '@/lib/echoGuideCopy'

const INTRO_SEEN_KEY = 'echo-guide-intro-seen'

interface EchoGuideProps {
  step: EchoStep
}

/**
 * Echo — the app's AI persona — as a guide through character creation. An arcane
 * orb (the gem from the crest) that explains the current step in a speech bubble.
 *
 * Sits bottom-right. The creation page renders outside AppShell, so there's no
 * dice roller or toast stack to collide with here.
 */
export function EchoGuide({ step }: EchoGuideProps) {
  const [introSeen, setIntroSeen] = useState(() => localStorage.getItem(INTRO_SEEN_KEY) === 'true')
  const [showingIntro, setShowingIntro] = useState(!introSeen)
  const [open, setOpen] = useState(true)

  // A new step has something new to say, so reopen — unless the user has dismissed
  // Echo, in which case leave him collapsed.
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    if (!dismissed) setOpen(true)
  }, [step, dismissed])

  function markIntroSeen() {
    if (introSeen) return
    localStorage.setItem(INTRO_SEEN_KEY, 'true')
    setIntroSeen(true)
  }

  function handleContinue() {
    markIntroSeen()
    setShowingIntro(false)
  }

  function handleCollapse() {
    markIntroSeen()
    setShowingIntro(false)
    setOpen(false)
    setDismissed(true)
  }

  function handleOrbClick() {
    if (open) {
      handleCollapse()
    } else {
      setOpen(true)
      setDismissed(false)
    }
  }

  const line = showingIntro ? ECHO_INTRO : ECHO_STEP_COPY[step]

  return (
    <>
      <style>{`
        @keyframes echo-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes echo-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.12); }
        }
        @keyframes echo-bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        .echo-orb { animation: echo-bob 4s ease-in-out infinite; }
        .echo-glow { animation: echo-pulse 4s ease-in-out infinite; }
        .echo-bubble { animation: echo-bubble-in 260ms cubic-bezier(.2, 1.4, .4, 1); }
        @media (prefers-reduced-motion: reduce) {
          .echo-orb, .echo-glow, .echo-bubble { animation: none; }
        }
      `}</style>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 w-[calc(100%-2rem)] max-w-xs pointer-events-none">
        {open && (
          <div className="echo-bubble pointer-events-auto relative rounded-2xl rounded-br-sm border border-parchment-400 bg-parchment-50 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <button
              onClick={handleCollapse}
              aria-label="Hide Echo"
              className="absolute right-2 top-2 p-1 text-ink-300 hover:text-ink-700 cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-arcane-500 pr-5">
              {line.title}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-900">{line.body}</p>

            {showingIntro && (
              <button
                onClick={handleContinue}
                className="mt-3 font-display text-xs uppercase tracking-wider text-arcane-500 hover:text-arcane-400 cursor-pointer"
              >
                Let&apos;s begin →
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleOrbClick}
          aria-label={open ? 'Hide Echo' : 'Ask Echo about this step'}
          title={open ? 'Hide Echo' : 'Ask Echo about this step'}
          className="echo-orb pointer-events-auto relative h-14 w-14 shrink-0 cursor-pointer rounded-full"
        >
          <span
            className="echo-glow absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(106,90,205,.55), rgba(106,90,205,0) 68%)' }}
          />
          <svg viewBox="0 0 100 100" className="relative h-full w-full" role="img" aria-label="Echo">
            <circle cx="50" cy="50" r="34" fill="#2d2118" stroke="#6a5acd" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="27" fill="none" stroke="#6a5acd" strokeWidth="0.8" opacity="0.45" />
            {/* the crest's arcane gem, enlarged */}
            <path d="M50 33 L64 50 L50 67 L36 50 Z" fill="#6a5acd" stroke="#7b68ee" strokeWidth="1.5" />
            <path d="M50 40 L57 50 L50 60 L43 50 Z" fill="#7b68ee" opacity="0.75" />
          </svg>
        </button>
      </div>
    </>
  )
}
