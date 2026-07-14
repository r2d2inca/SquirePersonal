import { Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface BarriomancerTrackerProps {
  character: Character
  onUpdate: (updates: CharacterUpdate) => void
}

function getBarrierDiceMax(level: number, chaMod: number): number {
  return Math.max(1, 2 * level + chaMod)
}

function getBarrierDieSize(level: number): string {
  if (level >= 18) return 'd12'
  if (level >= 7) return 'd10'
  return 'd8'
}

function getShortRestRecovery(level: number, chaMod: number): number {
  if (level >= 11) return Math.max(1, chaMod)
  return Math.max(1, Math.ceil(chaMod / 2))
}

export function BarriomancerTracker({ character, onUpdate }: BarriomancerTrackerProps) {
  if (!character.class.toLowerCase().includes('barriomancer')) return null

  const chaMod = Math.floor((character.charisma - 10) / 2)
  const max = getBarrierDiceMax(character.level, chaMod)
  const dieSize = getBarrierDieSize(character.level)
  const shortRestRecovery = getShortRestRecovery(character.level, chaMod)

  // Track via features array
  const feature = character.features.find(f => f.name === 'Barrier Dice Pool')
  const remaining = feature?.usesRemaining ?? max

  function update(newRemaining: number) {
    const clamped = Math.max(0, Math.min(max, newRemaining))
    const exists = character.features.some(f => f.name === 'Barrier Dice Pool')
    const updatedFeatures = exists
      ? character.features.map(f =>
          f.name === 'Barrier Dice Pool'
            ? { ...f, usesMax: max, usesRemaining: clamped }
            : f
        )
      : [
          ...character.features,
          { name: 'Barrier Dice Pool', description: '', source: 'Barriomancer', usesMax: max, usesRemaining: clamped, rechargeOn: 'long_rest' as const },
        ]
    onUpdate({ features: updatedFeatures })
  }

  function spend(count: number = 1) {
    if (remaining >= count) update(remaining - count)
  }

  function recover(count: number) {
    update(remaining + count)
  }

  // Visual: show dice in rows
  const filledCount = remaining
  const emptyCount = max - remaining

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-arcane-400" />
          <span className="font-display text-sm uppercase text-ink-500">Barrier Dice</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-400">{dieSize}</span>
          <span className="font-mono text-sm text-ink-700">{remaining}/{max}</span>
        </div>
      </div>

      {/* Dice circles */}
      <div className="flex items-center gap-1 flex-wrap mb-3">
        {Array.from({ length: Math.min(max, 30) }, (_, i) => {
          const isFilled = i < filledCount
          return (
            <button
              key={i}
              onClick={() => isFilled ? spend(1) : recover(1)}
              className={`w-5 h-5 rounded-full border-2 transition-colors cursor-pointer ${
                isFilled
                  ? 'bg-arcane-400 border-arcane-500 hover:bg-arcane-300'
                  : 'bg-transparent border-parchment-400 hover:border-arcane-400'
              }`}
              title={isFilled ? 'Spend Barrier Die' : 'Restore Barrier Die'}
            />
          )
        })}
        {max > 30 && <span className="text-xs text-ink-400">+{max - 30} more</span>}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => spend(1)}
          disabled={remaining <= 0}
          className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-parchment-200 text-ink-700 hover:bg-parchment-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Spend 1
        </button>
        <button
          onClick={() => spend(2)}
          disabled={remaining < 2}
          className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-parchment-200 text-ink-700 hover:bg-parchment-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Spend 2
        </button>
        <button
          onClick={() => spend(3)}
          disabled={remaining < 3}
          className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-parchment-200 text-ink-700 hover:bg-parchment-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Spend 3
        </button>
        <button
          onClick={() => recover(shortRestRecovery)}
          disabled={remaining >= max}
          className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-gold-200 text-gold-700 hover:bg-gold-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Short Rest (+{shortRestRecovery})
        </button>
        <button
          onClick={() => update(max)}
          disabled={remaining >= max}
          className="px-2 py-0.5 rounded text-[10px] font-display uppercase bg-gold-200 text-gold-700 hover:bg-gold-300 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Long Rest (Full)
        </button>
      </div>
    </Card>
  )
}
