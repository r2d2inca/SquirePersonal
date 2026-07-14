import { useState, useEffect } from 'react'
import { SkipForward, Check, ChevronRight, Skull } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TurnPhaseMovement } from './TurnPhaseMovement'
import { TurnPhaseAction } from './TurnPhaseAction'
import type { EncounterCombatant, StatusConditionName } from '@/lib/types/database'

type TurnPhase = 'movement' | 'action' | 'bonus' | 'end'

const PHASE_LABELS: Record<TurnPhase, string> = {
  movement: 'Movement',
  action: 'Action',
  bonus: 'Bonus Action',
  end: 'End Turn',
}

interface TurnWizardProps {
  combatant: EncounterCombatant
  allCombatants: EncounterCombatant[]
  isDM: boolean
  isMyTurn: boolean
  round: number
  onApplyDamage: (targetId: string, damage: number) => void
  onApplyHealing: (targetId: string, healing: number) => void
  onUpdateConditions: (targetId: string, conditions: StatusConditionName[]) => void
  onEndTurn: () => void
  onLogAction: (entry: string) => void
}

export function TurnWizard({
  combatant,
  allCombatants,
  isDM,
  isMyTurn,
  round,
  onApplyDamage,
  onApplyHealing,
  onUpdateConditions,
  onEndTurn,
  onLogAction,
}: TurnWizardProps) {
  const [phase, setPhase] = useState<TurnPhase>('movement')
  const [actionUsed, setActionUsed] = useState(false)
  const [bonusUsed, setBonusUsed] = useState(false)
  const [movementDone, setMovementDone] = useState(false)
  const [turnLog, setTurnLog] = useState<string[]>([])

  // Reset state when combatant changes (new turn)
  useEffect(() => {
    setPhase('movement')
    setActionUsed(false)
    setBonusUsed(false)
    setMovementDone(false)
    setTurnLog([])
  }, [combatant.id])

  const canAct = isDM || isMyTurn
  const isDown = combatant.current_hp <= 0

  function logAndTrack(entry: string) {
    setTurnLog(prev => [...prev, entry])
    onLogAction(entry)
  }

  function handleEndTurn() {
    onLogAction(`${combatant.name} ended their turn`)
    onEndTurn()
  }

  // Not this player's turn
  if (!canAct) {
    return (
      <div className="p-4 bg-parchment-100 border border-parchment-400 rounded-lg text-center">
        <p className="text-sm text-ink-500 font-display">
          Waiting for <span className="text-gold-600 font-bold">{combatant.name}</span>'s turn...
        </p>
      </div>
    )
  }

  // Unconscious — death saves only
  if (isDown && !isDM) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull size={16} className="text-danger" />
            <h3 className="font-display text-sm uppercase text-danger">{combatant.name} is Down!</h3>
          </div>
          <Button size="sm" onClick={handleEndTurn}>
            <SkipForward size={14} className="mr-1" /> End Turn
          </Button>
        </div>
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-center">
          <p className="text-sm text-ink-700 font-body">
            You are unconscious. Roll death saving throws on your character sheet.
          </p>
        </div>
      </div>
    )
  }

  const phases: TurnPhase[] = ['movement', 'action', 'bonus', 'end']
  const currentIdx = phases.indexOf(phase)

  return (
    <div className="space-y-3">
      {/* Turn header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-ink-900">
          {combatant.name}'s Turn
          <span className="text-xs text-ink-400 ml-2">Round {round}</span>
        </h3>
        {isDM && (
          <Button size="sm" variant="ghost" onClick={handleEndTurn}>
            <SkipForward size={14} className="mr-1" /> Quick End
          </Button>
        )}
      </div>

      {/* Phase progress */}
      <div className="flex items-center gap-1">
        {phases.map((p, i) => {
          const isCurrent = p === phase
          const isDone = i < currentIdx || (p === 'movement' && movementDone) || (p === 'action' && actionUsed) || (p === 'bonus' && bonusUsed)
          return (
            <div key={p} className="flex items-center">
              <button
                onClick={() => {
                  // Allow jumping back to completed phases
                  if (i <= currentIdx || isDone) setPhase(p)
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-display uppercase transition-colors ${
                  isCurrent
                    ? 'bg-gold-400 text-ink-900'
                    : isDone
                      ? 'bg-gold-200 text-gold-700 cursor-pointer'
                      : 'bg-parchment-200 text-ink-400'
                }`}
              >
                {isDone && !isCurrent ? <Check size={10} className="inline mr-0.5" /> : null}
                {PHASE_LABELS[p]}
              </button>
              {i < phases.length - 1 && (
                <ChevronRight size={12} className="text-ink-300 mx-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Phase content */}
      {phase === 'movement' && (
        <TurnPhaseMovement
          combatant={combatant}
          onDoneMoving={() => {
            setMovementDone(true)
            setPhase('action')
          }}
          onSkip={() => {
            setMovementDone(true)
            setPhase('action')
          }}
        />
      )}

      {phase === 'action' && (
        <TurnPhaseAction
          combatant={combatant}
          allCombatants={allCombatants}
          label="Action"
          isDM={isDM}
          onApplyDamage={onApplyDamage}
          onApplyHealing={onApplyHealing}
          onUpdateConditions={onUpdateConditions}
          onLogAction={logAndTrack}
          onComplete={() => {
            setActionUsed(true)
            setPhase('bonus')
          }}
          onSkip={() => {
            setPhase('bonus')
          }}
        />
      )}

      {phase === 'bonus' && (
        <TurnPhaseAction
          combatant={combatant}
          allCombatants={allCombatants}
          label="Bonus Action"
          isDM={isDM}
          onApplyDamage={onApplyDamage}
          onApplyHealing={onApplyHealing}
          onUpdateConditions={onUpdateConditions}
          onLogAction={logAndTrack}
          onComplete={() => {
            setBonusUsed(true)
            setPhase('end')
          }}
          onSkip={() => {
            setPhase('end')
          }}
        />
      )}

      {phase === 'end' && (
        <div className="space-y-3">
          <h4 className="font-display text-sm uppercase text-ink-500">Turn Summary</h4>
          {turnLog.length > 0 ? (
            <div className="bg-parchment-50 border border-parchment-300 rounded-lg p-3 space-y-1">
              {turnLog.map((entry, i) => (
                <p key={i} className="text-xs font-mono text-ink-600">{entry}</p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-400 text-center py-2">No actions taken this turn.</p>
          )}

          {/* Option to go back */}
          <div className="flex gap-2">
            {!actionUsed && (
              <Button variant="ghost" size="sm" onClick={() => setPhase('action')}>
                Take Action
              </Button>
            )}
            {!bonusUsed && (
              <Button variant="ghost" size="sm" onClick={() => setPhase('bonus')}>
                Take Bonus Action
              </Button>
            )}
          </div>

          <Button onClick={handleEndTurn} className="w-full">
            <SkipForward size={14} className="mr-1" /> End Turn
          </Button>
        </div>
      )}
    </div>
  )
}
