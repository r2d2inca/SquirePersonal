import type { ReactNode } from 'react'
import { rollCheck } from '@/lib/rolls'

interface RollableProps {
  /** What is being rolled, e.g. "Stealth" or "DEX Save". Shown in the dice roller. */
  label: string
  modifier: number
  className?: string
  children: ReactNode
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `plus ${mod}` : `minus ${Math.abs(mod)}`
}

/**
 * Wraps a sheet value so clicking it rolls d20 + modifier into the dice roller.
 * Shift-click rolls with advantage, Alt-click with disadvantage.
 *
 * Renders a real <button>, so keyboard focus and Enter/Space activation come free.
 */
export function Rollable({ label, modifier, className = '', children }: RollableProps) {
  return (
    <button
      type="button"
      onClick={(e) =>
        rollCheck(label, modifier, e.shiftKey ? 'advantage' : e.altKey ? 'disadvantage' : 'normal')
      }
      aria-label={`Roll ${label}, ${formatModifier(modifier)}`}
      title="Click to roll — Shift for advantage, Alt for disadvantage"
      className={`cursor-pointer rounded text-left transition-colors hover:bg-gold-200/40 focus-visible:outline-2 focus-visible:outline-gold-400 ${className}`}
    >
      {children}
    </button>
  )
}
