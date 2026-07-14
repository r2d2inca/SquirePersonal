import { Flame, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { abilityModifier, proficiencyBonus } from '@/lib/calculations'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface FocusPointsTrackerProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}

export function KiTracker({ character, onUpdate }: FocusPointsTrackerProps) {
  // Support both old "Ki Points" and new "Focus Points" for existing characters
  const focusFeature = character.features.find(f => f.name === 'Focus Points' || f.name === 'Ki Points')
  if (!focusFeature || focusFeature.usesMax == null) return null

  const remaining = focusFeature.usesRemaining ?? focusFeature.usesMax
  const total = focusFeature.usesMax
  const featureName = focusFeature.name

  // Monk save DC = 8 + proficiency bonus + WIS modifier
  const saveDC = 8 + proficiencyBonus(character.level) + abilityModifier(character.wisdom)

  function updatePoints(newRemaining: number) {
    const updatedFeatures = character.features.map(f =>
      (f.name === 'Focus Points' || f.name === 'Ki Points') ? { ...f, usesRemaining: newRemaining } : f
    )
    onUpdate({ features: updatedFeatures })
  }

  function spend() {
    if (remaining > 0) updatePoints(remaining - 1)
  }

  function restoreOne() {
    if (remaining < total) updatePoints(remaining + 1)
  }

  function restoreAll() {
    updatePoints(total)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-gold-500" />
          <span className="font-display text-sm uppercase text-ink-500">Focus Points</span>
        </div>
        <span className="font-mono text-sm text-ink-700">{remaining}/{total}</span>
      </div>

      {/* Save DC */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-gold-100/50 border border-gold-300 rounded-lg">
        <Target size={14} className="text-gold-500" />
        <span className="text-xs font-display uppercase text-ink-500">Save DC</span>
        <span className="font-display font-bold text-lg text-ink-900">{saveDC}</span>
      </div>

      {/* Focus point circles */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {Array.from({ length: total }, (_, i) => {
          const isFilled = i < remaining
          return (
            <button
              key={i}
              onClick={() => isFilled ? spend() : restoreOne()}
              className={`w-6 h-6 rounded-full border-2 transition-colors cursor-pointer ${
                isFilled
                  ? 'bg-gold-400 border-gold-500 hover:bg-gold-300'
                  : 'bg-transparent border-parchment-400 hover:border-gold-400'
              }`}
              title={isFilled ? 'Spend Focus Point' : 'Restore Focus Point'}
            />
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={spend}
          disabled={remaining <= 0}
          className="px-3 py-1 rounded text-xs font-display uppercase bg-parchment-200 text-ink-700 hover:bg-parchment-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Spend
        </button>
        <button
          onClick={restoreAll}
          disabled={remaining >= total}
          className="px-3 py-1 rounded text-xs font-display uppercase bg-gold-200 text-gold-700 hover:bg-gold-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Restore All
        </button>
      </div>
    </Card>
  )
}
