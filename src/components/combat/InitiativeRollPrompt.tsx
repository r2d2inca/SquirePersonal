import { useState } from 'react'
import { Dice6 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EncounterCombatant } from '@/lib/types/database'

interface InitiativeRollPromptProps {
  combatants: EncounterCombatant[]
  userId: string
  isDM: boolean
  onRollInitiative: (combatantId: string, initiative: number) => void
  onStartCombat: () => void
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export function InitiativeRollPrompt({
  combatants,
  userId,
  isDM,
  onRollInitiative,
  onStartCombat,
}: InitiativeRollPromptProps) {
  const [manualValues, setManualValues] = useState<Record<string, string>>({})

  const myCombatant = combatants.find((c) => c.user_id === userId && c.is_player)
  const hasRolled = myCombatant?.initiative != null
  const allRolled = combatants.every((c) => c.initiative != null)

  function handleRoll(combatantId: string, bonus: number = 0) {
    const roll = rollD20() + bonus
    onRollInitiative(combatantId, roll)
  }

  function handleManualSubmit(combatantId: string) {
    const val = parseInt(manualValues[combatantId] ?? '')
    if (isNaN(val)) return
    onRollInitiative(combatantId, val)
    setManualValues((prev) => ({ ...prev, [combatantId]: '' }))
  }

  function handleAutoRollAll() {
    for (const c of combatants) {
      if (c.initiative == null) {
        handleRoll(c.id, c.initiative_bonus)
      }
    }
  }

  // Player view
  if (!isDM) {
    return (
      <div className="p-6 bg-parchment-100 border border-gold-400 rounded-lg text-center space-y-4">
        <Dice6 size={32} className="mx-auto text-gold-500" />
        <h3 className="font-display text-lg text-ink-900">Roll for Initiative!</h3>

        {myCombatant && !hasRolled && (
          <div className="space-y-3">
            <Button onClick={() => handleRoll(myCombatant.id, myCombatant.initiative_bonus)}>
              <Dice6 size={14} className="mr-1" /> Roll d20
              {myCombatant.initiative_bonus !== 0 && ` (${myCombatant.initiative_bonus > 0 ? '+' : ''}${myCombatant.initiative_bonus})`}
            </Button>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-ink-500">or enter manually:</span>
              <input
                type="number"
                value={manualValues[myCombatant.id] ?? ''}
                onChange={(e) =>
                  setManualValues((prev) => ({ ...prev, [myCombatant.id]: e.target.value }))
                }
                placeholder="0"
                className="w-16 px-2 py-1 bg-parchment-50 border border-parchment-400 rounded font-mono text-sm text-center text-ink-900 focus:outline-none focus:border-gold-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit(myCombatant.id)
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleManualSubmit(myCombatant.id)}
              >
                Submit
              </Button>
            </div>
          </div>
        )}

        {hasRolled && (
          <div>
            <p className="text-sm text-ink-700">
              Your initiative: <span className="font-mono font-bold text-gold-600">{myCombatant?.initiative}</span>
            </p>
            <p className="text-xs text-ink-400 mt-1">Waiting for other players...</p>
          </div>
        )}

        {/* Show who has rolled */}
        <div className="space-y-1 mt-4">
          {combatants
            .filter((c) => c.is_player)
            .map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-1">
                <span className="text-xs text-ink-700">{c.name}</span>
                <span className={`text-xs font-mono ${c.initiative != null ? 'text-heal' : 'text-ink-400'}`}>
                  {c.initiative != null ? c.initiative : 'Waiting...'}
                </span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  // DM view — can roll for everyone
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase text-ink-500">Initiative Rolls</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleAutoRollAll}>
            <Dice6 size={14} className="mr-1" /> Auto-Roll Remaining
          </Button>
          {allRolled && (
            <Button size="sm" onClick={onStartCombat}>
              Start Combat
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {combatants.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-2 bg-parchment-50 border border-parchment-300 rounded"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 border"
              style={{
                backgroundColor: c.token_color,
                borderColor: c.is_player ? 'var(--color-gold-400)' : '#ef4444',
              }}
            />
            <span className={`text-sm font-display flex-1 ${c.is_player ? 'text-ink-900' : 'text-ink-700'}`}>
              {c.name}
              {c.is_player && <span className="text-[10px] text-gold-500 ml-1">PC</span>}
            </span>

            {c.initiative != null ? (
              <span className="font-mono text-sm font-bold text-gold-600 w-8 text-center">
                {c.initiative}
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={manualValues[c.id] ?? ''}
                  onChange={(e) =>
                    setManualValues((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  placeholder="—"
                  className="w-12 px-1 py-0.5 bg-parchment-50 border border-parchment-400 rounded font-mono text-xs text-center text-ink-900 focus:outline-none focus:border-gold-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSubmit(c.id)
                  }}
                />
                <button
                  onClick={() => handleRoll(c.id, c.initiative_bonus)}
                  className="p-1 text-ink-500 hover:text-gold-600 cursor-pointer"
                  title={`Roll d20${c.initiative_bonus !== 0 ? ` (${c.initiative_bonus > 0 ? '+' : ''}${c.initiative_bonus})` : ''}`}
                >
                  <Dice6 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
