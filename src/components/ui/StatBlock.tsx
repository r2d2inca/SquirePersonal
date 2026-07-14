import { useState, useRef, useEffect } from 'react'
import { formatModifier, abilityModifier } from '@/lib/calculations'
import { ABILITY_ABBREVIATIONS, type AbilityScore } from '@/lib/constants'
import { Rollable } from '@/components/ui/Rollable'

interface StatBlockProps {
  ability: AbilityScore
  score: number
  isProficientSave?: boolean
  proficiencyBonus?: number
  className?: string
  onScoreChange?: (score: number) => void
  /** When set, the modifier becomes clickable and rolls a check under this label. */
  rollLabel?: string
}

export function StatBlock({ ability, score, className = '', onScoreChange, rollLabel }: StatBlockProps) {
  const mod = abilityModifier(score)
  const abbr = ABILITY_ABBREVIATIONS[ability]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(score))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    if (!onScoreChange) return
    setDraft(String(score))
    setEditing(true)
  }

  function commitEdit() {
    setEditing(false)
    const val = parseInt(draft)
    if (!isNaN(val) && val >= 1 && val <= 30 && val !== score) {
      onScoreChange?.(val)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div
      className={`flex flex-col items-center p-3 bg-parchment-50 border border-parchment-400 rounded-xl text-center min-w-[80px] ${className}`}
    >
      <span className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">{abbr}</span>
      {/* Only the modifier is rollable — the card also holds a click-to-edit score input,
          and nesting that inside a button would break editing. */}
      {rollLabel ? (
        <Rollable label={rollLabel} modifier={mod} className="px-2">
          <span className="font-display text-2xl text-ink-900 leading-tight">{formatModifier(mod)}</span>
        </Rollable>
      ) : (
        <span className="font-display text-2xl text-ink-900 leading-tight">{formatModifier(mod)}</span>
      )}
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={30}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="font-mono text-sm text-center bg-white border border-gold-400 rounded-full w-10 h-8 mt-1 focus:outline-none focus:ring-1 focus:ring-gold-400"
        />
      ) : (
        <span
          onClick={startEdit}
          className={`font-mono text-sm text-ink-500 bg-parchment-200 rounded-full w-8 h-8 flex items-center justify-center mt-1 ${
            onScoreChange ? 'cursor-pointer hover:bg-gold-100 hover:text-ink-900 transition-colors' : ''
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}
