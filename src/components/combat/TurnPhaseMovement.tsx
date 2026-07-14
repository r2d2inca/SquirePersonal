import { Move, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EncounterCombatant } from '@/lib/types/database'

interface TurnPhaseMovementProps {
  combatant: EncounterCombatant
  onDoneMoving: () => void
  onSkip: () => void
}

export function TurnPhaseMovement({ combatant, onDoneMoving, onSkip }: TurnPhaseMovementProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm uppercase text-ink-500">Movement</h4>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          <SkipForward size={14} className="mr-1" /> Skip
        </Button>
      </div>

      <div className="p-4 bg-parchment-50 border border-parchment-300 rounded-lg text-center space-y-3">
        <Move size={32} className="text-gold-400 mx-auto" />
        <p className="text-sm text-ink-700">
          Drag <span className="font-bold text-ink-900">{combatant.name}</span>'s token on the battle grid to move.
        </p>
        <p className="text-xs text-ink-500">
          Your movement speed determines how far you can go. Move your token, then continue.
        </p>
      </div>

      <Button onClick={onDoneMoving} className="w-full">
        Done Moving
      </Button>
    </div>
  )
}
